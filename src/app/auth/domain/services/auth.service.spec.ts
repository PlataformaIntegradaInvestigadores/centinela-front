import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { CompanyAuthService } from './company-auth.service';
import { AuthResponse, MfaChallengeResponse } from '../entities/interfaces';
import { environment } from 'src/environments/environment';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiIdentity;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: CompanyAuthService, useValue: { register: jasmine.createSpy('register') } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('restores an existing session from localStorage on construction', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userType', 'company');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: CompanyAuthService, useValue: { register: jasmine.createSpy('register') } },
      ],
    });
    const freshService = TestBed.inject(AuthService);

    expect(freshService.isLoggedIn()).toBeTrue();
    expect(freshService.getUserType()).toBe('company');
  });

  describe('isMfaChallengeResponse', () => {
    it('returns true for a response carrying a status and mfa_challenge', () => {
      const response = { status: 'mfa_required', mfa_challenge: 'chal-1', expires_in: 300 };
      expect(service.isMfaChallengeResponse(response as any)).toBeTrue();
    });

    it('returns false for a plain auth response', () => {
      const response: AuthResponse = { access: 'tok' };
      expect(service.isMfaChallengeResponse(response as any)).toBeFalse();
    });
  });

  describe('isLoggedIn / isTokenExpired', () => {
    it('returns false when no token stored', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('returns false (expired) for a malformed token', () => {
      expect(service.isTokenExpired('not-a-jwt')).toBeTrue();
    });

    it('returns true when token exp is in the past', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 100 });
      localStorage.setItem('accessToken', token);
      expect(service.isLoggedIn()).toBeFalse();
      expect(service.isTokenExpired(token)).toBeTrue();
    });

    it('returns true (logged in) when token exp is in the future', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      localStorage.setItem('accessToken', token);
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.isTokenExpired(token)).toBeFalse();
    });
  });

  describe('getTokenExpirationTime', () => {
    it('returns 0 when no token stored', () => {
      expect(service.getTokenExpirationTime()).toBe(0);
    });

    it('returns 0 for an undecodable token', () => {
      localStorage.setItem('accessToken', 'garbage');
      expect(service.getTokenExpirationTime()).toBe(0);
    });

    it('returns remaining seconds for a valid future token', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 500 });
      localStorage.setItem('accessToken', token);
      const remaining = service.getTokenExpirationTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(500);
    });

    it('returns 0 (clamped) for an already-expired token', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 500 });
      localStorage.setItem('accessToken', token);
      expect(service.getTokenExpirationTime()).toBe(0);
    });
  });

  describe('getUserType / isUser / isCompany', () => {
    it('defaults to null when nothing stored', () => {
      expect(service.getUserType()).toBeNull();
      expect(service.isUser()).toBeFalse();
      expect(service.isCompany()).toBeFalse();
    });

    it('reads userType from localStorage', () => {
      localStorage.setItem('userType', 'company');
      expect(service.getUserType()).toBe('company');
      expect(service.isCompany()).toBeTrue();
      expect(service.isUser()).toBeFalse();
    });
  });

  describe('getUserId / getCompanyId / getCurrentUserId', () => {
    it('returns null when nothing stored', () => {
      expect(service.getUserId()).toBeNull();
      expect(service.getCompanyId()).toBeNull();
      expect(service.getCurrentUserId()).toBeNull();
    });

    it('resolves current id based on user type', () => {
      localStorage.setItem('userType', 'user');
      localStorage.setItem('userId', 'u-1');
      localStorage.setItem('companyId', 'c-1');
      expect(service.getCurrentUserId()).toBe('u-1');

      localStorage.setItem('userType', 'company');
      expect(service.getCurrentUserId()).toBe('c-1');
    });
  });

  describe('login', () => {
    it('stores session on a successful user login', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'u-42' });
      const response: AuthResponse = { access: token, user_id: 'u-42' };

      service.login({ username: 'a', password: 'b' }, 'user').subscribe((res) => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne(`${apiUrl}/token/`);
      expect(req.request.method).toBe('POST');
      req.flush(response);

      expect(localStorage.getItem('accessToken')).toBe(token);
      expect(localStorage.getItem('userType')).toBe('user');
      expect(localStorage.getItem('userId')).toBe('u-42');
    });

    it('hits the companies endpoint for company login', () => {
      service.login({ username: 'a', password: 'b' }, 'company').subscribe((res) => {
        expect((res as AuthResponse).access).toBeTruthy();
      });
      const req = httpMock.expectOne(`${apiUrl}/companies/token/`);
      req.flush({ access: makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }) } as AuthResponse);
    });

    it('does not persist a session when an MFA challenge is returned', () => {
      const mfaResponse: MfaChallengeResponse = {
        status: 'mfa_required',
        mfa_challenge: 'chal-1',
        expires_in: 300,
      };

      service.login({ username: 'a', password: 'b' }).subscribe((res) => {
        expect(res).toEqual(mfaResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/token/`);
      req.flush(mfaResponse);

      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('propagates a formatted error on failed login', (done) => {
      service.login({ username: 'a', password: 'b' }).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Invalid credentials');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/token/`);
      req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout / clearLocalSession', () => {
    it('clears storage and preserves dontShowOnboarding', () => {
      localStorage.setItem('accessToken', 'tok');
      localStorage.setItem('dontShowOnboarding', 'true');

      service.logout();
      const req = httpMock.expectOne(`${apiUrl}/logout/`);
      req.flush({});

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('dontShowOnboarding')).toBe('true');
    });

    it('still clears local session if the logout request fails', () => {
      localStorage.setItem('accessToken', 'tok');

      service.logout();
      const req = httpMock.expectOne(`${apiUrl}/logout/`);
      req.flush('server error', { status: 500, statusText: 'Server Error' });

      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('sends the stored refresh token in the body for a company session', () => {
      localStorage.setItem('accessToken', 'tok');
      localStorage.setItem('userType', 'company');
      localStorage.setItem('refreshToken', 'ref-1');

      service.logout();
      const req = httpMock.expectOne(`${apiUrl}/logout/`);
      expect(req.request.body).toEqual({ refresh: 'ref-1' });
      req.flush({});
    });
  });

  describe('refreshToken', () => {
    it('stores new access token on success', () => {
      const newToken = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      service.refreshToken().subscribe((res) => {
        expect(res.access).toBe(newToken);
      });

      const req = httpMock.expectOne(`${apiUrl}/token/refresh/`);
      req.flush({ access: newToken } as AuthResponse);

      expect(localStorage.getItem('accessToken')).toBe(newToken);
    });

    it('clears the local session on refresh failure', (done) => {
      localStorage.setItem('accessToken', 'stale');

      service.refreshToken().subscribe({
        error: () => {
          expect(localStorage.getItem('accessToken')).toBeNull();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/token/refresh/`);
      req.flush('nope', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getUsers', () => {
    it('returns an empty list without hitting the API when not logged in', (done) => {
      service.getUsers().subscribe((users) => {
        expect(users).toEqual([]);
        done();
      });
      httpMock.expectNone(`${apiUrl}/users/`);
    });

    it('swallows 401/403 responses as an empty list', (done) => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      localStorage.setItem('accessToken', token);

      service.getUsers().subscribe((users) => {
        expect(users).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/`);
      req.flush('forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('updateUser', () => {
    it('errors immediately when there is no user id', (done) => {
      service.updateUser(new FormData()).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('User ID not found');
          done();
        },
      });
    });

    it('sends a PUT to the correct user id', () => {
      localStorage.setItem('userId', 'u-9');
      service.updateUser(new FormData()).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/users/u-9/update/`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('register', () => {
    it('posts to the register endpoint on success', () => {
      service
        .register({ firstName: 'A', lastName: 'B', username: 'a', password: 'p' })
        .subscribe((res) => expect(res).toEqual({ ok: true }));
      const req = httpMock.expectOne(`${apiUrl}/register/`);
      expect(req.request.method).toBe('POST');
      req.flush({ ok: true });
    });

    it('propagates a formatted error on failure', (done) => {
      service.register({ firstName: 'A', lastName: 'B', username: 'a', password: 'p' }).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Server-side error');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/register/`);
      req.flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('registerCompany', () => {
    it('delegates to CompanyAuthService.register', () => {
      const companyAuthService = TestBed.inject(CompanyAuthService) as any;
      companyAuthService.register.and.returnValue({ subscribe: () => {} });
      const company = { company_name: 'C', username: 'c', password: 'p' };
      service.registerCompany(company);
      expect(companyAuthService.register).toHaveBeenCalledWith(company);
    });
  });

  describe('getToken', () => {
    it('returns null when nothing is stored', (done) => {
      service.getToken().subscribe((token) => {
        expect(token).toBeNull();
        done();
      });
    });

    it('reads from localStorage and caches it when the subject is empty', (done) => {
      localStorage.setItem('accessToken', 'stored-token');
      service.getToken().subscribe((token) => {
        expect(token).toBe('stored-token');
      });
      service.getToken().subscribe((token) => {
        expect(token).toBe('stored-token');
        done();
      });
    });

    it('returns the in-memory token without touching localStorage again', (done) => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'u-1' });
      const response: AuthResponse = { access: token, user_id: 'u-1' };
      service.login({ username: 'a', password: 'b' }, 'user').subscribe();
      httpMock.expectOne(`${apiUrl}/token/`).flush(response);

      localStorage.removeItem('accessToken');
      service.getToken().subscribe((t) => {
        expect(t).toBe(token);
        done();
      });
    });
  });

  describe('setupMfa', () => {
    it('posts the challenge and resolves on success', () => {
      service.setupMfa('chal-1').subscribe((res) => expect(res).toEqual({
        otpauth_uri: 'uri',
        manual_key: 'key',
      }));
      const req = httpMock.expectOne(`${apiUrl}/auth/mfa/setup/`);
      expect(req.request.body).toEqual({ mfa_challenge: 'chal-1' });
      req.flush({ otpauth_uri: 'uri', manual_key: 'key' });
    });

    it('propagates a formatted error on failure', (done) => {
      service.setupMfa('chal-1').subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Server-side error');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/auth/mfa/setup/`);
      req.flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('confirmMfa / verifyMfa', () => {
    it('confirmMfa hits the confirm endpoint and stores the session', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      service.confirmMfa('chal-1', '123456').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/auth/mfa/confirm/`);
      expect(req.request.body).toEqual({ mfa_challenge: 'chal-1', code: '123456' });
      req.flush({ access: token, user_type: 'user' } as AuthResponse);
      expect(localStorage.getItem('accessToken')).toBe(token);
    });

    it('verifyMfa hits the verify endpoint', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      service.verifyMfa('chal-1', '123456').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/auth/mfa/verify/`);
      req.flush({ access: token } as AuthResponse);
      expect(localStorage.getItem('accessToken')).toBe(token);
    });

    it('propagates a formatted error on failure', (done) => {
      service.confirmMfa('chal-1', '000000').subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Server-side error');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/auth/mfa/confirm/`);
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('refreshToken', () => {
    it('sends the stored refresh token for a company session and stores the new one', () => {
      localStorage.setItem('userType', 'company');
      localStorage.setItem('refreshToken', 'old-refresh');
      const newToken = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

      service.refreshToken().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/token/refresh/`);
      expect(req.request.body).toEqual({ refresh: 'old-refresh' });
      req.flush({ access: newToken, refresh: 'new-refresh' } as AuthResponse);

      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    });

    it('clears refreshToken for a company session when none comes back', () => {
      localStorage.setItem('userType', 'company');
      localStorage.setItem('refreshToken', 'old-refresh');
      const newToken = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

      service.refreshToken().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/token/refresh/`);
      req.flush({ access: newToken } as AuthResponse);

      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('setSession via login (company branches)', () => {
    it('stores refreshToken for a company login when one is returned', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      service.login({ username: 'a', password: 'b' }, 'company').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/companies/token/`);
      req.flush({ access: token, refresh: 'ref-1', company_id: 'c-1' } as AuthResponse);

      expect(localStorage.getItem('refreshToken')).toBe('ref-1');
      expect(localStorage.getItem('companyId')).toBe('c-1');
    });

    it('falls back to the decoded token for user_id and company_id when absent from the response', () => {
      const userToken = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'decoded-user' });
      service.login({ username: 'a', password: 'b' }, 'user').subscribe();
      httpMock.expectOne(`${apiUrl}/token/`).flush({ access: userToken } as AuthResponse);
      expect(localStorage.getItem('userId')).toBe('decoded-user');

      const companyToken = makeJwt({
        exp: Math.floor(Date.now() / 1000) + 3600,
        company_id: 'decoded-company',
      });
      service.login({ username: 'a', password: 'b' }, 'company').subscribe();
      httpMock
        .expectOne(`${apiUrl}/companies/token/`)
        .flush({ access: companyToken } as AuthResponse);
      expect(localStorage.getItem('companyId')).toBe('decoded-company');
    });
  });

  describe('handleError branches', () => {
    it('formats a client-side ErrorEvent', (done) => {
      service.register({ firstName: 'A', lastName: 'B', username: 'a', password: 'p' }).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Client-side error');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/register/`);
      req.error(new ErrorEvent('error', { message: 'network down' }));
    });

    it('joins field validation errors for a 400 response', (done) => {
      service.register({ firstName: 'A', lastName: 'B', username: 'a', password: 'p' }).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('required');
          expect(err.message).toContain('taken');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/register/`);
      req.flush(
        { errors: { username: ['required'], password: ['taken'] } },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('falls back to the HTTP status message when the server sends no detail', (done) => {
      service.register({ firstName: 'A', lastName: 'B', username: 'a', password: 'p' }).subscribe({
        error: (err: Error) => {
          expect(err.message).toContain('Server-side error');
          done();
        },
      });
      const req = httpMock.expectOne(`${apiUrl}/register/`);
      req.flush({ noDetail: true }, { status: 500, statusText: 'Server Error' });
    });
  });
});
