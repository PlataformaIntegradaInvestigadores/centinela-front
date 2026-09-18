import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, convertToParamMap } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserService } from 'src/app/profile/domain/services/user.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { UserProfile } from 'src/app/profile/domain/entities/user.interfaces';
import { Author } from 'src/app/shared/interfaces/author.interface';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;
  let titleServiceSpy: jasmine.SpyObj<Title>;
  let routerEvents$: Subject<any>;
  let routerSpy: jasmine.SpyObj<Router>;
  let paramsSubject: Subject<any>;

  const build = (queryParams: Record<string, string> = {}) => {
    TestBed.resetTestingModule();
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['setUser']);
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getAuthorById']);
    titleServiceSpy = jasmine.createSpyObj('Title', ['setTitle']);
    routerEvents$ = new Subject();
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl'], { events: routerEvents$ });
    paramsSubject = new Subject();

    TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
          },
        },
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserDataService, useValue: userDataServiceSpy },
        { provide: Title, useValue: titleServiceSpy },
        { provide: AuthorService, useValue: authorServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(ProfileComponent).componentInstance;
  };

  beforeEach(() => build());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('sets returnToResultsUrl when it starts with /home', () => {
      build({ returnUrl: '/home/foo' });
      component.ngOnInit();
      expect(component.returnToResultsUrl).toBe('/home/foo');
    });

    it('ignores a returnUrl not starting with /home', () => {
      build({ returnUrl: '/other' });
      component.ngOnInit();
      expect(component.returnToResultsUrl).toBeNull();
    });

    it('loads user data by non-numeric route id', () => {
      authServiceSpy.getUserId.and.returnValue('u42');
      userServiceSpy.getUserById.and.returnValue(of({ first_name: 'A', last_name: 'B' } as UserProfile));
      component.ngOnInit();
      paramsSubject.next({ id: 'u42' });
      expect(userServiceSpy.getUserById).toHaveBeenCalledWith('u42');
      expect(component.user?.first_name).toBe('A');
      expect(component.isOwnProfile).toBeTrue();
      expect(userDataServiceSpy.setUser).toHaveBeenCalled();
      expect(titleServiceSpy.setTitle).toHaveBeenCalledWith('A B');
    });

    it('loads author data directly for a numeric scopus-id route param', () => {
      authorServiceSpy.getAuthorById.and.returnValue(
        of({ first_name: 'X', last_name: 'Y' } as Author),
      );
      component.ngOnInit();
      paramsSubject.next({ id: '123456' });
      expect(authorServiceSpy.getAuthorById).toHaveBeenCalledWith('123456');
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();
      expect(component.authorCentinela?.first_name).toBe('X');
      expect(component.user).toBeNull();
    });

    it('falls back to author data when user lookup fails', () => {
      spyOn(console, 'error');
      userServiceSpy.getUserById.and.returnValue(throwError(() => new Error('boom')));
      authorServiceSpy.getAuthorById.and.returnValue(
        of({ first_name: 'X', last_name: 'Y' } as Author),
      );
      component.ngOnInit();
      paramsSubject.next({ id: 'u1' });
      expect(authorServiceSpy.getAuthorById).toHaveBeenCalledWith('u1');
      expect(component.authorCentinela?.first_name).toBe('X');
    });

    it('logs on author-load failure', () => {
      spyOn(console, 'error');
      authorServiceSpy.getAuthorById.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      paramsSubject.next({ id: '999' });
      expect(console.error).toHaveBeenCalled();
    });

    it('scrolls into view on a matching NavigationEnd route', () => {
      component.ngOnInit();
      const fakeEl = { scrollIntoView: jasmine.createSpy() };
      (component as any).tabsTop = { nativeElement: fakeEl };

      routerEvents$.next(new NavigationEnd(1, '/profile/1/network', '/profile/1/network'));

      expect(fakeEl.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
    });

    it('does not scroll for a non-matching NavigationEnd route', () => {
      component.ngOnInit();
      const fakeEl = { scrollIntoView: jasmine.createSpy() };
      (component as any).tabsTop = { nativeElement: fakeEl };

      routerEvents$.next(new NavigationEnd(1, '/profile/1', '/profile/1'));

      expect(fakeEl.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes the route subscription', () => {
      component.ngOnInit();
      const spy = spyOn((component as any).routeSub, 'unsubscribe');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('backToResults', () => {
    it('navigates when returnToResultsUrl is set', () => {
      component.returnToResultsUrl = '/home/results';
      component.backToResults();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home/results');
    });

    it('does nothing without a returnToResultsUrl', () => {
      component.returnToResultsUrl = null;
      component.backToResults();
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('closeEditModal / saveEditPost', () => {
    it('closes the edit modal and clears postToEdit', () => {
      component.editModalVisible = true;
      component.postToEdit = { id: 'p1' } as any;
      component.closeEditModal();
      expect(component.editModalVisible).toBeFalse();
      expect(component.postToEdit).toBeNull();
    });

    it('saveEditPost closes the modal', () => {
      component.editModalVisible = true;
      component.saveEditPost({ content: 'x', tags: [] });
      expect(component.editModalVisible).toBeFalse();
    });
  });
});
