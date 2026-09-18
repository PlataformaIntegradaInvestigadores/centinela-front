import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { DataNavComponent } from './data-nav.component';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

describe('DataNavComponent', () => {
  let component: DataNavComponent;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['changeUser']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    TestBed.configureTestingModule({
      declarations: [DataNavComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UserDataService, useValue: userDataServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    component = TestBed.createComponent(DataNavComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggleNav flips navOpen', () => {
    expect(component.navOpen).toBeFalse();
    component.toggleNav();
    expect(component.navOpen).toBeTrue();
  });

  describe('ngOnChanges', () => {
    it('propagates the user and refreshes isLoggedIn when user changes', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      component.user = { id: 'u-1' } as any;

      component.ngOnChanges({ user: new SimpleChange(null, component.user, true) });

      expect(userDataServiceSpy.changeUser).toHaveBeenCalledWith(component.user);
      expect(component.isLoggedIn).toBeTrue();
    });

    it('does nothing when an unrelated input changes', () => {
      component.ngOnChanges({ isOwnProfile: new SimpleChange(false, true, false) });
      expect(userDataServiceSpy.changeUser).not.toHaveBeenCalled();
    });
  });
});
