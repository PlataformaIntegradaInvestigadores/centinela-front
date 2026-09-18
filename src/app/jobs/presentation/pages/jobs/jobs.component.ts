import { Component, OnInit } from '@angular/core';
import { Job, JobCreate } from 'src/app/jobs/domain/entities/job.interface';
import { Application } from 'src/app/jobs/domain/entities/application.interface';
import { JobsService } from 'src/app/jobs/domain/services/job.service';
import { ApplicationService } from 'src/app/jobs/domain/services/application.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
})
export class JobsComponent implements OnInit {
  jobs: Job[] = [];
  selectedJob: Job | null = null;
  applications: Application[] = [];
  loading = false;
  applicationsLoading = false;
  activeTab: 'recommendations' | 'trending' | 'my-jobs' | 'my-applications' = 'recommendations';
  isCompany = false;
  isResearcher = false;
  jobApplications: Application[] = []; // Para las aplicaciones de un trabajo específico (vista empresa)
  showNotesModal = false;
  selectedApplication: Application | null = null;
  notesText = '';

  // Propiedades para CRUD de jobs
  showJobModal = false;
  isEditingJob = false;
  currentJobData: JobCreate = {
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    location: '',
    job_type: 'full_time',
    experience_level: 'entry',
    salary_min: undefined,
    salary_max: undefined,
    is_remote: false,
    application_deadline: '',
  };
  showDeleteConfirm = false;
  jobToDelete: Job | null = null;

  constructor(
    private jobsService: JobsService,
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.checkUserType();
  }

  private checkUserType(): void {
    this.isCompany = this.authService.isCompany();
    this.isResearcher = this.authService.isUser();

    if (this.isCompany) {
      this.activeTab = 'my-jobs';
      this.loadCompanyJobs();
    } else {
      this.activeTab = 'recommendations';
      this.loadRecommendations();
    }
  }

