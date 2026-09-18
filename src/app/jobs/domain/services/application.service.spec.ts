import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ApplicationService } from './application.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { environment } from 'src/environments/environment';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const apiUrl = environment.apiSocial;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApplicationService, { provide: AuthService, useValue: authServiceSpy }],
    });
    service = TestBed.inject(ApplicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getApplications errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.getApplications().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getApplications applies job_id and status filters', () => {
    service.getApplications({ job_id: 3, status: 'pending' } as any).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/applications/`);
    expect(req.request.params.get('job_id')).toBe('3');
    expect(req.request.params.get('status')).toBe('pending');
    req.flush([]);
  });

  it('getApplications works without any filters', () => {
    service.getApplications().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/applications/`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('getApplication errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.getApplication(1).subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getApplication GETs a single application', () => {
    service.getApplication(9).subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/v1/applications/9/`).flush({});
  });

  describe('createApplication', () => {
    it('errors without hitting the API when there is no token', (done) => {
      authServiceSpy.getToken.and.returnValue(of(null));
      service.createApplication({ job: 1 } as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
      httpMock.expectNone(() => true);
    });

    it('sends JSON when there is no resume file', () => {
      service.createApplication({ job: 1, cover_letter: 'hi' } as any).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/v1/applications/`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.body).toEqual({ job: 1, cover_letter: 'hi' });
      req.flush({});
    });

    it('sends FormData when a resume file is present', () => {
      const file = new File(['x'], 'resume.pdf');
      service
        .createApplication({ job: 1, cover_letter: 'hi', resume_file: file } as any)
        .subscribe();
      const req = httpMock.expectOne(`${apiUrl}/v1/applications/`);
      const body = req.request.body as FormData;
      expect(body.get('job')).toBe('1');
      expect(body.get('cover_letter')).toBe('hi');
      expect(body.get('resume_file')).toBe(file);
      req.flush({});
    });
  });

  describe('updateApplication', () => {
    it('errors without hitting the API when there is no token', (done) => {
      authServiceSpy.getToken.and.returnValue(of(null));
      service.updateApplication(1, { status: 'accepted' } as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
      httpMock.expectNone(() => true);
    });

    it('sends JSON when there is no resume file', () => {
      service.updateApplication(1, { status: 'accepted' } as any).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/v1/applications/1/`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.body).toEqual({ status: 'accepted' });
      req.flush({});
    });

    it('sends FormData when a resume file is present', () => {
      const file = new File(['x'], 'resume.pdf');
      service
        .updateApplication(1, {
          status: 'accepted',
          notes: 'looks good',
          resume_file: file,
        } as any)
        .subscribe();
      const req = httpMock.expectOne(`${apiUrl}/v1/applications/1/`);
      const body = req.request.body as FormData;
      expect(body.get('status')).toBe('accepted');
      expect(body.get('notes')).toBe('looks good');
      expect(body.get('resume_file')).toBe(file);
      req.flush({});
    });
  });

  it('deleteApplication DELETEs the application', () => {
    service.deleteApplication(1).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/applications/1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('deleteApplication errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.deleteApplication(1).subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getJobApplications delegates to getApplications with a job_id filter', () => {
    service.getJobApplications(7).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/applications/`);
    expect(req.request.params.get('job_id')).toBe('7');
    req.flush([]);
  });

  it('checkApplicationStatus GETs the application-status endpoint', () => {
    service.checkApplicationStatus(7).subscribe((res) => expect(res.has_applied).toBeFalse());
    httpMock
      .expectOne(`${apiUrl}/v1/jobs/7/application-status/`)
      .flush({ has_applied: false, application: null });
  });

  it('checkApplicationStatus errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.checkApplicationStatus(7).subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getCompanyApplications applies filters against the company endpoint', () => {
    service.getCompanyApplications({ status: 'pending' } as any).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/company/applications/`);
    expect(req.request.params.get('status')).toBe('pending');
    req.flush([]);
  });

  it('getCompanyApplications works without any filters', () => {
    service.getCompanyApplications().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/company/applications/`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('getCompanyApplications errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.getCompanyApplications().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getUserApplications applies an optional status filter', () => {
    service.getUserApplications('accepted').subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/user/applications/`);
    expect(req.request.params.get('status')).toBe('accepted');
    req.flush([]);
  });

  it('getUserApplications works without a status filter', () => {
    service.getUserApplications().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/user/applications/`);
    expect(req.request.params.has('status')).toBeFalse();
    req.flush([]);
  });

  it('getUserApplications errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.getUserApplications().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('handleError logs and rethrows the original error', (done) => {
    spyOn(console, 'error');
    service.getApplication(1).subscribe({
      error: (err: any) => {
        expect(err.status).toBe(500);
        expect(console.error).toHaveBeenCalled();
        done();
      },
    });
    httpMock
      .expectOne(`${apiUrl}/v1/applications/1/`)
      .flush('fail', { status: 500, statusText: 'Server Error' });
  });
});
