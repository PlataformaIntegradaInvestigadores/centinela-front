import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Company, CompanyUpdate } from 'src/app/profile-company/domain/entities/company.interface';
import { CompanyService } from 'src/app/profile-company/domain/services/company.service';
import {
  CompanyChoicesService,
  ChoiceOption,
} from 'src/app/profile-company/domain/services/company-choices.service';

@Component({
  selector: 'app-edit-company-profile-modal',
  templateUrl: './edit-company-profile-modal.component.html',
  styleUrls: ['./edit-company-profile-modal.component.css'],
})
export class EditCompanyProfileModalComponent implements OnInit, OnChanges {
  @Input() company: Company | null = null;
  @Input() isVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveCompany = new EventEmitter<Company>();

  editForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedLogo: File | null = null;
  logoPreview: string | null = null;

  industries: ChoiceOption[] = [];
  employeeCounts: ChoiceOption[] = [];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private companyChoicesService: CompanyChoicesService,
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCompanyChoices();
    if (this.company) {
      this.initializeForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['company'] && changes['company'].currentValue && this.editForm) {
      console.log('Company changed:', changes['company'].currentValue);
      this.initializeForm();
    }
  }

  private loadCompanyChoices(): void {
    this.companyChoicesService.getCompanyChoices().subscribe({
      next: (choices) => {
        this.industries = choices.industries;
        this.employeeCounts = choices.employee_counts;
      },
      error: (error) => {
        console.error('Error loading company choices:', error);
        // Fallback to default values if service fails
        this.industries = [
          { value: 'technology', label: 'Tecnología' },
          { value: 'health', label: 'Salud' },
          { value: 'finance', label: 'Finanzas' },
          { value: 'education', label: 'Educación' },
          { value: 'other', label: 'Otro' },
        ];
        this.employeeCounts = [
          { value: '1-10', label: '1-10 empleados' },
          { value: '11-50', label: '11-50 empleados' },
          { value: '51-200', label: '51-200 empleados' },
          { value: '201-500', label: '201-500 empleados' },
          { value: '501-1000', label: '501-1000 empleados' },
          { value: '1000+', label: 'Más de 1000 empleados' },
        ];
      },
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      company_name: ['', [Validators.required, Validators.minLength(2)]],
      industry: ['', Validators.required],
      description: [''],
      website: [''],
      phone: [''],
      address: [''],
      founded_year: ['', [Validators.min(1800), Validators.max(new Date().getFullYear())]],
      employee_count: [''],
    });
  }

  private initializeForm(): void {
    if (this.company) {
      console.log('Initializing form with company:', this.company);
      this.editForm.patchValue({
        company_name: this.company.company_name || '',
        industry: this.company.industry || '',
        description: this.company.description || '',
        website: this.company.website || '',
        phone: this.company.phone || '',
        address: this.company.address || '',
        founded_year: this.company.founded_year || '',
        employee_count: this.company.employee_count || '',
      });

      // Set logo preview if exists
      if (this.company.logo) {
        this.logoPreview = this.company.logo;
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor selecciona un archivo de imagen válido.';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'El archivo debe ser menor a 5MB.';
        return;
      }

      this.selectedLogo = file;
      this.errorMessage = '';

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.selectedLogo = null;
    this.logoPreview = null;
    // Reset file input
    const fileInput = document.getElementById('logo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.company && this.company.id) {
      this.isLoading = true;
      this.errorMessage = '';

      console.log('Submitting with company ID:', this.company.id);

      const updateData: CompanyUpdate = {
        ...this.editForm.value,
      };

      // Add logo if selected
      if (this.selectedLogo) {
        updateData.logo = this.selectedLogo;
      }

      this.companyService.updateCompanyProfile(this.company.id, updateData).subscribe({
        next: (updatedCompany: Company) => {
          this.isLoading = false;
          console.log('Profile updated successfully:', updatedCompany);

          // Ensure ID is present in the response
          if (!updatedCompany.id && this.company) {
            updatedCompany.id = this.company.id;
          }

          this.saveCompany.emit(updatedCompany);
          this.close();
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error updating company profile:', error);
          this.errorMessage =
            error.error?.message || 'Error al actualizar el perfil de la empresa.';
        },
      });
    } else {
      if (!this.company?.id) {
        this.errorMessage = 'Error: ID de empresa no encontrado.';
        return;
      }
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach((key) => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
  }

  close(): void {
    this.isVisible = false;
    this.errorMessage = '';
    this.selectedLogo = null;
    this.logoPreview = this.company?.logo || null;

    // Reset form to original values
    if (this.company) {
      this.initializeForm();
    }

    this.closeModal.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido.`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres.`;
      }
      if (field.errors['min']) {
        return `El año debe ser mayor a ${field.errors['min'].min}.`;
      }
      if (field.errors['max']) {
        return `El año debe ser menor a ${field.errors['max'].max}.`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      company_name: 'Nombre de la empresa',
      industry: 'Industria',
      description: 'Descripción',
      website: 'Sitio web',
      phone: 'Teléfono',
      address: 'Dirección',
      founded_year: 'Año de fundación',
      employee_count: 'Número de empleados',
    };
    return labels[fieldName] || fieldName;
  }
}