  loadRecommendations(): void {
    this.loading = true;
    this.jobsService.getRecommendedJobs().subscribe({
      next: (response) => {
        this.jobs = response.results;
        if (this.jobs.length > 0) {
          this.selectedJob = this.jobs[0];
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading recommendations:', error);
        this.loading = false;
      },
    });
  }

  loadTrending(): void {
    this.loading = true;
    this.jobsService.getTrendingJobs().subscribe({
      next: (response) => {
        this.jobs = response.results;
        if (this.jobs.length > 0) {
          this.selectedJob = this.jobs[0];
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading trending jobs:', error);
        this.loading = false;
      },
    });
  }

  loadCompanyJobs(): void {
    this.loading = true;
    this.jobsService.getJobs().subscribe({
      next: (jobs: Job[]) => {
        this.jobs = jobs;
        if (jobs.length > 0) {
          this.selectedJob = jobs[0];
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading company jobs:', error);
        this.loading = false;
      },
    });
  }

  loadMyApplications(): void {
    this.applicationsLoading = true;
    this.applicationService.getUserApplications().subscribe({
      next: (applications: Application[]) => {
        this.applications = applications;
        this.applicationsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
        this.applicationsLoading = false;
      },
    });
  }

  selectJob(job: Job): void {
    this.selectedJob = job;

    // Si es empresa y estamos en "my-jobs", cargar todas las postulaciones
    if (this.isCompany && this.activeTab === 'my-jobs' && job.id) {
      // Siempre cargar todas las postulaciones para empresas para mantener consistencia de tipos
      this.loadJobApplications(job.id);
    }
  }

  /**
   * Cargar aplicaciones para un trabajo específico (vista empresa)
   */
  loadJobApplications(jobId: number): void {
    this.applicationsLoading = true;
    this.applicationService.getCompanyApplications({ job_id: jobId }).subscribe({
      next: (applications: Application[]) => {
        this.jobApplications = applications;
        this.applicationsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading job applications:', error);
        this.applicationsLoading = false;
      },
    });
  }

  /**
   * Cargar todas las aplicaciones para un trabajo específico (forzar carga)
   */
  loadAllJobApplications(jobId: number): void {
    this.applicationsLoading = true;
    this.applicationService.getCompanyApplications({ job_id: jobId }).subscribe({
      next: (applications: Application[]) => {
        this.jobApplications = applications;
        this.applicationsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading all job applications:', error);
        this.applicationsLoading = false;
      },
    });
  }

  /**
   * Actualizar el estado de una aplicación (vista empresa)
   */
  updateApplicationStatus(applicationId: number, status: string, notes?: string): void {
    this.applicationService
      .updateApplication(applicationId, {
        status: status as any,
        notes: notes,
      })
      .subscribe({
        next: (updatedApplication: Application) => {
          // Actualizar la aplicación en la lista
          const index = this.jobApplications.findIndex((app) => app.id === applicationId);
          if (index !== -1) {
            this.jobApplications[index] = updatedApplication;
          }
        },
        error: (error: any) => {
          console.error('Error updating application status:', error);
        },
      });
  }

  /**
   * Actualizar el estado de una aplicación usando el endpoint específico de empresa
   */
  updateApplicationStatusCompany(applicationId: number, status: string, notes?: string): void {
    // Usar el endpoint específico para empresas
    this.applicationService.getCompanyApplications().subscribe({
      next: () => {
        // Hacer PUT request para actualizar
        this.applicationService
          .updateApplication(applicationId, {
            status: status as any,
            notes: notes,
          })
          .subscribe({
            next: (updatedApplication: Application) => {
              // Actualizar la aplicación en la lista
              const index = this.jobApplications.findIndex((app) => app.id === applicationId);
              if (index !== -1) {
                this.jobApplications[index] = updatedApplication;
              }
            },
            error: (error: any) => {
              console.error('Error updating application status:', error);
              alert('Error updating the application status');
            },
          });
      },
      error: (error: any) => {
        console.error('Error accessing company applications:', error);
      },
    });
  }

  /**
   * Manejar cambio en el select de estado
   */
  onStatusChange(event: Event, applicationId: number): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateApplicationStatusCompany(applicationId, target.value);
    }
  }

  /**
   * Manejar cuando se envía una aplicación nueva
   */
  onApplicationSubmitted(): void {
    // Recargar el trabajo seleccionado para actualizar el estado de postulación
    if (this.selectedJob?.id) {
      this.jobsService.getJob(this.selectedJob.id).subscribe({
        next: (updatedJob: Job) => {
          this.selectedJob = updatedJob;
          // También actualizar el trabajo en la lista
          const jobIndex = this.jobs.findIndex((j) => j.id === updatedJob.id);
          if (jobIndex !== -1) {
            this.jobs[jobIndex] = updatedJob;
          }
        },
        error: (error: any) => {
          console.error('Error refreshing job after application:', error);
        },
      });
    }

    // Recargar aplicaciones si estamos en la vista de aplicaciones
    if (this.activeTab === 'my-applications') {
      this.loadMyApplications();
    }
  }

  /**
   * Manejar cuando se actualiza el estado de una postulación (vista empresa)
   */
  onApplicationStatusUpdated(event: { applicationId: number; status: string }): void {
    // Solo actualizar el estado en la vista local sin recargar todo
    // Esto evita que desaparezcan las aplicaciones

    // Actualizar en jobApplications (vista detallada de aplicaciones)
    const appIndex = this.jobApplications.findIndex((app) => app.id === event.applicationId);
    if (appIndex !== -1) {
      this.jobApplications[appIndex].status = event.status as any;
      this.jobApplications[appIndex].status_display = this.getStatusDisplayName(event.status);
    }

    // Actualizar en las recent_applications del trabajo seleccionado
    if (this.selectedJob && this.selectedJob.recent_applications) {
      const recentIndex = this.selectedJob.recent_applications.findIndex(
        (app) => app.id === event.applicationId,
      );
      if (recentIndex !== -1) {
        this.selectedJob.recent_applications[recentIndex].status = event.status as any;
        this.selectedJob.recent_applications[recentIndex].status_display =
          this.getStatusDisplayName(event.status);
      }
    }

    // Opcional: Solo recargar si es necesario para obtener datos actualizados del servidor
    // pero esto no debería ser necesario para el cambio de estado básico
  }

  /**
   * Obtener el nombre de visualización del estado
   */
  private getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pending',
      reviewing: 'Under review',
      interviewed: 'Interviewed',
      accepted: 'Accepted',
      rejected: 'Cancelled',
      withdrawn: 'Withdrawn',
    };
    return statusMap[status] || status;
  }

  /**
   * Abrir modal para editar notas
   */
  openNotesModal(application: Application): void {
    this.selectedApplication = application;
    this.notesText = application.notes || '';
    this.showNotesModal = true;
  }

  /**
   * Cerrar modal de notas
   */
  closeNotesModal(): void {
    this.showNotesModal = false;
    this.selectedApplication = null;
    this.notesText = '';
  }

  /**
   * Guardar notas de la aplicación
   */
  saveNotes(): void {
    if (!this.selectedApplication) return;

    this.applicationService
      .updateApplication(this.selectedApplication.id, {
        notes: this.notesText,
      })
      .subscribe({
        next: (updatedApplication: Application) => {
          // Actualizar la aplicación en la lista
          const index = this.jobApplications.findIndex(
            (app) => app.id === this.selectedApplication!.id,
          );
          if (index !== -1) {
            this.jobApplications[index] = updatedApplication;
          }
          this.closeNotesModal();
        },
        error: (error: any) => {
          console.error('Error updating application notes:', error);
        },
      });
  }

  // CRUD Operations for Jobs

  /**
   * Abrir modal para crear nuevo trabajo
   */
  openCreateJobModal(): void {
    this.isEditingJob = false;
    this.currentJobData = {
      title: '',
      description: '',
      requirements: '',
      benefits: '',
      location: '',
      job_type: 'full_time',
      experience_level: 'entry',
      salary_min: undefined,
      salary_max: undefined,
      is_remote: false,
      application_deadline: '',
    };
    this.showJobModal = true;
  }

  /**
   * Abrir modal para editar trabajo existente
   */
  openEditJobModal(job: Job): void {
    this.isEditingJob = true;
    this.currentJobData = {
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      location: job.location,
      job_type: job.job_type,
      experience_level: job.experience_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      is_remote: job.is_remote,
      application_deadline: job.application_deadline
        ? new Date(job.application_deadline).toISOString().split('T')[0]
        : '',
    };
    this.showJobModal = true;
  }

  /**
   * Cerrar modal de trabajo
   */
  closeJobModal(): void {
    this.showJobModal = false;
    this.isEditingJob = false;
    this.currentJobData = {
      title: '',
      description: '',
      requirements: '',
      benefits: '',
      location: '',
      job_type: 'full_time',
      experience_level: 'entry',
      salary_min: undefined,
      salary_max: undefined,
      is_remote: false,
      application_deadline: '',
    };
  }

  /**
   * Crear o actualizar trabajo
   */
  saveJob(): void {
    if (!this.currentJobData.title || !this.currentJobData.description) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const jobData = { ...this.currentJobData };

    if (this.isEditingJob && this.selectedJob) {
      // Actualizar trabajo existente
      this.jobsService.updateJob(this.selectedJob.id!, jobData).subscribe({
        next: (updatedJob: Job) => {
          const index = this.jobs.findIndex((job) => job.id === updatedJob.id);
          if (index !== -1) {
            this.jobs[index] = updatedJob;
          }
          if (this.selectedJob?.id === updatedJob.id) {
            this.selectedJob = updatedJob;
          }
          this.closeJobModal();
          alert('Trabajo actualizado exitosamente!');
        },
        error: (error: any) => {
          console.error('Error updating job:', error);
          alert('Error al actualizar el trabajo. Por favor intenta de nuevo.');
        },
      });
    } else {
      // Crear nuevo trabajo
      this.jobsService.createJob(jobData).subscribe({
        next: (newJob: Job) => {
          this.jobs.unshift(newJob);
          this.closeJobModal();
          alert('Trabajo creado exitosamente!');
        },
        error: (error: any) => {
          console.error('Error creating job:', error);
          alert('Error al crear el trabajo. Por favor intenta de nuevo.');
        },
      });
    }
  }

  /**
   * Confirmar eliminación de trabajo
   */
  confirmDeleteJob(job: Job): void {
    this.jobToDelete = job;
    this.showDeleteConfirm = true;
  }

  /**
   * Cancelar eliminación
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.jobToDelete = null;
  }

  /**
   * Eliminar trabajo
   */
  deleteJob(): void {
    if (!this.jobToDelete?.id) return;

    this.jobsService.deleteJob(this.jobToDelete.id).subscribe({
      next: () => {
        this.jobs = this.jobs.filter((job) => job.id !== this.jobToDelete!.id);
        if (this.selectedJob?.id === this.jobToDelete!.id) {
          this.selectedJob = this.jobs.length > 0 ? this.jobs[0] : null;
        }
        this.cancelDelete();
        alert('Trabajo eliminado exitosamente!');
      },
      error: (error: any) => {
        console.error('Error deleting job:', error);
        alert('Error al eliminar el trabajo. Por favor intenta de nuevo.');
      },
    });
  }

  setActiveTab(tab: 'recommendations' | 'trending' | 'my-jobs' | 'my-applications'): void {
    this.activeTab = tab;

    switch (tab) {
      case 'recommendations':
        this.loadRecommendations();
        break;
      case 'trending':
        this.loadTrending();
        break;
      case 'my-jobs':
        this.loadCompanyJobs();
        break;
      case 'my-applications':
        this.loadMyApplications();
        break;
    }
  }

  getListTitle(): string {
    switch (this.activeTab) {
      case 'recommendations':
        return 'Recomendaciones para Ti';
      case 'trending':
        return 'Trabajos Populares';
      case 'my-jobs':
        return 'Mis Trabajos Publicados';
      case 'my-applications':
        return 'Mis Postulaciones';
      default:
        return 'Trabajos Disponibles';
    }
  }

  /**
   * Construye la URL completa del archivo usando la URL base del backend
   */
  getFullFileUrl(relativePath: string): string {
    if (!relativePath) return '';

    // Si ya es una URL completa, devolverla tal como está
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Construir la URL completa
    const baseUrl = '';
    let url = relativePath;

    // Asegurar que la URL comience con '/'
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    return `${baseUrl}${url}`;
  }

  /**
   * Manejar edición de trabajo
   */
  editJob(job: Job): void {
    console.log('Editing job:', job);
    // Aquí puedes implementar la lógica de edición
    // Por ejemplo, abrir un modal de edición o navegar a una página de edición

    // Ejemplo básico - puedes expandir según tus necesidades:
    this.currentJobData = {
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      location: job.location || '',
      job_type: job.job_type,
      experience_level: job.experience_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      is_remote: job.is_remote,
      application_deadline: job.application_deadline || '',
    };

    this.isEditingJob = true;
    this.showJobModal = true;
  }
}
