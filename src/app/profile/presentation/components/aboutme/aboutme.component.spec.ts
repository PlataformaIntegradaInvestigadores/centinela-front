import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { AboutMeComponent } from './aboutme.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthModalService } from 'src/app/auth/domain/services/auth-modal.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';

describe('AboutMeComponent', () => {
  let component: AboutMeComponent;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let authModalSpy: jasmine.SpyObj<AuthModalService>;

  beforeEach(() => {
    userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['getUser']);
    userDataServiceSpy.getUser.and.returnValue(of(null));
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    authModalSpy = jasmine.createSpyObj('AuthModalService', ['openLogin', 'openRegister']);

    TestBed.configureTestingModule({
      declarations: [AboutMeComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UserDataService, useValue: userDataServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AuthModalService, useValue: authModalSpy },
      ],
    });
    component = TestBed.createComponent(AboutMeComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('subscribes to the current user and reads login state', () => {
      const user = { id: 'u-1' } as any;
      userDataServiceSpy.getUser.and.returnValue(of(user));
      authServiceSpy.isLoggedIn.and.returnValue(true);

      component.ngOnInit();

      expect(component.user).toBe(user);
      expect(component.isLoggedIn).toBeTrue();
    });
  });

  describe('checkScreenSize', () => {
    it('marks mobile view when the window is narrow', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(500);
      component.checkScreenSize();
      expect(component.isMobileView).toBeTrue();
    });

    it('marks desktop view when the window is wide', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1200);
      component.checkScreenSize();
      expect(component.isMobileView).toBeFalse();
    });
  });

  it('onResize re-checks screen size', () => {
    spyOn(component, 'checkScreenSize');
    component.onResize();
    expect(component.checkScreenSize).toHaveBeenCalled();
  });

  it('openLogin/openRegister delegate to AuthModalService', () => {
    component.openLogin();
    component.openRegister();
    expect(authModalSpy.openLogin).toHaveBeenCalled();
    expect(authModalSpy.openRegister).toHaveBeenCalled();
  });

  it('ngOnDestroy unsubscribes from the user subscription', () => {
    component.ngOnInit();
    spyOn((component as any).userSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect((component as any).userSubscription.unsubscribe).toHaveBeenCalled();
  });
});
