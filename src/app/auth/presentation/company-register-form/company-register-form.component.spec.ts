import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CompanyRegisterFormComponent } from './company-register-form.component';
import { AuthService } from '../../domain/services/auth.service';
import { CompanyChoicesService } from '../../../profile-company/domain/services/company-choices.service';

describe('CompanyRegisterFormComponent', () => {
  let component: CompanyRegisterFormComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let choicesServiceSpy: jasmine.SpyObj<CompanyChoicesService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['registerCompany']);
    choicesServiceSpy = jasmine.createSpyObj('CompanyChoicesService', ['getCompanyChoices']);
    choicesServiceSpy.getCompanyChoices.and.returnValue(
      of({ industries: [{ value: 'tech', label: 'Tech' }], employee_counts: [{ value: '1-10', label: '1-10' }] } as any),
    );

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [CompanyRegisterFormComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CompanyChoicesService, useValue: choicesServiceSpy },
      ],
    });
    component = TestBed.createComponent(CompanyRegisterFormComponent).componentInstance;
  });

  function fillValid() {
    component.registerForm.setValue({
      company_name: 'Acme',
      username: 'acme@example.com',
      password: 'Str0ngPass!',
      confirm_password: 'Str0ngPass!',
      industry: 'tech',
      employee_count: '1-10',
      description: '',
      website: '',
      phone: '',
      agree_terms: true,
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('initializes the form and loads choices', () => {
      component.ngOnInit();
      expect(component.registerForm.contains('company_name')).toBeTrue();
      expect(component.industryOptions.length).toBe(1);
      expect(component.employeeCountOptions.length).toBe(1);
      expect(component.isLoadingChoices).toBeFalse();
    });

    it('falls back to empty choice lists on error', () => {
      spyOn(console, 'error');
      choicesServiceSpy.getCompanyChoices.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(component.industryOptions).toEqual([]);
      expect(component.employeeCountOptions).toEqual([]);
      expect(component.isLoadingChoices).toBeFalse();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => component.ngOnInit());

    it('flags an invalid form without calling the service', () => {
      component.onSubmit();
      expect(component.errorMessages).toEqual([
        'Please fill in all required fields correctly.',
      ]);
      expect(authServiceSpy.registerCompany).not.toHaveBeenCalled();
    });

    it('registers and emits success', () => {
      fillValid();
      authServiceSpy.registerCompany.and.returnValue(of({}));
      let emitted = false;
      component.registerSuccess.subscribe(() => (emitted = true));

      component.onSubmit();

      expect(authServiceSpy.registerCompany).toHaveBeenCalled();
      const submitted = authServiceSpy.registerCompany.calls.mostRecent().args[0] as any;
      expect(submitted.agree_terms).toBeUndefined();
      expect(submitted.confirm_password).toBe('Str0ngPass!');
      expect(emitted).toBeTrue();
    });

    it('surfaces backend error messages split by newline', () => {
      fillValid();
      authServiceSpy.registerCompany.and.returnValue(
        throwError(() => ({ message: 'line1\nline2' })),
      );
      component.onSubmit();
      expect(component.errorMessages).toEqual(['line1', 'line2']);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('step wizard', () => {
    beforeEach(() => component.ngOnInit());

    it('nextStep advances only when the current step is valid', () => {
      component.nextStep();
      expect(component.currentStep).toBe(1);

      component.registerForm.get('company_name')?.setValue('Acme');
      component.nextStep();
      expect(component.currentStep).toBe(2);
    });

    it('nextStep does not exceed totalSteps', () => {
      component.currentStep = 4;
      component.registerForm.patchValue({ agree_terms: true });
      component.nextStep();
      expect(component.currentStep).toBe(4);
    });

    it('previousStep decrements but not below 1', () => {
      component.previousStep();
      expect(component.currentStep).toBe(1);
      component.currentStep = 2;
      component.previousStep();
      expect(component.currentStep).toBe(1);
    });

    it('goToStep jumps backward freely', () => {
      component.currentStep = 3;
      component.goToStep(1);
      expect(component.currentStep).toBe(1);
    });

    it('goToStep refuses to jump forward past an incomplete step', () => {
      component.goToStep(3);
      expect(component.currentStep).toBe(1);
    });

    it('goToStep ignores out-of-range steps', () => {
      component.goToStep(0);
      expect(component.currentStep).toBe(1);
      component.goToStep(5);
      expect(component.currentStep).toBe(1);
    });

    it('isCurrentStepValid covers step 3 password mismatch', () => {
      component.currentStep = 3;
      component.registerForm.get('password')?.setValue('Str0ngPass!');
      component.registerForm.get('confirm_password')?.setValue('Other!');
      expect(component.isCurrentStepValid()).toBeFalse();
    });

    it('isCurrentStepValid returns false for an unknown step', () => {
      component.currentStep = 99;
      expect(component.isCurrentStepValid()).toBeFalse();
    });

    it('isStepCompleted checks a step without mutating currentStep', () => {
      component.currentStep = 3;
      component.registerForm.get('company_name')?.setValue('Acme');
      const result = component.isStepCompleted(1);
      expect(result).toBeTrue();
      expect(component.currentStep).toBe(3);
    });

    it('getProgress returns the percentage complete', () => {
      component.currentStep = 2;
      expect(component.getProgress()).toBe(50);
    });
  });

  describe('preventNonAlphabetic', () => {
    it('prevents default for a non-alphabetic charCode', () => {
      const event = { charCode: 53, preventDefault: jasmine.createSpy() } as any;
      component.preventNonAlphabetic(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('allows an alphabetic charCode', () => {
      const event = { charCode: 65, preventDefault: jasmine.createSpy() } as any;
      component.preventNonAlphabetic(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('capitalizeInput capitalizes each word and updates the bound control', () => {
    component.ngOnInit();
    const input = document.createElement('input');
    input.setAttribute('formControlName', 'company_name');
    input.value = 'acme labs';
    component.capitalizeInput({ target: input } as unknown as Event);
    expect(input.value).toBe('Acme Labs');
    expect(component.registerForm.get('company_name')?.value).toBe('Acme Labs');
  });
});
