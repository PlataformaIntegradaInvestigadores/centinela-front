import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MfaVerifyFormComponent } from './mfa-verify-form.component';
import { AuthService } from '../../domain/services/auth.service';

describe('MfaVerifyFormComponent', () => {
  let component: MfaVerifyFormComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['verifyMfa']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [MfaVerifyFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    component = TestBed.createComponent(MfaVerifyFormComponent).componentInstance;
    component.challenge = 'ch-1';
    component.expiresIn = 300;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit starts the countdown timer', fakeAsync(() => {
    component.expiresIn = 2;
    component.ngOnInit();
    tick(1000);
    expect(component.remainingSeconds).toBe(1);
    tick(1000);
    expect(component.remainingSeconds).toBe(0);
    discardPeriodicTasks();
  }));

  describe('onSubmit', () => {
    it('restarts login when the challenge already expired', () => {
      component.remainingSeconds = 0;
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));
      component.onSubmit();
      expect(backMessage).toContain('expired');
    });

    it('requires a valid code before submitting', () => {
      component.remainingSeconds = 60;
      component.onSubmit();
      expect(component.errorMessages).toEqual(['Enter the 6-digit verification code.']);
      expect(authServiceSpy.verifyMfa).not.toHaveBeenCalled();
    });

    it('verifies mfa and emits completed on success', () => {
      component.remainingSeconds = 60;
      component.verifyForm.setValue({ code: '654321' });
      authServiceSpy.verifyMfa.and.returnValue(of({} as any));
      let completed = false;
      component.completed.subscribe(() => (completed = true));

      component.onSubmit();

      expect(authServiceSpy.verifyMfa).toHaveBeenCalledWith('ch-1', '654321');
      expect(completed).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
    });

    it('restarts login if the challenge expires by the time the error arrives', () => {
      component.remainingSeconds = 60;
      component.verifyForm.setValue({ code: '654321' });
      authServiceSpy.verifyMfa.and.callFake(() => {
        component.remainingSeconds = 0;
        return throwError(() => new Error('boom'));
      });
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));

      component.onSubmit();

      expect(backMessage).toContain('expired');
    });

    it('restarts login after exceeding the failed attempt limit', () => {
      component.remainingSeconds = 60;
      component.verifyForm.setValue({ code: '654321' });
      authServiceSpy.verifyMfa.and.returnValue(throwError(() => new Error('boom')));
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));

      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      expect(backMessage).toContain('Too many invalid MFA codes');
    });

    it('shows remaining attempts before hitting the limit', () => {
      component.remainingSeconds = 60;
      component.verifyForm.setValue({ code: '654321' });
      authServiceSpy.verifyMfa.and.returnValue(throwError(() => new Error('boom')));

      component.onSubmit();

      expect(component.errorMessages[0]).toContain('attempt');
    });
  });

  describe('challengeExpired / formattedRemainingTime', () => {
    it('reports expired at zero seconds', () => {
      component.remainingSeconds = 0;
      expect(component.challengeExpired).toBeTrue();
    });

    it('formats minutes and seconds with zero padding', () => {
      component.remainingSeconds = 65;
      expect(component.formattedRemainingTime).toBe('1:05');
    });
  });
});
