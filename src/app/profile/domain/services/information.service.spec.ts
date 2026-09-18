import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InformationService } from './information.service';
import { environment } from 'src/environments/environment';

describe('InformationService', () => {
  let service: InformationService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiIdentity;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InformationService],
    });
    service = TestBed.inject(InformationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getInformation GETs with the auth header', () => {
    localStorage.setItem('accessToken', 'tok-1');
    service.getInformation('u-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/profile-information/u-1/`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    req.flush({});
  });

  it('updateInformation PUTs with the auth header', () => {
    localStorage.setItem('accessToken', 'tok-1');
    service.updateInformation({ bio: 'hi' } as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/profile-information/`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    req.flush({});
  });

  it('deleteInformation DELETEs with the auth header', () => {
    localStorage.setItem('accessToken', 'tok-1');
    service.deleteInformation().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/profile-information/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getPublicInformation GETs without an auth header', () => {
    service.getPublicInformation('u-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/profile-information/u-1/`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
