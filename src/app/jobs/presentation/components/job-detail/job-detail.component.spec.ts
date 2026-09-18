import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { JobDetailComponent } from './job-detail.component';
import { ApplicationService } from 'src/app/jobs/domain/services/application.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Job } from 'src/app/jobs/domain/entities/job.interface';
import { Application } from 'src/app/jobs/domain/entities/application.interface';

describe('JobDetailComponent', () => {
  let component: JobDetailComponent;
  let applicationServiceSpy: jasmine.SpyObj<ApplicationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const makeJob = (over: Partial<Job> = {}): Job => ({ id: 1, has_applied: false, ...over }) as Job;

  beforeEach(() => {
    applicationServiceSpy = jasmine.createSpyObj('ApplicationService', [
      'getCompanyApplications',
      'updateApplication',
      'createApplication',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCompanyId', 'getUserId']);

    TestBed.configureTestingModule({
      declarations: [JobDetailComponent],
      providers: [
        { provide: ApplicationService, useValue: applicationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    component = TestBed.createComponent(JobDetailComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('loads applications when job changes and the user is a company', () => {
      authServiceSpy.getCompanyId.and.returnValue('c1');
      applicationServiceSpy.getCompanyApplications.and.returnValue(of([]));
      component.job = makeJob({ id: 5 });

      component.ngOnChanges({
        job: { currentValue: component.job, previousValue: null, firstChange: true, isFirstChange: () => true },
      } as any);

      expect(applicationServiceSpy.getCompanyApplications).toHaveBeenCalledWith({ job_id: 5 });
      expect(component.applicationsLoading).toBeFalse();
    });

    it('does not load applications for a non-company user', () => {
      authServiceSpy.getCompanyId.and.returnValue(null);
      component.job = makeJob();
      component.ngOnChanges({
        job: { currentValue: component.job, previousValue: null, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(applicationServiceSpy.getCompanyApplications).not.toHaveBeenCalled();
    });

    it('clears applications on an error', () => {
      authServiceSpy.getCompanyId.and.returnValue('c1');
      applicationServiceSpy.getCompanyApplications.and.returnValue(throwError(() => new Error('boom')));
      component.job = makeJob();
      component.ngOnChanges({
        job: { currentValue: component.job, previousValue: null, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(component.jobApplications).toEqual([]);
      expect(component.applicationsLoading).toBeFalse();
    });
  });

  describe('hasValidResumeFile', () => {
    it('is false for a falsy application', () => {
      expect(component.hasValidResumeFile(null)).toBeFalse();
    });

    it('is false for a blank string resume_file', () => {
      expect(component.hasValidResumeFile({ resume_file: '   ' })).toBeFalse();
    });

    it('is true for a non-blank string resume_file', () => {
      expect(component.hasValidResumeFile({ resume_file: 'cv.pdf' })).toBeTrue();
    });

    it('is true for a non-string resume_file (e.g. a File object)', () => {
      expect(component.hasValidResumeFile({ resume_file: new File(['x'], 'cv.pdf') })).toBeTrue();
    });
  });

  describe('onStatusChange / updateApplicationStatus', () => {
    it('updates the matching application in the list on success', () => {
      component.job = makeJob();
      component.jobApplications = [{ id: 1, status: 'pending' } as Application];
      applicationServiceSpy.updateApplication.and.returnValue(
        of({ id: 1, status: 'accepted' } as Application),
      );
      const select = document.createElement('select');
      select.appendChild(new Option('accepted', 'accepted'));
      select.value = 'accepted';

      component.onStatusChange({ target: select } as unknown as Event, 1);

      expect(applicationServiceSpy.updateApplication).toHaveBeenCalledWith(1, { status: 'accepted' });
      expect(component.jobApplications[0].status).toBe('accepted');
    });

    it('does nothing without a job id', () => {
      component.job = null;
      const select = document.createElement('select');
      component.onStatusChange({ target: select } as unknown as Event, 1);
      expect(applicationServiceSpy.updateApplication).not.toHaveBeenCalled();
    });

    it('alerts on failure', () => {
      spyOn(window, 'alert');
      component.job = makeJob();
      applicationServiceSpy.updateApplication.and.returnValue(throwError(() => new Error('boom')));
      const select = document.createElement('select');
      select.value = 'accepted';
      component.onStatusChange({ target: select } as unknown as Event, 1);
      expect(window.alert).toHaveBeenCalled();
    });
  });

  describe('isCompany / isResearcher', () => {
    it('isCompany is true when a companyId exists', () => {
      authServiceSpy.getCompanyId.and.returnValue('c1');
      expect(component.isCompany).toBeTrue();
    });

    it('isResearcher is true for a user without a companyId', () => {
      authServiceSpy.getCompanyId.and.returnValue(null);
      authServiceSpy.getUserId.and.returnValue('u1');
      expect(component.isResearcher).toBeTrue();
    });

    it('isResearcher is false for a company', () => {
      authServiceSpy.getCompanyId.and.returnValue('c1');
      authServiceSpy.getUserId.and.returnValue('u1');
      expect(component.isResearcher).toBeFalse();
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

  describe('canApplyToJob', () => {
    it('is false without a job', () => {
      component.job = null;
      authServiceSpy.getCompanyId.and.returnValue(null);
      authServiceSpy.getUserId.and.returnValue('u1');
      expect(component.canApplyToJob()).toBeFalse();
    });

    it('is false for a non-researcher', () => {
      component.job = makeJob();
      authServiceSpy.getCompanyId.and.returnValue('c1');
      expect(component.canApplyToJob()).toBeFalse();
    });

    it('is false when already applied', () => {
      component.job = makeJob({ has_applied: true });
      authServiceSpy.getCompanyId.and.returnValue(null);
      authServiceSpy.getUserId.and.returnValue('u1');
      expect(component.canApplyToJob()).toBeFalse();
    });

    it('is true for a researcher who has not applied', () => {
      component.job = makeJob({ has_applied: false });
      authServiceSpy.getCompanyId.and.returnValue(null);
      authServiceSpy.getUserId.and.returnValue('u1');
      expect(component.canApplyToJob()).toBeTrue();
    });
  });

  describe('getApplicationButtonText', () => {
    it('returns default text without a job', () => {
      component.job = null;
      expect(component.getApplicationButtonText()).toBe('Postularse');
    });

    it('returns "already applied" text', () => {
      component.job = makeJob({ has_applied: true });
      expect(component.getApplicationButtonText()).toBe('Ya postulado');
    });

    it('returns default text otherwise', () => {
      component.job = makeJob({ has_applied: false });
      expect(component.getApplicationButtonText()).toBe('Postularse');
    });
  });

  describe('getUserApplicationStatus', () => {
    it('returns null without a user_application', () => {
      component.job = makeJob();
      expect(component.getUserApplicationStatus()).toBeNull();
    });

    it('returns the status display', () => {
      component.job = makeJob({ user_application: { status_display: 'Pending' } } as any);
      expect(component.getUserApplicationStatus()).toBe('Pending');
    });
  });

  describe('getJobTypeClasses', () => {
    it('maps known job types', () => {
      expect(component.getJobTypeClasses('full_time')).toContain('green');
      expect(component.getJobTypeClasses('part_time')).toContain('blue');
      expect(component.getJobTypeClasses('contract')).toContain('purple');
      expect(component.getJobTypeClasses('internship')).toContain('yellow');
      expect(component.getJobTypeClasses('freelance')).toContain('orange');
    });

    it('falls back for an unknown type', () => {
      expect(component.getJobTypeClasses('other')).toContain('gray');
    });
  });

  describe('getFormattedSalary', () => {
    it('formats a min-max range', () => {
      expect(component.getFormattedSalary(makeJob({ salary_min: 1000, salary_max: 2000 }))).toBe(
        '$1,000 - $2,000',
      );
    });

    it('formats a min-only salary', () => {
      expect(component.getFormattedSalary(makeJob({ salary_min: 1000 }))).toBe('Desde $1,000');
    });

    it('formats a max-only salary', () => {
      expect(component.getFormattedSalary(makeJob({ salary_max: 2000 }))).toBe('Hasta $2,000');
    });

    it('falls back when neither is set', () => {
      expect(component.getFormattedSalary(makeJob())).toBe('Salario a convenir');
    });
  });

  describe('getRequirementsArray / getBenefitsArray', () => {
    it('splits and filters blank lines', () => {
      expect(component.getRequirementsArray('a\n\nb\n')).toEqual(['a', 'b']);
      expect(component.getBenefitsArray('x\ny')).toEqual(['x', 'y']);
    });

    it('returns empty array for undefined input', () => {
      expect(component.getRequirementsArray(undefined)).toEqual([]);
      expect(component.getBenefitsArray(undefined)).toEqual([]);
    });
  });

  describe('openApplicationModal / closeApplicationModal', () => {
    it('does nothing to open without a job', () => {
      component.job = null;
      component.openApplicationModal();
      expect(component.showApplicationModal).toBeFalse();
    });

    it('opens the modal and resets applicationData for a job', () => {
      component.job = makeJob({ id: 7 });
      component.openApplicationModal();
      expect(component.showApplicationModal).toBeTrue();
      expect(component.applicationData.job).toBe(7);
    });

    it('closes the modal and resets the file input', () => {
      const input = document.createElement('input');
      input.id = 'resumeFile';
      input.value = 'x';
      document.body.appendChild(input);

      component.showApplicationModal = true;
      component.selectedFile = new File(['x'], 'a.pdf');
      component.closeApplicationModal();

      expect(component.showApplicationModal).toBeFalse();
      expect(component.selectedFile).toBeNull();
      expect(input.value).toBe('');
      document.body.removeChild(input);
    });
  });

  describe('onFileSelected', () => {
    it('accepts a pdf file', () => {
      const file = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
      component.onFileSelected({ target: { files: [file] } });
      expect(component.selectedFile).toBe(file);
    });

    it('rejects a non-pdf file and alerts', () => {
      spyOn(window, 'alert');
      const file = new File(['x'], 'cv.png', { type: 'image/png' });
      const target: any = { files: [file], value: 'x' };
      component.onFileSelected({ target });
      expect(window.alert).toHaveBeenCalled();
      expect(component.selectedFile).toBeNull();
      expect(target.value).toBe('');
    });

    it('clears when no file is selected', () => {
      component.onFileSelected({ target: { files: [] } });
      expect(component.selectedFile).toBeNull();
    });
  });

  describe('submitApplication', () => {
    it('does nothing without a job id', () => {
      component.job = null;
      component.submitApplication();
      expect(applicationServiceSpy.createApplication).not.toHaveBeenCalled();
    });

    it('alerts and stops without a selected file', () => {
      spyOn(window, 'alert');
      component.job = makeJob();
      component.selectedFile = null;
      component.submitApplication();
      expect(window.alert).toHaveBeenCalled();
      expect(applicationServiceSpy.createApplication).not.toHaveBeenCalled();
    });

    it('submits, closes the modal, and emits applicationSubmitted on success', () => {
      spyOn(window, 'alert');
      component.job = makeJob({ id: 3 });
      component.selectedFile = new File(['x'], 'cv.pdf');
      applicationServiceSpy.createApplication.and.returnValue(of({} as Application));
      let emitted = false;
      component.applicationSubmitted.subscribe(() => (emitted = true));

      component.submitApplication();

      expect(component.isSubmitting).toBeFalse();
      expect(component.showApplicationModal).toBeFalse();
      expect(emitted).toBeTrue();
    });

    it('alerts with the server detail message on failure', () => {
      spyOn(window, 'alert');
      component.job = makeJob();
      component.selectedFile = new File(['x'], 'cv.pdf');
      applicationServiceSpy.createApplication.and.returnValue(
        throwError(() => ({ error: { detail: 'nope' } })),
      );
      component.submitApplication();
      expect(window.alert).toHaveBeenCalledWith('Error: nope');
      expect(component.isSubmitting).toBeFalse();
    });

    it('alerts with a generic message when no detail is provided', () => {
      spyOn(window, 'alert');
      component.job = makeJob();
      component.selectedFile = new File(['x'], 'cv.pdf');
      applicationServiceSpy.createApplication.and.returnValue(throwError(() => ({})));
      component.submitApplication();
      expect(window.alert).toHaveBeenCalledWith('Error submitting the application. Please try again.');
    });
  });

  it('canSubmitApplication requires both a file and a job id', () => {
    component.selectedFile = null;
    component.job = makeJob();
    expect(component.canSubmitApplication()).toBeFalse();

    component.selectedFile = new File(['x'], 'cv.pdf');
    expect(component.canSubmitApplication()).toBeTrue();
  });

  describe('onEditJob / onDeleteJob', () => {
    it('emits editJob with the current job', () => {
      component.job = makeJob();
      let emitted: Job | undefined;
      component.editJob.subscribe((j) => (emitted = j));
      component.onEditJob();
      expect(emitted).toBe(component.job);
    });

    it('does not emit editJob without a job', () => {
      component.job = null;
      let emitted = false;
      component.editJob.subscribe(() => (emitted = true));
      component.onEditJob();
      expect(emitted).toBeFalse();
    });

    it('emits deleteJob with the current job', () => {
      component.job = makeJob();
      let emitted: Job | undefined;
      component.deleteJob.subscribe((j) => (emitted = j));
      component.onDeleteJob();
      expect(emitted).toBe(component.job);
    });
  });

  describe('hasRecentApplications / hasNoApplications', () => {
    it('hasRecentApplications is true when recent_applications is non-empty', () => {
      component.job = makeJob({ recent_applications: [{}] } as any);
      expect(component.hasRecentApplications()).toBeTrue();
    });

    it('hasRecentApplications is false when empty or absent', () => {
      component.job = makeJob();
      expect(component.hasRecentApplications()).toBeFalse();
    });

    it('hasNoApplications is true for a company with no applications and not loading', () => {
      authServiceSpy.getCompanyId.and.returnValue('c1');
      component.jobApplications = [];
      component.applicationsLoading = false;
      expect(component.hasNoApplications()).toBeTrue();
    });

    it('hasNoApplications is false while loading', () => {
      authServiceSpy.getCompanyId.and.returnValue('c1');
      component.jobApplications = [];
      component.applicationsLoading = true;
      expect(component.hasNoApplications()).toBeFalse();
    });

    it('hasNoApplications is false for a non-company', () => {
      authServiceSpy.getCompanyId.and.returnValue(null);
      component.jobApplications = [];
      expect(component.hasNoApplications()).toBeFalse();
    });
  });
});
