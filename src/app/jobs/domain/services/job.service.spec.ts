import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { JobsService } from './job.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { environment } from 'src/environments/environment';

describe('JobsService', () => {
  let service: JobsService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const apiUrl = environment.apiSocial;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JobsService, { provide: AuthService, useValue: authServiceSpy }],
    });
    service = TestBed.inject(JobsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getJobs errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.getJobs().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getJobs applies every filter as a query param', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service
      .getJobs({ q: 'react', location: 'Quito', type: 'full-time', experience: 'mid', remote: true })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/jobs/`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    expect(req.request.params.get('q')).toBe('react');
    expect(req.request.params.get('location')).toBe('Quito');
    expect(req.request.params.get('type')).toBe('full-time');
    expect(req.request.params.get('experience')).toBe('mid');
    expect(req.request.params.get('remote')).toBe('true');
    req.flush([]);
  });

  it('getJobs works without any filters', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.getJobs().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/jobs/`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  function expectsNoToken(call: () => void) {
    authServiceSpy.getToken.and.returnValue(of(null));
    call();
    httpMock.expectNone(() => true);
  }

  it('getJob GETs a single job by id', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.getJob(5).subscribe((job) => {
      expect(job).toEqual({ id: 5 } as any);
    });
    httpMock.expectOne(`${apiUrl}/v1/jobs/5/`).flush({ id: 5 });
  });

  it('getJob errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.getJob(5).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('createJob POSTs the job payload', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.createJob({ title: 'Dev' } as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/jobs/`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('createJob errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.createJob({ title: 'Dev' } as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('updateJob PUTs the partial job payload', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.updateJob(5, { title: 'Senior Dev' } as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/jobs/5/`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('updateJob errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.updateJob(5, { title: 'Senior Dev' } as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('deleteJob DELETEs the job', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.deleteJob(5).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/jobs/5/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('deleteJob errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.deleteJob(5).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('getRecommendedJobs GETs with a limit param', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.getRecommendedJobs(3).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/jobs/recommendations/`);
    expect(req.request.params.get('limit')).toBe('3');
    req.flush({ count: 0, results: [] });
  });

  it('getRecommendedJobs errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.getRecommendedJobs().subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('getTrendingJobs GETs with a limit param', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.getTrendingJobs().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/jobs/trending/`);
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ count: 0, results: [] });
  });

  it('getTrendingJobs errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.getTrendingJobs().subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('semanticSearch POSTs the query', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.semanticSearch('ai researcher').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/jobs/semantic-search/`);
    expect(req.request.body).toEqual({ query: 'ai researcher' });
    req.flush([]);
  });

  it('semanticSearch errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.semanticSearch('ai researcher').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  it('getJobsByCompany GETs with a company param', () => {
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    service.getJobsByCompany('c-1').subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/v1/jobs/`);
    expect(req.request.params.get('company')).toBe('c-1');
    req.flush([]);
  });

  it('getJobsByCompany errors without hitting the API when there is no token', (done) => {
    expectsNoToken(() => {
      service.getJobsByCompany('c-1').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No authentication token found');
          done();
        },
      });
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      authServiceSpy.getToken.and.returnValue(of('tok-1'));
      spyOn(console, 'error');
    });

    it('prefers error.error.message', (done) => {
      service.getJob(1).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Custom message');
          done();
        },
      });
      httpMock
        .expectOne(`${apiUrl}/v1/jobs/1/`)
        .flush({ message: 'Custom message' }, { status: 400, statusText: 'Bad Request' });
    });

    it('falls back to error.error.error', (done) => {
      service.getJob(1).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Custom error field');
          done();
        },
      });
      httpMock
        .expectOne(`${apiUrl}/v1/jobs/1/`)
        .flush({ error: 'Custom error field' }, { status: 400, statusText: 'Bad Request' });
    });

    it('falls back to the HttpErrorResponse message when the body has neither shape', (done) => {
      service.getJob(1).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Http failure response');
          done();
        },
      });
      httpMock.expectOne(`${apiUrl}/v1/jobs/1/`).flush(null, { status: 0, statusText: 'Unknown' });
    });
  });
});
