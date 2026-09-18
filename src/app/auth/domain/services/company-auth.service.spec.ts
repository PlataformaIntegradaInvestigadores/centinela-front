import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyAuthService } from './company-auth.service';
import { environment } from 'src/environments/environment';

describe('CompanyAuthService', () => {
  let service: CompanyAuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiIdentity;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyAuthService],
    });
    service = TestBed.inject(CompanyAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('registers a company', () => {
    service.register({ company_name: 'Acme' } as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/companies/register/`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('logs a company in', () => {
    service.login({ username: 'a', password: 'b' }).subscribe((res) => {
      expect(res.access).toBe('tok');
    });
    const req = httpMock.expectOne(`${apiUrl}/companies/token/`);
    req.flush({ access: 'tok' });
  });

  it('propagates a formatted validation error on failed login', (done) => {
    service.login({ username: 'a', password: 'b' }).subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Username is required');
        done();
      },
    });
    const req = httpMock.expectOne(`${apiUrl}/companies/token/`);
    req.flush(
      { errors: { username: ['Username is required'] } },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('fetches a company profile with auth headers', () => {
    localStorage.setItem('accessToken', 'tok-1');
    service.getCompanyProfile('c-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/companies/c-1/`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    req.flush({});
  });

  it('refreshes and retries getCompanyProfile on a 401', () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('refreshToken', 'refresh-1');

    service.getCompanyProfile('c-1').subscribe();

    const first = httpMock.expectOne(`${apiUrl}/companies/c-1/`);
    first.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${apiUrl}/token/refresh/`);
    refresh.flush({ access: 'new-tok' });

    const retry = httpMock.expectOne(`${apiUrl}/companies/c-1/`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-tok');
    retry.flush({});
  });

  it('fetches its own profile with auth headers', () => {
    localStorage.setItem('accessToken', 'tok-1');
    service.getMyProfile().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/companies/profile/`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    req.flush({});
  });

  it('refreshes and retries updateProfile on a 401', () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('refreshToken', 'refresh-1');
    const formData = new FormData();

    service.updateProfile('c-2', formData).subscribe();

    const first = httpMock.expectOne(`${apiUrl}/companies/c-2/update/`);
    first.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${apiUrl}/token/refresh/`);
    refresh.flush({ access: 'new-tok' });

    const retry = httpMock.expectOne(`${apiUrl}/companies/c-2/update/`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-tok');
    retry.flush({});
  });

  it('errors immediately on refresh when there is no stored refresh token', (done) => {
    localStorage.setItem('accessToken', 'stale');

    service.getMyProfile().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Refresh token not found');
        done();
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/companies/profile/`);
    req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('lists companies with the verified_only param', () => {
    service.listCompanies(true).subscribe((companies) => {
      expect(companies).toEqual([]);
    });
    const req = httpMock.expectOne(`${apiUrl}/companies/?verified_only=true`);
    req.flush([]);
  });

  it('lists companies without params by default', () => {
    service.listCompanies().subscribe((companies) => {
      expect(companies).toEqual([]);
    });
    const req = httpMock.expectOne(`${apiUrl}/companies/`);
    req.flush([]);
  });

  it('updates a company profile using the token straight from localStorage', () => {
    localStorage.setItem('accessToken', 'tok-9');
    service.updateProfile('c-2', new FormData()).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/companies/c-2/update/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-9');
    req.flush({});
  });

  describe('handleError formatting', () => {
    it('formats a client-side ErrorEvent', (done) => {
      service.register({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Error:');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/companies/register/`);
      req.error(new ErrorEvent('error', { message: 'network down' }));
    });

    it('joins validation errors by field', (done) => {
      service.register({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Bad name\nToo long');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/companies/register/`);
      req.flush(
        { errors: { company_name: ['Bad name', 'Too long'] } },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('uses error.message when present', (done) => {
      service.register({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Something broke');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/companies/register/`);
      req.flush({ message: 'Something broke' }, { status: 500, statusText: 'Server Error' });
    });

    it('uses a raw string error body when present', (done) => {
      service.register({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('plain text failure');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/companies/register/`);
      req.flush('plain text failure', { status: 500, statusText: 'Server Error' });
    });

    it('falls back to status/message when the body has no recognizable shape', (done) => {
      service.register({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Error Code: 500');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/companies/register/`);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });
});
