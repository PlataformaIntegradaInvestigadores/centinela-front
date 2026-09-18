import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginFormComponent } from './login-form.component';
import { AuthService } from '../../domain/services/auth.service';
import { ErrorService } from '../../domain/services/error.service';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'isMfaChallengeResponse',
      'getUserId',
      'getCompanyId',
    ]);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', ['processErrors']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginFormComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(LoginFormComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit resets form, errors and mfa state', () => {
    component.errorMessages = ['x'];
    component.authStep = 'verify';
    component.ngOnInit();
    expect(component.errorMessages).toEqual([]);
    expect(component.authStep).toBe('credentials');
  });

  describe('onSubmit', () => {
    it('flags all fields required for an invalid form', () => {
      component.onSubmit();
      expect(component.errorMessages).toEqual([
        'Please fill in all required fields correctly.',
      ]);
    });

    it('completes login directly when no mfa challenge is returned', fakeAsync(() => {
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      authServiceSpy.login.and.returnValue(of({} as any));
      authServiceSpy.isMfaChallengeResponse.and.returnValue(false);
      authServiceSpy.getUserId.and.returnValue('u-1');

      let emitted = false;
      component.loginSuccess.subscribe(() => (emitted = true));
      component.onSubmit();
      tick(100);

      expect(emitted).toBeTrue();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/u-1/about-me']);
      expect(component.isLoading).toBeFalse();
    }));

    it('navigates to company profile for company userType', fakeAsync(() => {
      component.userType = 'company';
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      authServiceSpy.login.and.returnValue(of({} as any));
      authServiceSpy.isMfaChallengeResponse.and.returnValue(false);
      authServiceSpy.getCompanyId.and.returnValue('c-1');

      component.onSubmit();
      tick(100);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/company/c-1']);
    }));

    it('switches to enrollment step for mfa_enrollment_required', () => {
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      authServiceSpy.login.and.returnValue(
        of({ status: 'mfa_enrollment_required', mfa_challenge: 'ch-1', expires_in: 120 } as any),
      );
      authServiceSpy.isMfaChallengeResponse.and.returnValue(true);

      component.onSubmit();

      expect(component.authStep).toBe('enrollment');
      expect(component.mfaChallenge).toBe('ch-1');
      expect(component.mfaExpiresIn).toBe(120);
    });

    it('switches to verify step for other mfa statuses', () => {
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      authServiceSpy.login.and.returnValue(
        of({ status: 'mfa_required', mfa_challenge: 'ch-2' } as any),
      );
      authServiceSpy.isMfaChallengeResponse.and.returnValue(true);

      component.onSubmit();

      expect(component.authStep).toBe('verify');
      expect(component.mfaExpiresIn).toBe(300);
    });

    it('does not resubmit while already loading', () => {
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      component.isLoading = true;
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('processes errors and appends a warning after repeated failures', () => {
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      authServiceSpy.login.and.returnValue(throwError(() => ({ error: {} })));
      errorServiceSpy.processErrors.and.returnValue(['bad creds']);
      spyOn(console, 'error');

      component.onSubmit();
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      component.onSubmit();
      component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
      component.onSubmit();

      expect(component.errorMessages).toContain(
        'Too many failed attempts may temporarily block sign-in. Wait a few minutes before trying again.',
      );
    });
  });

  it('onMfaCompleted completes login', () => {
    authServiceSpy.getUserId.and.returnValue(null);
    spyOn(component.loginSuccess, 'emit');
    component.onMfaCompleted();
    expect(component.loginSuccess.emit).not.toHaveBeenCalled();
  });

  it('backToCredentials resets mfa state and password, sets optional message', () => {
    component.loginForm.setValue({ username: 'a@b.com', password: 'secret1' });
    component.authStep = 'verify';
    component.backToCredentials('expired');
    expect(component.authStep).toBe('credentials');
    expect(component.loginForm.value.password).toBeNull();
    expect(component.errorMessages).toEqual(['expired']);
  });

  it('backToCredentials without a message clears errors', () => {
    component.backToCredentials();
    expect(component.errorMessages).toEqual([]);
  });

  it('togglePasswordVisibility flips showPassword', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });
});
