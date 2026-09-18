import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EditCompanyProfileModalComponent } from './edit-company-profile-modal.component';
import { CompanyService } from 'src/app/profile-company/domain/services/company.service';
import { CompanyChoicesService } from 'src/app/profile-company/domain/services/company-choices.service';
import { Company } from 'src/app/profile-company/domain/entities/company.interface';

describe('EditCompanyProfileModalComponent', () => {
  let component: EditCompanyProfileModalComponent;
  let companyServiceSpy: jasmine.SpyObj<CompanyService>;
  let choicesServiceSpy: jasmine.SpyObj<CompanyChoicesService>;

  const company: Company = {
    id: '1',
    company_name: 'Acme',
    industry: 'technology',
    description: 'desc',
    website: 'acme.com',
    phone: '123',
    address: 'addr',
    founded_year: 2000,
    employee_count: '1-10',
    logo: 'logo.png',
  } as Company;

  beforeEach(() => {
    companyServiceSpy = jasmine.createSpyObj('CompanyService', ['updateCompanyProfile']);
    choicesServiceSpy = jasmine.createSpyObj('CompanyChoicesService', ['getCompanyChoices']);
    choicesServiceSpy.getCompanyChoices.and.returnValue(
      of({ industries: [{ value: 'technology', label: 'Tecnologia' }], employee_counts: [] }),
    );

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [EditCompanyProfileModalComponent],
      providers: [
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: CompanyChoicesService, useValue: choicesServiceSpy },
      ],
    });
    component = TestBed.createComponent(EditCompanyProfileModalComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads choices and initializes the form when a company is set', () => {
      component.company = company;
      component.ngOnInit();
      expect(component.industries.length).toBe(1);
      expect(component.editForm.value.company_name).toBe('Acme');
    });

    it('falls back to default choices on error', () => {
      choicesServiceSpy.getCompanyChoices.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(component.industries.length).toBeGreaterThan(0);
      expect(component.employeeCounts.length).toBeGreaterThan(0);
    });

    it('does not initialize the form when there is no company', () => {
      component.company = null;
      component.ngOnInit();
      expect(component.editForm.value.company_name).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('reinitializes the form when company input changes', () => {
      component.company = company;
      component.ngOnChanges({
        company: { currentValue: company, previousValue: null, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(component.editForm.value.company_name).toBe('Acme');
    });

    it('ignores changes without a company key', () => {
      spyOn<any>(component, 'initializeForm');
      component.ngOnChanges({});
      expect((component as any).initializeForm).not.toHaveBeenCalled();
    });
  });

  describe('onFileSelected', () => {
    it('rejects a non-image file', () => {
      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      component.onFileSelected({ target: { files: [file] } });
      expect(component.errorMessage).toBe('Por favor selecciona un archivo de imagen válido.');
      expect(component.selectedLogo).toBeNull();
    });

    it('rejects a file over 5MB', () => {
      const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
      component.onFileSelected({ target: { files: [big] } });
      expect(component.errorMessage).toBe('El archivo debe ser menor a 5MB.');
    });

    it('accepts a valid image and sets a preview', (done) => {
      const file = new File(['x'], 'logo.png', { type: 'image/png' });
      component.onFileSelected({ target: { files: [file] } });
      expect(component.selectedLogo).toBe(file);
      expect(component.errorMessage).toBe('');
      setTimeout(() => {
        expect(component.logoPreview).toContain('data:');
        done();
      }, 50);
    });
  });

  describe('removeLogo', () => {
    it('clears the logo and resets the file input', () => {
      const input = document.createElement('input');
      input.id = 'logo-input';
      input.value = 'x';
      document.body.appendChild(input);

      component.selectedLogo = new File(['x'], 'a.png');
      component.logoPreview = 'data:...';
      component.removeLogo();

      expect(component.selectedLogo).toBeNull();
      expect(component.logoPreview).toBeNull();
      expect(input.value).toBe('');
      document.body.removeChild(input);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.company = company;
      component.ngOnInit();
    });

    it('submits the update and emits saveCompany + closeModal on success', () => {
      const updated = { ...company, id: '1' } as Company;
      companyServiceSpy.updateCompanyProfile.and.returnValue(of(updated));
      let saved: Company | undefined;
      let closed = false;
      component.saveCompany.subscribe((c) => (saved = c));
      component.closeModal.subscribe(() => (closed = true));

      component.onSubmit();

      expect(companyServiceSpy.updateCompanyProfile).toHaveBeenCalledWith('1', jasmine.any(Object));
      expect(saved).toEqual(updated);
      expect(closed).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('fills in the id when the response omits it', () => {
      companyServiceSpy.updateCompanyProfile.and.returnValue(of({} as Company));
      let saved: Company | undefined;
      component.saveCompany.subscribe((c) => (saved = c));

      component.onSubmit();

      expect(saved?.id).toBe('1');
    });

    it('includes the selected logo in the update payload', () => {
      const logo = new File(['x'], 'a.png');
      component.selectedLogo = logo;
      companyServiceSpy.updateCompanyProfile.and.returnValue(of(company));

      component.onSubmit();

      const arg = companyServiceSpy.updateCompanyProfile.calls.mostRecent().args[1] as any;
      expect(arg.logo).toBe(logo);
    });

    it('sets an error message on failure', () => {
      companyServiceSpy.updateCompanyProfile.and.returnValue(
        throwError(() => ({ error: { message: 'boom' } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('boom');
      expect(component.isLoading).toBeFalse();
    });

    it('uses a default error message when none is provided', () => {
      companyServiceSpy.updateCompanyProfile.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      expect(component.errorMessage).toBe('Error al actualizar el perfil de la empresa.');
    });

    it('marks controls touched and errors when the company has no id', () => {
      component.company = { ...company, id: '' } as Company;
      component.onSubmit();
      expect(component.errorMessage).toBe('Error: ID de empresa no encontrado.');
    });

    it('marks the form touched for an invalid form with a valid company id', () => {
      component.editForm.patchValue({ company_name: '', industry: '' });
      component.onSubmit();
      expect(component.editForm.get('company_name')?.touched).toBeTrue();
      expect(companyServiceSpy.updateCompanyProfile).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('resets state and emits closeModal', () => {
      component.company = company;
      component.ngOnInit();
      component.isVisible = true;
      component.errorMessage = 'x';
      component.selectedLogo = new File(['x'], 'a.png');
      let closed = false;
      component.closeModal.subscribe(() => (closed = true));

      component.close();

      expect(component.isVisible).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.selectedLogo).toBeNull();
      expect(component.logoPreview).toBe('logo.png');
      expect(closed).toBeTrue();
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => {
      component.company = company;
      component.ngOnInit();
    });

    it('returns empty string when the field has no errors', () => {
      expect(component.getFieldError('company_name')).toBe('');
    });

    it('returns a required message', () => {
      const control = component.editForm.get('company_name')!;
      control.setValue('');
      control.markAsTouched();
      expect(component.getFieldError('company_name')).toContain('requerido');
    });

    it('returns a minlength message', () => {
      const control = component.editForm.get('company_name')!;
      control.setValue('a');
      control.markAsTouched();
      expect(component.getFieldError('company_name')).toContain('al menos');
    });

    it('returns a min/max year message', () => {
      const control = component.editForm.get('founded_year')!;
      control.setValue(1700);
      control.markAsTouched();
      expect(component.getFieldError('founded_year')).toContain('mayor a');

      control.setValue(9999);
      control.markAsTouched();
      expect(component.getFieldError('founded_year')).toContain('menor a');
    });
  });
});
