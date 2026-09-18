import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthenticationService } from './authentication.service';
import { environment } from 'src/environments/environment';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthenticationService],
    });
    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('posts credentials to the search-engine login endpoint', () => {
    service.login('ada', 'secret').subscribe((res) => {
      expect(res).toEqual({ token: 'abc' });
    });

    const req = httpMock.expectOne(`${environment.apiSearch}/v1/auth/login/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'ada', password: 'secret' });
    req.flush({ token: 'abc' });
  });

  describe('isAuthenticated', () => {
    it('returns false when there is no authState stored', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('returns true when authState is stored', () => {
      localStorage.setItem('authState', 'true');
      expect(service.isAuthenticated()).toBeTrue();
    });
  });
});
