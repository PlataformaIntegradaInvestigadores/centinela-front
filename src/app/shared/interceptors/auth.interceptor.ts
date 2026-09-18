import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthResponse } from 'src/app/auth/domain/entities/interfaces';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
    null,
  );

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Agregar token de autorización si existe
    const token = localStorage.getItem('accessToken');
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.shouldAttemptRefresh(request, error)) {
          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      }),
    );
  }

  private addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  private isTokenExpiredError(error: HttpErrorResponse): boolean {
    return (
      error.error?.code === 'token_not_valid' ||
      error.error?.detail === 'Token is invalid or expired' ||
      error.error?.message?.includes('token') ||
      error.error?.detail?.includes('expired')
    );
  }

  private shouldAttemptRefresh(request: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
    if (this.isAuthEndpoint(request.url) || error.status !== 401) {
      return false;
    }

    if (this.isTokenExpiredError(error)) {
      return true;
    }

    // Social consensus endpoints may return 401 for their own auth model.
    // Do not clear the identity session when a non-identity endpoint rejects a request.
    return this.isIdentityProtectedEndpoint(request.url);
  }

  private isIdentityProtectedEndpoint(url: string): boolean {
    return (
      url.includes('/api/identity/users') ||
      url.includes('/api/identity/groups') ||
      url.includes('/api/identity/test/user/groups') ||
      url.includes('/api/identity/test/users/groups') ||
      url.includes('/api/identity/profile-information')
    );
  }

  private isAuthEndpoint(url: string): boolean {
    return (
      url.includes('/token/') ||
      url.includes('/token/refresh/') ||
      url.includes('/auth/mfa/') ||
      url.includes('/register/') ||
      url.includes('/logout/')
    );
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokenResponse: AuthResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokenResponse.access);

          return next.handle(this.addTokenHeader(request, tokenResponse.access));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.clearLocalSession();
          this.router.navigate(['/login']);
          return throwError(() => error);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token))),
    );
  }
}
