import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { JobsComponent } from './jobs.component';
import { JobsService } from 'src/app/jobs/domain/services/job.service';
import { ApplicationService } from 'src/app/jobs/domain/services/application.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Job } from 'src/app/jobs/domain/entities/job.interface';
import { Application } from 'src/app/jobs/domain/entities/application.interface';

describe('JobsComponent', () => {
  let component: JobsComponent;
  let jobsServiceSpy: jasmine.SpyObj<JobsService>;
  let applicationServiceSpy: jasmine.SpyObj<ApplicationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const makeJob = (over: Partial<Job> = {}): Job => ({ id: 1, title: 'T', description: 'D', ...over }) as Job;
  const makeApp = (over: Partial<Application> = {}): Application =>
    ({ id: 1, status: 'pending', ...over }) as Application;

  beforeEach(() => {
    jobsServiceSpy = jasmine.createSpyObj('JobsService', [
      'getRecommendedJobs',
      'getTrendingJobs',
      'getJobs',
      'getJob',
      'updateJob',
      'createJob',
      'deleteJob',
    ]);
    applicationServiceSpy = jasmine.createSpyObj('ApplicationService', [
      'getUserApplications',
      'getCompanyApplications',
      'updateApplication',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isCompany', 'isUser']);

    jobsServiceSpy.getRecommendedJobs.and.returnValue(of({ count: 0, results: [] }));
    jobsServiceSpy.getTrendingJobs.and.returnValue(of({ count: 0, results: [] }));
    jobsServiceSpy.getJobs.and.returnValue(of([]));
    applicationServiceSpy.getUserApplications.and.returnValue(of([]));
    applicationServiceSpy.getCompanyApplications.and.returnValue(of([]));

    TestBed.configureTestingModule({
      declarations: [JobsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: JobsService, useValue: jobsServiceSpy },
        { provide: ApplicationService, useValue: applicationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    component = TestBed.createComponent(JobsComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / checkUserType', () => {
    it('sets my-jobs tab and loads company jobs for a company', () => {
      authServiceSpy.isCompany.and.returnValue(true);
      authServiceSpy.isUser.and.returnValue(false);
      component.ngOnInit();
      expect(component.activeTab).toBe('my-jobs');
      expect(jobsServiceSpy.getJobs).toHaveBeenCalled();
    });

    it('sets recommendations tab and loads recommendations for a researcher', () => {
      authServiceSpy.isCompany.and.returnValue(false);
      authServiceSpy.isUser.and.returnValue(true);
      component.ngOnInit();
      expect(component.activeTab).toBe('recommendations');
      expect(jobsServiceSpy.getRecommendedJobs).toHaveBeenCalled();
    });
  });

  describe('loadRecommendations / loadTrending / loadCompanyJobs', () => {
    it('loads recommended jobs and selects the first', () => {
      jobsServiceSpy.getRecommendedJobs.and.returnValue(of({ count: 1, results: [makeJob()] }));
      component.loadRecommendations();
      expect(component.jobs.length).toBe(1);
      expect(component.selectedJob).toBe(component.jobs[0]);
      expect(component.loading).toBeFalse();
    });

    it('logs on a recommendations failure', () => {
      spyOn(console, 'error');
      jobsServiceSpy.getRecommendedJobs.and.returnValue(throwError(() => new Error('boom')));
      component.loadRecommendations();
      expect(console.error).toHaveBeenCalled();
      expect(component.loading).toBeFalse();
    });

    it('loads trending jobs and selects the first', () => {
      jobsServiceSpy.getTrendingJobs.and.returnValue(of({ count: 1, results: [makeJob({ id: 2 })] }));
      component.loadTrending();
      expect(component.jobs[0].id).toBe(2);
    });

    it('logs on a trending failure', () => {
      spyOn(console, 'error');
      jobsServiceSpy.getTrendingJobs.and.returnValue(throwError(() => new Error('boom')));
      component.loadTrending();
      expect(console.error).toHaveBeenCalled();
    });

    it('loads company jobs and selects the first', () => {
      jobsServiceSpy.getJobs.and.returnValue(of([makeJob({ id: 3 })]));
      component.loadCompanyJobs();
      expect(component.jobs[0].id).toBe(3);
    });

    it('logs on a company-jobs failure', () => {
      spyOn(console, 'error');
      jobsServiceSpy.getJobs.and.returnValue(throwError(() => new Error('boom')));
      component.loadCompanyJobs();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadMyApplications', () => {
    it('populates applications on success', () => {
      applicationServiceSpy.getUserApplications.and.returnValue(of([makeApp()]));
      component.loadMyApplications();
      expect(component.applications.length).toBe(1);
      expect(component.applicationsLoading).toBeFalse();
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      applicationServiceSpy.getUserApplications.and.returnValue(throwError(() => new Error('boom')));
      component.loadMyApplications();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('selectJob', () => {
    it('loads job applications when a company selects a job on my-jobs', () => {
      component.isCompany = true;
      component.activeTab = 'my-jobs';
      spyOn(component, 'loadJobApplications');
      component.selectJob(makeJob({ id: 5 }));
      expect(component.selectedJob?.id).toBe(5);
      expect(component.loadJobApplications).toHaveBeenCalledWith(5);
    });

    it('does not load applications for a researcher', () => {
      component.isCompany = false;
      spyOn(component, 'loadJobApplications');
      component.selectJob(makeJob());
      expect(component.loadJobApplications).not.toHaveBeenCalled();
    });
  });

  describe('loadJobApplications / loadAllJobApplications', () => {
    it('populates jobApplications on success', () => {
      applicationServiceSpy.getCompanyApplications.and.returnValue(of([makeApp()]));
      component.loadJobApplications(1);
      expect(component.jobApplications.length).toBe(1);
    });

    it('logs on a loadJobApplications failure', () => {
      spyOn(console, 'error');
      applicationServiceSpy.getCompanyApplications.and.returnValue(throwError(() => new Error('boom')));
      component.loadJobApplications(1);
      expect(console.error).toHaveBeenCalled();
    });

    it('loadAllJobApplications populates jobApplications on success', () => {
      applicationServiceSpy.getCompanyApplications.and.returnValue(of([makeApp({ id: 9 })]));
      component.loadAllJobApplications(1);
      expect(component.jobApplications[0].id).toBe(9);
    });

    it('logs on a loadAllJobApplications failure', () => {
      spyOn(console, 'error');
      applicationServiceSpy.getCompanyApplications.and.returnValue(throwError(() => new Error('boom')));
      component.loadAllJobApplications(1);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateApplicationStatus', () => {
    it('updates the matching application in the list', () => {
      const updated = makeApp({ id: 1, status: 'accepted' as any });
      applicationServiceSpy.updateApplication.and.returnValue(of(updated));
      component.jobApplications = [makeApp({ id: 1 })];
      component.updateApplicationStatus(1, 'accepted');
      expect(applicationServiceSpy.updateApplication).toHaveBeenCalledWith(1, {
        status: 'accepted',
        notes: undefined,
      });
      expect(component.jobApplications[0]).toBe(updated);
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      applicationServiceSpy.updateApplication.and.returnValue(throwError(() => new Error('boom')));
      component.updateApplicationStatus(1, 'accepted');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateApplicationStatusCompany', () => {
    it('fetches company applications then updates the target application', () => {
      const updated = makeApp({ id: 1, status: 'accepted' as any });
      applicationServiceSpy.getCompanyApplications.and.returnValue(of([]));
      applicationServiceSpy.updateApplication.and.returnValue(of(updated));
      component.jobApplications = [makeApp({ id: 1 })];
      component.updateApplicationStatusCompany(1, 'accepted');
      expect(component.jobApplications[0]).toBe(updated);
    });

    it('alerts when the inner update call fails', () => {
      spyOn(window, 'alert');
      spyOn(console, 'error');
      applicationServiceSpy.getCompanyApplications.and.returnValue(of([]));
      applicationServiceSpy.updateApplication.and.returnValue(throwError(() => new Error('boom')));
      component.updateApplicationStatusCompany(1, 'accepted');
      expect(window.alert).toHaveBeenCalled();
    });

    it('logs when the outer company-applications call fails', () => {
      spyOn(console, 'error');
      applicationServiceSpy.getCompanyApplications.and.returnValue(throwError(() => new Error('boom')));
      component.updateApplicationStatusCompany(1, 'accepted');
      expect(console.error).toHaveBeenCalled();
      expect(applicationServiceSpy.updateApplication).not.toHaveBeenCalled();
    });
  });

  it('onStatusChange delegates to updateApplicationStatusCompany with the select value', () => {
    spyOn(component, 'updateApplicationStatusCompany');
    const select = document.createElement('select');
    select.appendChild(new Option('accepted', 'accepted'));
    select.value = 'accepted';
    component.onStatusChange({ target: select } as unknown as Event, 3);
    expect(component.updateApplicationStatusCompany).toHaveBeenCalledWith(3, 'accepted');
  });

  describe('onApplicationSubmitted', () => {
    it('refreshes the selected job and updates it in the list', () => {
      const updated = makeJob({ id: 1, title: 'Updated' });
      jobsServiceSpy.getJob.and.returnValue(of(updated));
      component.selectedJob = makeJob({ id: 1 });
      component.jobs = [makeJob({ id: 1 })];
      component.onApplicationSubmitted();
      expect(component.selectedJob).toBe(updated);
      expect(component.jobs[0]).toBe(updated);
    });

    it('reloads applications when on the my-applications tab', () => {
      spyOn(component, 'loadMyApplications');
      component.selectedJob = null;
      component.activeTab = 'my-applications';
      component.onApplicationSubmitted();
      expect(component.loadMyApplications).toHaveBeenCalled();
    });

    it('logs on a job-refresh failure', () => {
      spyOn(console, 'error');
      jobsServiceSpy.getJob.and.returnValue(throwError(() => new Error('boom')));
      component.selectedJob = makeJob({ id: 1 });
      component.onApplicationSubmitted();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onApplicationStatusUpdated', () => {
    it('updates status in jobApplications and the selected job recent_applications', () => {
      component.jobApplications = [makeApp({ id: 1, status: 'pending' as any })];
      component.selectedJob = makeJob({
        recent_applications: [{ id: 1, status: 'pending' } as any],
      });
      component.onApplicationStatusUpdated({ applicationId: 1, status: 'accepted' });
      expect(component.jobApplications[0].status).toBe('accepted');
      expect(component.jobApplications[0].status_display).toBe('Accepted');
      expect((component.selectedJob!.recent_applications as any)[0].status).toBe('accepted');
    });

    it('does nothing when the application id is not found anywhere', () => {
      component.jobApplications = [];
      component.selectedJob = makeJob({ recent_applications: [] });
      expect(() => component.onApplicationStatusUpdated({ applicationId: 99, status: 'x' })).not.toThrow();
    });
  });

  describe('notes modal', () => {
    it('openNotesModal seeds notesText from the application', () => {
      component.openNotesModal(makeApp({ notes: 'hi' } as any));
      expect(component.showNotesModal).toBeTrue();
      expect(component.notesText).toBe('hi');
    });

    it('openNotesModal defaults to an empty string without notes', () => {
      component.openNotesModal(makeApp());
      expect(component.notesText).toBe('');
    });

    it('closeNotesModal resets modal state', () => {
      component.showNotesModal = true;
      component.selectedApplication = makeApp();
      component.notesText = 'x';
      component.closeNotesModal();
      expect(component.showNotesModal).toBeFalse();
      expect(component.selectedApplication).toBeNull();
      expect(component.notesText).toBe('');
    });

    describe('saveNotes', () => {
      it('does nothing without a selectedApplication', () => {
        component.selectedApplication = null;
        component.saveNotes();
        expect(applicationServiceSpy.updateApplication).not.toHaveBeenCalled();
      });

      it('updates the application and closes the modal on success', () => {
        const updated = makeApp({ id: 1, notes: 'new' } as any);
        applicationServiceSpy.updateApplication.and.returnValue(of(updated));
        component.selectedApplication = makeApp({ id: 1 });
        component.jobApplications = [makeApp({ id: 1 })];
        component.notesText = 'new';
        component.saveNotes();
        expect(component.jobApplications[0]).toBe(updated);
        expect(component.showNotesModal).toBeFalse();
      });

      it('logs on failure', () => {
        spyOn(console, 'error');
        applicationServiceSpy.updateApplication.and.returnValue(throwError(() => new Error('boom')));
        component.selectedApplication = makeApp({ id: 1 });
        component.saveNotes();
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('job modal CRUD', () => {
    it('openCreateJobModal resets currentJobData and opens the modal', () => {
      component.openCreateJobModal();
      expect(component.isEditingJob).toBeFalse();
      expect(component.currentJobData.title).toBe('');
      expect(component.showJobModal).toBeTrue();
    });

    it('openEditJobModal seeds currentJobData from the job, formatting the deadline', () => {
      const job = makeJob({
        title: 'T',
        description: 'D',
        location: 'Quito',
        job_type: 'full_time',
        experience_level: 'entry',
        is_remote: true,
        application_deadline: '2025-01-15T00:00:00Z',
      });
      component.openEditJobModal(job);
      expect(component.isEditingJob).toBeTrue();
      expect(component.currentJobData.application_deadline).toBe('2025-01-15');
      expect(component.showJobModal).toBeTrue();
    });

    it('openEditJobModal leaves the deadline blank when the job has none', () => {
      component.openEditJobModal(makeJob({ application_deadline: undefined }));
      expect(component.currentJobData.application_deadline).toBe('');
    });

    it('closeJobModal resets modal state', () => {
      component.showJobModal = true;
      component.isEditingJob = true;
      component.closeJobModal();
      expect(component.showJobModal).toBeFalse();
      expect(component.isEditingJob).toBeFalse();
      expect(component.currentJobData.title).toBe('');
    });

    describe('saveJob', () => {
      it('alerts when required fields are missing', () => {
        spyOn(window, 'alert');
        component.currentJobData = { ...component.currentJobData, title: '', description: '' };
        component.saveJob();
        expect(window.alert).toHaveBeenCalled();
        expect(jobsServiceSpy.createJob).not.toHaveBeenCalled();
      });

      it('creates a new job when not editing', () => {
        spyOn(window, 'alert');
        jobsServiceSpy.createJob.and.returnValue(of(makeJob({ id: 9 })));
        component.currentJobData = { ...component.currentJobData, title: 'T', description: 'D' };
        component.isEditingJob = false;
        component.jobs = [];
        component.saveJob();
        expect(component.jobs[0].id).toBe(9);
        expect(component.showJobModal).toBeFalse();
      });

      it('logs and alerts on a create failure', () => {
        spyOn(window, 'alert');
        spyOn(console, 'error');
        jobsServiceSpy.createJob.and.returnValue(throwError(() => new Error('boom')));
        component.currentJobData = { ...component.currentJobData, title: 'T', description: 'D' };
        component.isEditingJob = false;
        component.saveJob();
        expect(console.error).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
      });

      it('updates an existing job when editing', () => {
        spyOn(window, 'alert');
        const updated = makeJob({ id: 1, title: 'Updated' });
        jobsServiceSpy.updateJob.and.returnValue(of(updated));
        component.currentJobData = { ...component.currentJobData, title: 'T', description: 'D' };
        component.isEditingJob = true;
        component.selectedJob = makeJob({ id: 1 });
        component.jobs = [makeJob({ id: 1 })];
        component.saveJob();
        expect(component.jobs[0]).toBe(updated);
        expect(component.selectedJob).toBe(updated);
      });

      it('logs and alerts on an update failure', () => {
        spyOn(window, 'alert');
        spyOn(console, 'error');
        jobsServiceSpy.updateJob.and.returnValue(throwError(() => new Error('boom')));
        component.currentJobData = { ...component.currentJobData, title: 'T', description: 'D' };
        component.isEditingJob = true;
        component.selectedJob = makeJob({ id: 1 });
        component.saveJob();
        expect(console.error).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
      });
    });
  });

  describe('delete job flow', () => {
    it('confirmDeleteJob opens the confirm dialog', () => {
      const job = makeJob();
      component.confirmDeleteJob(job);
      expect(component.jobToDelete).toBe(job);
      expect(component.showDeleteConfirm).toBeTrue();
    });

    it('cancelDelete clears state', () => {
      component.jobToDelete = makeJob();
      component.showDeleteConfirm = true;
      component.cancelDelete();
      expect(component.jobToDelete).toBeNull();
      expect(component.showDeleteConfirm).toBeFalse();
    });

    describe('deleteJob', () => {
      it('does nothing without a jobToDelete id', () => {
        component.jobToDelete = null;
        component.deleteJob();
        expect(jobsServiceSpy.deleteJob).not.toHaveBeenCalled();
      });

      it('removes the job, clears selection if it was selected, and alerts on success', () => {
        spyOn(window, 'alert');
        jobsServiceSpy.deleteJob.and.returnValue(of(undefined));
        component.jobs = [makeJob({ id: 1 })];
        component.selectedJob = makeJob({ id: 1 });
        component.jobToDelete = makeJob({ id: 1 });
        component.deleteJob();
        expect(component.jobs).toEqual([]);
        expect(component.selectedJob).toBeNull();
        expect(component.showDeleteConfirm).toBeFalse();
      });

      it('logs and alerts on a delete failure', () => {
        spyOn(window, 'alert');
        spyOn(console, 'error');
        jobsServiceSpy.deleteJob.and.returnValue(throwError(() => new Error('boom')));
        component.jobToDelete = makeJob({ id: 1 });
        component.deleteJob();
        expect(console.error).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
      });
    });
  });

  describe('setActiveTab', () => {
    it('routes to each loader based on the tab', () => {
      spyOn(component, 'loadRecommendations');
      spyOn(component, 'loadTrending');
      spyOn(component, 'loadCompanyJobs');
      spyOn(component, 'loadMyApplications');

      component.setActiveTab('recommendations');
      expect(component.loadRecommendations).toHaveBeenCalled();

      component.setActiveTab('trending');
      expect(component.loadTrending).toHaveBeenCalled();

      component.setActiveTab('my-jobs');
      expect(component.loadCompanyJobs).toHaveBeenCalled();

      component.setActiveTab('my-applications');
      expect(component.loadMyApplications).toHaveBeenCalled();
    });
  });

  describe('getListTitle', () => {
    it('returns a title per tab', () => {
      component.activeTab = 'recommendations';
      expect(component.getListTitle()).toContain('Recomendaciones');
      component.activeTab = 'trending';
      expect(component.getListTitle()).toContain('Populares');
      component.activeTab = 'my-jobs';
      expect(component.getListTitle()).toContain('Publicados');
      component.activeTab = 'my-applications';
      expect(component.getListTitle()).toContain('Postulaciones');
    });
  });

  describe('getFullFileUrl', () => {
    it('returns empty string for a falsy path', () => {
      expect(component.getFullFileUrl('')).toBe('');
    });

    it('returns absolute urls unchanged', () => {
      expect(component.getFullFileUrl('https://x.com/a.pdf')).toBe('https://x.com/a.pdf');
    });

    it('prefixes a relative path', () => {
      expect(component.getFullFileUrl('a.pdf')).toBe('/a.pdf');
    });
  });

  it('editJob seeds currentJobData and opens the edit modal', () => {
    spyOn(console, 'log');
    const job = makeJob({ location: undefined, application_deadline: undefined });
    component.editJob(job);
    expect(component.isEditingJob).toBeTrue();
    expect(component.showJobModal).toBeTrue();
    expect(component.currentJobData.location).toBe('');
    expect(component.currentJobData.application_deadline).toBe('');
  });
});
