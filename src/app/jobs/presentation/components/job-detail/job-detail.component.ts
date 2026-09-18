import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Job } from 'src/app/jobs/domain/entities/job.interface';
import { Application, ApplicationCreate } from 'src/app/jobs/domain/entities/application.interface';
import { ApplicationService } from 'src/app/jobs/domain/services/application.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css'],
})
export class JobDetailComponent implements OnChanges {
  @Input() job: Job | null = null;
  @Input() showCompanyActions: boolean = false;

  @Output() applicationSubmitted = new EventEmitter<void>();
  @Output() editJob = new EventEmitter<Job>();
  @Output() deleteJob = new EventEmitter<Job>();

  // ✅ NUEVO: Propiedades para aplicaciones
  public jobApplications: Application[] = [];
  public applicationsLoading: boolean = false;

  // Propiedades existentes del modal de aplicación
  showApplicationModal = false;
  isSubmitting = false;
  selectedFile: File | null = null;
  applicationData: any = { job: 0 };

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  // ✅ NUEVO: Detectar cambios en el trabajo
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job?.id && this.isCompany) {
      console.log('Loading applications for job:', this.job.id);
      this.loadJobApplications(this.job.id);
    }
  }

  // ✅ NUEVO: Cargar aplicaciones específicas del trabajo
  private loadJobApplications(jobId: number): void {
    this.applicationsLoading = true;
    this.jobApplications = []; // Limpiar aplicaciones anteriores

    this.applicationService.getCompanyApplications({ job_id: jobId }).subscribe({
      next: (applications: Application[]) => {
        console.log('Applications received:', applications);
        this.jobApplications = applications;
        this.applicationsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading job applications:', error);
        this.jobApplications = [];
        this.applicationsLoading = false;
      },
    });
  }

  // ✅ NUEVO: Verificar si hay CV válido
  public hasValidResumeFile(application: any): boolean {
    if (!application?.resume_file) {
      return false;
    }

    if (typeof application.resume_file === 'string') {
      return application.resume_file.trim().length > 0;
    }

    return true;
  }

  // ✅ NUEVO: Manejar cambio de estado
  public onStatusChange(event: Event, applicationId: number): void {
    const target = event.target as HTMLSelectElement;
    if (target && this.job?.id) {
      this.updateApplicationStatus(applicationId, target.value);
    }
  }

  // ✅ NUEVO: Actualizar estado de aplicación
  private updateApplicationStatus(applicationId: number, newStatus: string): void {
    this.applicationService
      .updateApplication(applicationId, {
        status: newStatus as any,
      })
      .subscribe({
        next: (updatedApplication: Application) => {
          // Actualizar la aplicación en la lista local
          const index = this.jobApplications.findIndex((app) => app.id === applicationId);
          if (index !== -1) {
            this.jobApplications[index] = updatedApplication;
          }
          console.log('Application status updated:', updatedApplication);
        },
        error: (error: any) => {
          console.error('Error updating application status:', error);
          alert('Error updating the application status');
        },
      });
  }

  // Propiedades computadas
  get isCompany(): boolean {
    const companyId = this.authService.getCompanyId();
    return !!companyId;
  }

  get isResearcher(): boolean {
    const userId = this.authService.getUserId();
    const companyId = this.authService.getCompanyId();
    return !!userId && !companyId;
  }

  // Métodos existentes (mantén todos tus métodos actuales)
  getFullFileUrl(relativePath: string): string {
    if (!relativePath) return '';

    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    const baseUrl = '';
    let url = relativePath;

    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    return `${baseUrl}${url}`;
  }

  canApplyToJob(): boolean {
    if (!this.job || !this.isResearcher) {
      return false;
    }
    return !this.job.has_applied;
  }

  getApplicationButtonText(): string {
    if (!this.job) return 'Postularse';
    if (this.job.has_applied) {
      return 'Ya postulado';
    }
    return 'Postularse';
  }

  getUserApplicationStatus(): string | null {
    if (!this.job?.user_application) return null;
    return this.job.user_application.status_display;
  }

  getJobTypeClasses(jobType: string): string {
    switch (jobType) {
      case 'full_time':
        return 'bg-green-100 text-green-800';
      case 'part_time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'internship':
        return 'bg-yellow-100 text-yellow-800';
      case 'freelance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getFormattedSalary(job: Job): string {
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `Desde $${job.salary_min.toLocaleString()}`;
    } else if (job.salary_max) {
      return `Hasta $${job.salary_max.toLocaleString()}`;
    }
    return 'Salario a convenir';
  }

  getRequirementsArray(requirements?: string): string[] {
    if (!requirements) return [];
    return requirements.split('\n').filter((req) => req.trim() !== '');
  }

  getBenefitsArray(benefits?: string): string[] {
    if (!benefits) return [];
    return benefits.split('\n').filter((benefit) => benefit.trim() !== '');
  }

  openApplicationModal(): void {
    if (!this.job) return;

    this.applicationData = {
      job: this.job.id!,
      cover_letter: '',
      resume_file: undefined,
    };
    this.selectedFile = null;
    this.showApplicationModal = true;
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
    this.applicationData = { job: 0 };
    this.selectedFile = null;

    const fileInput = document.getElementById('resumeFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else if (file) {
      alert('Please select a valid PDF file.');
      event.target.value = '';
      this.selectedFile = null;
    } else {
      this.selectedFile = null;
    }
  }

  submitApplication(): void {
    if (!this.job?.id) return;

    if (!this.selectedFile) {
      alert('A resume is required to apply for this job.');
      return;
    }

    this.isSubmitting = true;

    const applicationData: ApplicationCreate = {
      job: this.job.id,
      cover_letter: this.applicationData.cover_letter,
      resume_file: this.selectedFile,
    };

    this.applicationService.createApplication(applicationData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeApplicationModal();
        this.applicationSubmitted.emit();
        alert('Application submitted successfully!');
      },
      error: (error: any) => {
        this.isSubmitting = false;
        console.error('Error submitting application:', error);
        if (error.error?.detail) {
          alert(`Error: ${error.error.detail}`);
        } else {
          alert('Error submitting the application. Please try again.');
        }
      },
    });
  }

  canSubmitApplication(): boolean {
    return !!this.selectedFile && !!this.job?.id;
  }

  onEditJob(): void {
    if (this.job) {
      this.editJob.emit(this.job);
    }
  }

  onDeleteJob(): void {
    if (this.job) {
      this.deleteJob.emit(this.job);
    }
  }

  hasRecentApplications(): boolean {
    return !!(this.job?.recent_applications && this.job.recent_applications.length > 0);
  }

  hasNoApplications(): boolean {
    return (
      this.isCompany &&
      (!this.jobApplications || this.jobApplications.length === 0) &&
      !this.applicationsLoading
    );
  }
}
