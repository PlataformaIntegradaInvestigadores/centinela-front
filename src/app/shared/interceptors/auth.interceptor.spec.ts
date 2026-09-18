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
});
