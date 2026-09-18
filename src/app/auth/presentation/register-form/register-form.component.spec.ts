import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RegisterFormComponent } from './register-form.component';
import { AuthService } from '../../domain/services/auth.service';

describe('RegisterFormComponent', () => {
  let component: RegisterFormComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [RegisterFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    component = TestBed.createComponent(RegisterFormComponent).componentInstance;
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function fillValid() {
    component.registerForm.setValue({
      first_name: 'Ana',
      last_name: 'Perez',
      username: 'ana@example.com',
      password: 'Str0ngPass!',
      confirm_password: 'Str0ngPass!',
      scopus_id: '',
      agree_terms: true,
    });
  }

  describe('passwordChecklist', () => {
    it('reports all items unmet on an empty password', () => {
      const checklist = component.passwordChecklist;
      expect(checklist.every((c) => !c.passed)).toBeTrue();
    });

    it('flags a purely numeric password', () => {
      component.registerForm.get('password')?.setValue('12345678');
      const item = component.passwordChecklist.find((c) => c.label === 'Not entirely numeric');
      expect(item?.passed).toBeFalse();
    });

    it('flags a common weak password', () => {
      component.registerForm.get('password')?.setValue('password123');
      const item = component.passwordChecklist.find((c) => c.label === 'Not a common password');
      expect(item?.passed).toBeFalse();
    });

    it('flags a password similar to personal info', () => {
      component.registerForm.get('first_name')?.setValue('Alexander');
      component.registerForm.get('password')?.setValue('Alexander1');
      const item = component.passwordChecklist.find(
        (c) => c.label === 'Not similar to your personal information',
      );
      expect(item?.passed).toBeFalse();
    });

    it('passes every rule for a strong, non-matching, matching-confirmation password', () => {
      fillValid();
      expect(component.passwordChecklist.every((c) => c.passed)).toBeTrue();
    });

    it('flags mismatched confirmation', () => {
      component.registerForm.get('password')?.setValue('Str0ngPass!');
      component.registerForm.get('confirm_password')?.setValue('Other!');
      const item = component.passwordChecklist.find((c) => c.label === 'Passwords match');
      expect(item?.passed).toBeFalse();
    });
  });

  describe('onSubmit', () => {
    it('flags an invalid form without calling the service', () => {
      component.onSubmit();
      expect(component.errorMessages).toEqual([
        'Please fill in all required fields correctly.',
      ]);
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('registers and emits success, stripping confirm_password/agree_terms', () => {
      fillValid();
      authServiceSpy.register.and.returnValue(of({}));
      let emitted = false;
      component.registerSuccess.subscribe(() => (emitted = true));

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalled();
      const submitted = authServiceSpy.register.calls.mostRecent().args[0] as any;
      expect(submitted.confirm_password).toBeUndefined();
      expect(submitted.agree_terms).toBeUndefined();
      expect(submitted.scopus_id).toBeNull();
      expect(emitted).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('surfaces backend error messages split by newline', () => {
      fillValid();
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ message: 'line1\nline2' })),
      );

      component.onSubmit();

      expect(component.errorMessages).toEqual(['line1', 'line2']);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('preventNonAlphabetic', () => {
    it('prevents default for a non-alphabetic key', () => {
      const event = { which: 53, preventDefault: jasmine.createSpy() } as any;
      component.preventNonAlphabetic(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('allows an alphabetic key', () => {
      const event = { which: 65, preventDefault: jasmine.createSpy() } as any;
      component.preventNonAlphabetic(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('capitalizeInput capitalizes each word and updates the bound control', () => {
    component.registerForm.get('first_name')?.setValue('');
    const input = document.createElement('input');
    input.setAttribute('formControlName', 'first_name');
    input.value = 'ana maria';
    component.capitalizeInput({ target: input } as unknown as Event);
    expect(input.value).toBe('Ana Maria');
    expect(component.registerForm.get('first_name')?.value).toBe('Ana Maria');
  });

  describe('preventNonNumeric', () => {
    it('prevents default for a non-numeric key', () => {
      const event = { which: 65, preventDefault: jasmine.createSpy() } as any;
      component.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('allows a numeric key', () => {
      const event = { which: 53, preventDefault: jasmine.createSpy() } as any;
      component.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('togglePasswordVisibility flips showPassword', () => {
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });

  it('toggleConfirmPasswordVisibility flips showConfirmPassword', () => {
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeTrue();
  });
});
