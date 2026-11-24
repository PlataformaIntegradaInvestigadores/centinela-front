import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthModalService } from 'src/app/auth/domain/services/auth-modal.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let authModalSpy: jasmine.SpyObj<AuthModalService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'isUser',
      'isCompany',
      'getUserType',
      'getUserId',
      'getCompanyId',
      'getCurrentUserId',
      'getUsers',
      'logout',
    ]);
    authModalSpy = jasmine.createSpyObj('AuthModalService', ['openLogin', 'openRegister']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/home' });
    // logout() chains window.location.reload() onto navigate()'s promise —
    // never resolve it here so a real reload can't fire mid test-run.
    routerSpy.navigate.and.returnValue(new Promise<boolean>(() => {}));

    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AuthModalService, useValue: authModalSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('shows the login buttons and skips loading users when logged out', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      component.ngOnInit();
      expect(component.showLogin).toBeTrue();
      expect(authServiceSpy.getUsers).not.toHaveBeenCalled();
    });

    it('hides login buttons and loads users for a logged-in researcher', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.isUser.and.returnValue(true);
      authServiceSpy.getUsers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.showLogin).toBeFalse();
      expect(authServiceSpy.getUsers).toHaveBeenCalled();
    });

    it('does not load users for a logged-in company', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.isUser.and.returnValue(false);
      component.ngOnInit();
      expect(authServiceSpy.getUsers).not.toHaveBeenCalled();
    });
  });

  describe('toggleNav / search / user menu', () => {
    it('toggles navOpen', () => {
      expect(component.navOpen).toBeFalse();
      component.toggleNav();
      expect(component.navOpen).toBeTrue();
    });

    it('opens and closes search, resetting query and results', () => {
      component.searchQuery = 'ada';
      component.filteredUsers = [{ id: '1' } as any];
      component.openSearch();
      expect(component.searchOpen).toBeTrue();
      component.closeSearch();
      expect(component.searchOpen).toBeFalse();
      expect(component.searchQuery).toBe('');
      expect(component.filteredUsers).toEqual([]);
    });

    it('toggles the user menu', () => {
      expect(component.userMenuOpen).toBeFalse();
      component.toggleUserMenu();
      expect(component.userMenuOpen).toBeTrue();
    });
  });

  describe('onDocumentClick', () => {
    it('closes search when clicking outside the search container', () => {
      spyOn(component, 'closeSearch');
      const event = { target: document.createElement('div') } as unknown as MouseEvent;
      component.onDocumentClick(event);
      expect(component.closeSearch).toHaveBeenCalled();
    });

    it('closes the user menu when clicking outside the dropdown container', () => {
      component.userMenuOpen = true;
      const event = { target: document.createElement('div') } as unknown as MouseEvent;
      component.onDocumentClick(event);
      expect(component.userMenuOpen).toBeFalse();
    });
  });

  describe('onKeyDown', () => {
    it('closes the user menu on Escape', () => {
      component.userMenuOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(component.userMenuOpen).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does nothing for other keys', () => {
      component.userMenuOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);
      expect(component.userMenuOpen).toBeTrue();
    });
  });

  describe('profile', () => {
    it('navigates to the company profile when userType is company', () => {
      authServiceSpy.getUserType.and.returnValue('company');
      authServiceSpy.getCompanyId.and.returnValue('c-1');
      component.profile();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/company/c-1']);
    });

    it('navigates to the researcher profile when userType is user', () => {
      authServiceSpy.getUserType.and.returnValue('user');
      authServiceSpy.getUserId.and.returnValue('u-1');
      component.profile();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/u-1/about-me']);
    });

    it('does not navigate when there is no id available', () => {
      authServiceSpy.getUserType.and.returnValue('user');
      authServiceSpy.getUserId.and.returnValue(null);
      component.profile();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('loadUsers', () => {
    it('populates users and filteredUsers on success', () => {
      const users = [{ id: '1', first_name: 'Ada', last_name: 'Lovelace' }] as any;
      authServiceSpy.getUsers.and.returnValue(of(users));
      component.loadUsers();
      expect(component.users).toEqual(users);
      expect(component.filteredUsers).toEqual(users);
    });

    it('resets users to empty on error', () => {
      authServiceSpy.getUsers.and.returnValue(throwError(() => new Error('boom')));
      component.loadUsers();
      expect(component.users).toEqual([]);
      expect(component.filteredUsers).toEqual([]);
    });
  });

  describe('filterUsers', () => {
    it('filters case-insensitively by full name', () => {
      component.users = [
        { id: '1', first_name: 'Ada', last_name: 'Lovelace' },
        { id: '2', first_name: 'Alan', last_name: 'Turing' },
      ] as any;
      component.searchQuery = 'turing';
      component.filterUsers();
      expect(component.filteredUsers.length).toBe(1);
      expect((component.filteredUsers[0] as any).id).toBe('2');
    });
  });

  it('generateUserGroupUrl builds the expected profile URL', () => {
    expect(component.generateUserGroupUrl('u-5')).toBe('/profile/u-5/about-me');
  });

  it('navigateToFeeds navigates to /feeds', () => {
    component.navigateToFeeds();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/feeds']);
  });

  describe('navigateToJobs', () => {
    it('navigates to /jobs/:id when a current user id exists', () => {
      authServiceSpy.getCurrentUserId.and.returnValue('u-9');
      component.navigateToJobs();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/jobs/u-9']);
    });

    it('does not navigate without a current user id', () => {
      authServiceSpy.getCurrentUserId.and.returnValue(null);
      component.navigateToJobs();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  it('isCompany / isUser delegate to AuthService', () => {
    authServiceSpy.isCompany.and.returnValue(true);
    authServiceSpy.isUser.and.returnValue(false);
    expect(component.isCompany()).toBeTrue();
    expect(component.isUser()).toBeFalse();
  });

  it('getUserType maps company/user to display labels', () => {
    authServiceSpy.getUserType.and.returnValue('company');
    expect(component.getUserType()).toBe('Company');
    authServiceSpy.getUserType.and.returnValue('user');
    expect(component.getUserType()).toBe('Researcher');
  });

  it('isJobsActive reflects whether the current URL includes /jobs', () => {
    expect(component.isJobsActive).toBeFalse();
  });

  describe('openLogin / openRegister', () => {
    it('delegates to AuthModalService', () => {
      component.openLogin();
      component.openRegister();
      expect(authModalSpy.openLogin).toHaveBeenCalled();
      expect(authModalSpy.openRegister).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('clears the session and navigates home', () => {
      component.logout();
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
  });
});
