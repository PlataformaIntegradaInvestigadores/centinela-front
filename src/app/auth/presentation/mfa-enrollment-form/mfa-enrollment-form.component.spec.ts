import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MfaEnrollmentFormComponent } from './mfa-enrollment-form.component';
import { AuthService } from '../../domain/services/auth.service';

describe('MfaEnrollmentFormComponent', () => {
  let component: MfaEnrollmentFormComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['setupMfa', 'confirmMfa']);
    authServiceSpy.setupMfa.and.returnValue(of({ qr_code: 'qr' } as any));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [MfaEnrollmentFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    component = TestBed.createComponent(MfaEnrollmentFormComponent).componentInstance;
    component.challenge = 'ch-1';
    component.expiresIn = 300;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('starts the timer and loads setup data', fakeAsync(() => {
      component.ngOnInit();
      tick();
      expect(component.setupData).toEqual({ qr_code: 'qr' } as any);
      expect(component.isLoadingSetup).toBeFalse();
      discardPeriodicTasks();
    }));

    it('counts down remainingSeconds and stops at zero', fakeAsync(() => {
      component.expiresIn = 2;
      component.ngOnInit();
      tick(1000);
      expect(component.remainingSeconds).toBe(1);
      tick(1000);
      expect(component.remainingSeconds).toBe(0);
      expect(component.challengeExpired).toBeTrue();
      discardPeriodicTasks();
    }));
  });

  describe('loadEnrollmentSetup (via retrySetup)', () => {
    it('restarts login when there is no challenge', () => {
      component.challenge = '';
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));
      component.retrySetup();
      expect(backMessage).toContain('no longer available');
    });

    it('restarts login when the challenge already expired', () => {
      component.remainingSeconds = 0;
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));
      component.retrySetup();
      expect(backMessage).toContain('expired');
    });

    it('restarts login when setup fails', () => {
      component.remainingSeconds = 60;
      authServiceSpy.setupMfa.and.returnValue(throwError(() => new Error('boom')));
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));
      component.retrySetup();
      expect(backMessage).toContain('no longer valid');
      expect(component.isLoadingSetup).toBeFalse();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.remainingSeconds = 60;
    });

    it('restarts login when the challenge expired', () => {
      component.remainingSeconds = 0;
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));
      component.onSubmit();
      expect(backMessage).toContain('expired');
    });

    it('requires a valid code before submitting', () => {
      component.onSubmit();
      expect(component.errorMessages).toEqual(['Enter the 6-digit verification code.']);
      expect(authServiceSpy.confirmMfa).not.toHaveBeenCalled();
    });

    it('confirms mfa and emits completed on success', () => {
      component.mfaForm.setValue({ code: '123456' });
      authServiceSpy.confirmMfa.and.returnValue(of({} as any));
      let completed = false;
      component.completed.subscribe(() => (completed = true));

      component.onSubmit();

      expect(authServiceSpy.confirmMfa).toHaveBeenCalledWith('ch-1', '123456');
      expect(completed).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
    });

    it('restarts login if the challenge expired by the time the error arrives', () => {
      component.mfaForm.setValue({ code: '123456' });
      authServiceSpy.confirmMfa.and.callFake(() => {
        component.remainingSeconds = 0;
        return throwError(() => new Error('boom'));
      });
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));

      component.onSubmit();

      expect(backMessage).toContain('expired');
    });

    it('restarts login after exceeding the failed attempt limit', () => {
      component.mfaForm.setValue({ code: '123456' });
      authServiceSpy.confirmMfa.and.returnValue(throwError(() => new Error('boom')));
      let backMessage: string | undefined;
      component.back.subscribe((msg) => (backMessage = msg));

      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      expect(backMessage).toContain('Too many invalid MFA codes');
    });

    it('shows remaining attempts before hitting the limit', () => {
      component.mfaForm.setValue({ code: '123456' });
      authServiceSpy.confirmMfa.and.returnValue(throwError(() => new Error('boom')));

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
