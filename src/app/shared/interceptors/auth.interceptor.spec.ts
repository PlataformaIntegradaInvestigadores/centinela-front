import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthResponse } from 'src/app/auth/domain/entities/interfaces';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function fakeHandler(response: Observable<HttpEvent<unknown>>): HttpHandler {
    return { handle: jasmine.createSpy('handle').and.returnValue(response) } as any;
  }

  function unauthorized(body: any = {}): HttpErrorResponse {
    return new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: body });
  }

  beforeEach(() => {
    localStorage.clear();
    authServiceSpy = jasmine.createSpyObj('AuthService', ['refreshToken', 'clearLocalSession']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    interceptor = TestBed.inject(AuthInterceptor);
  });

  afterEach(() => localStorage.clear());

  it('attaches the Authorization header when a token is stored', () => {
    localStorage.setItem('accessToken', 'tok-1');
    const handler = fakeHandler(of({} as HttpEvent<unknown>));
    const req = new HttpRequest('GET', '/api/identity/users/');

    interceptor.intercept(req, handler).subscribe();

    const sentReq: HttpRequest<unknown> = (handler.handle as jasmine.Spy).calls.mostRecent()
      .args[0];
    expect(sentReq.headers.get('Authorization')).toBe('Bearer tok-1');
  });

  it('passes requests through unmodified when there is no token', () => {
    const handler = fakeHandler(of({} as HttpEvent<unknown>));
    const req = new HttpRequest('GET', '/api/identity/users/');

    interceptor.intercept(req, handler).subscribe();

    const sentReq: HttpRequest<unknown> = (handler.handle as jasmine.Spy).calls.mostRecent()
      .args[0];
    expect(sentReq.headers.has('Authorization')).toBeFalse();
  });

  it('does not attempt refresh on 401 from an auth endpoint (e.g. /token/)', (done) => {
    const handler = fakeHandler(throwError(() => unauthorized()));
    const req = new HttpRequest('POST', '/api/identity/token/', {});

    interceptor.intercept(req, handler).subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('passes through non-401 errors untouched', (done) => {
    const serverError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const handler = fakeHandler(throwError(() => serverError));
    const req = new HttpRequest('GET', '/api/identity/users/');

    interceptor.intercept(req, handler).subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('ignores a 401 from a non-identity-protected endpoint without a token-expiry signature', (done) => {
    const handler = fakeHandler(throwError(() => unauthorized({ detail: 'not allowed here' })));
    const req = new HttpRequest('GET', '/api/social/debates/');

    interceptor.intercept(req, handler).subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('refreshes the token and retries on a token-expired 401 for a protected endpoint', (done) => {
    const newToken: AuthResponse = { access: 'new-tok' };
    authServiceSpy.refreshToken.and.returnValue(of(newToken));

    const handler: any = {
      handle: jasmine
        .createSpy('handle')
        .and.returnValues(
          throwError(() => unauthorized({ code: 'token_not_valid' })),
          of({} as HttpEvent<unknown>),
        ),
    };
    const req = new HttpRequest('GET', '/api/identity/users/');

    interceptor.intercept(req, handler).subscribe(() => {
      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
      const retriedReq: HttpRequest<unknown> = handler.handle.calls.mostRecent().args[0];
      expect(retriedReq.headers.get('Authorization')).toBe('Bearer new-tok');
      done();
    });
  });

  it('clears the session and redirects to /login when refresh itself fails', (done) => {
    authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));

    const handler: any = {
      handle: jasmine
        .createSpy('handle')
        .and.returnValue(throwError(() => unauthorized({ code: 'token_not_valid' }))),
    };
    const req = new HttpRequest('GET', '/api/identity/groups/');

    interceptor.intercept(req, handler).subscribe({
      error: () => {
        expect(authServiceSpy.clearLocalSession).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });
  });

  it('treats an identity-protected endpoint 401 as a refresh trigger even without an explicit token-expiry signature', (done) => {
    authServiceSpy.refreshToken.and.returnValue(of({ access: 'new-tok' } as AuthResponse));

    const handler: any = {
      handle: jasmine
        .createSpy('handle')
        .and.returnValues(
          throwError(() => unauthorized({ detail: 'forbidden' })),
          of({} as HttpEvent<unknown>),
        ),
    };
    const req = new HttpRequest('GET', '/api/identity/profile-information/');

    interceptor.intercept(req, handler).subscribe(() => {
      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
      done();
    });
  });

  describe('admin routes', () => {
    const adminUrl = '/api/search/v1/admin/etl/run/';

    function sentRequest(handler: HttpHandler): HttpRequest<unknown> {
      return (handler.handle as jasmine.Spy).calls.mostRecent().args[0];
    }

    function startAdminSession(token = 'adm-1', expiresIn = 3600): void {
      sessionStorage.setItem('adminToken', token);
      sessionStorage.setItem('adminTokenExpiresAt', String(Date.now() + expiresIn * 1000));
    }

    beforeEach(() => sessionStorage.clear());
    afterEach(() => sessionStorage.clear());

    it('sends X-Admin-Token on admin routes', () => {
      startAdminSession();
      const handler = fakeHandler(of({} as HttpEvent<unknown>));

      interceptor.intercept(new HttpRequest('GET', adminUrl), handler).subscribe();

      expect(sentRequest(handler).headers.get('X-Admin-Token')).toBe('adm-1');
    });

    it('covers every admin route', () => {
      startAdminSession();
      const urls = [
        '/api/search/v1/admin/logs/',
        '/api/search/v1/generate-corpus/',
        '/api/search/v1/generate-model/',
        '/api/search/v1/scopus-integration/',
        '/api/search/v1/information/update/author-information/',
        '/api/search/v1/dashboard/populate',
      ];
      for (const url of urls) {
        const handler = fakeHandler(of({} as HttpEvent<unknown>));
        interceptor.intercept(new HttpRequest('POST', url, {}), handler).subscribe();
        expect(sentRequest(handler).headers.get('X-Admin-Token')).withContext(url).toBe('adm-1');
      }
    });

    it('does not send the admin token to other routes', () => {
      startAdminSession();
      for (const url of [
        '/api/search/v1/articles/',
        '/api/search/v1/dashboard/information/get_system_health/',
        '/api/identity/users/',
      ]) {
        const handler = fakeHandler(of({} as HttpEvent<unknown>));
        interceptor.intercept(new HttpRequest('GET', url), handler).subscribe();
        expect(sentRequest(handler).headers.has('X-Admin-Token')).withContext(url).toBeFalse();
      }
    });

    it('keeps the user JWT in Authorization and the admin token in its own header', () => {
      localStorage.setItem('accessToken', 'jwt-1');
      startAdminSession();
      const handler = fakeHandler(of({} as HttpEvent<unknown>));

      interceptor.intercept(new HttpRequest('GET', adminUrl), handler).subscribe();

      const sent = sentRequest(handler);
      expect(sent.headers.get('Authorization')).toBe('Bearer jwt-1');
      expect(sent.headers.get('X-Admin-Token')).toBe('adm-1');
    });

    it('does not send an expired admin token', () => {
      startAdminSession('adm-1', -1);
      const handler = fakeHandler(of({} as HttpEvent<unknown>));

      interceptor.intercept(new HttpRequest('GET', adminUrl), handler).subscribe();

      expect(sentRequest(handler).headers.has('X-Admin-Token')).toBeFalse();
    });

    it('clears the admin session and goes back to the admin login on a 403', (done) => {
      startAdminSession();
      localStorage.setItem('authState', 'authenticated');
      const forbidden = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
      const handler = fakeHandler(throwError(() => forbidden));

      interceptor.intercept(new HttpRequest('GET', adminUrl), handler).subscribe({
        error: (err) => {
          expect(err).toBe(forbidden);
          expect(sessionStorage.getItem('adminToken')).toBeNull();
          expect(localStorage.getItem('authState')).toBeNull();
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
          done();
        },
      });
    });

    it('does not touch the admin session on a 403 from a non-admin route', (done) => {
      startAdminSession();
      const forbidden = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
      const handler = fakeHandler(throwError(() => forbidden));

      interceptor.intercept(new HttpRequest('GET', '/api/search/v1/articles/'), handler).subscribe({
        error: () => {
          expect(sessionStorage.getItem('adminToken')).toBe('adm-1');
          expect(routerSpy.navigate).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
