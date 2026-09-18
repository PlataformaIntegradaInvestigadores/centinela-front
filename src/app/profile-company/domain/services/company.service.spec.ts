import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CompanyService } from './company.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { environment } from 'src/environments/environment';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const apiUrl = environment.apiIdentity;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue(of('tok-1'));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyService, { provide: AuthService, useValue: authServiceSpy }],
    });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMyProfile errors without hitting the API when there is no token', (done) => {
    authServiceSpy.getToken.and.returnValue(of(null));
    service.getMyProfile().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('No authentication token found');
        done();
      },
    });
    httpMock.expectNone(() => true);
  });

  it('getMyProfile GETs the own-profile endpoint', () => {
    service.getMyProfile().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/companies/profile/`).flush({});
  });

  it('getCompanyProfile GETs a specific company', () => {
    service.getCompanyProfile('c-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/companies/c-1/`).flush({});
  });

  describe('updateCompanyProfile', () => {
    it('builds FormData, appending a File as-is and stringifying other fields', () => {
      const logo = new File(['x'], 'logo.png');
      service
        .updateCompanyProfile('c-1', { company_name: 'Acme', logo, founded_year: 2020 } as any)
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/companies/c-1/update/`);
      expect(req.request.method).toBe('PATCH');
      const body = req.request.body as FormData;
      expect(body.get('company_name')).toBe('Acme');
      expect(body.get('logo')).toBe(logo);
      expect(body.get('founded_year')).toBe('2020');
      req.flush({});
    });

    it('skips null/undefined fields', () => {
      service
        .updateCompanyProfile('c-1', { company_name: 'Acme', description: null } as any)
        .subscribe();

      const req = httpMock.expectOne(`${apiUrl}/companies/c-1/update/`);
      const body = req.request.body as FormData;
      expect(body.has('description')).toBeFalse();
      req.flush({});
    });
  });

  it('listCompanies without verifiedOnly hits the plain collection endpoint', () => {
    service.listCompanies().subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}/companies/`).flush([]);
  });

  it('listCompanies with verifiedOnly adds the query param', () => {
    service.listCompanies(true).subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}/companies/?verified_only=true`).flush([]);
  });

  describe('handleError', () => {
    beforeEach(() => spyOn(console, 'error'));

    it('prefers error.error.message', (done) => {
      service.getCompanyProfile('c-1').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Custom message');
          done();
        },
      });
      httpMock
        .expectOne(`${apiUrl}/companies/c-1/`)
        .flush({ message: 'Custom message' }, { status: 400, statusText: 'Bad Request' });
    });

    it('falls back to the HttpErrorResponse message otherwise', (done) => {
      service.getCompanyProfile('c-1').subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Http failure response');
          done();
        },
      });
      httpMock.expectOne(`${apiUrl}/companies/c-1/`).flush(null, {
        status: 0,
        statusText: 'Unknown',
      });
    });
  });
});
