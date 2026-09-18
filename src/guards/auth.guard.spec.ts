import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'getTokenExpirationTime',
      'refreshToken',
      'logout',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function run(): any {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  it('redirects to login and blocks access when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);

    const result = run();

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('allows access when logged in and token is not near expiry', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(3600);

    const result = run();

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('refreshes the token and allows access when refresh succeeds', (done) => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(100);
    authServiceSpy.refreshToken.and.returnValue(of({ access: 'new-token' } as any));

    const result = run();
    (result as any).subscribe((allowed: boolean) => {
      expect(allowed).toBeTrue();
      done();
    });
  });

  it('logs out and blocks access when refresh fails', (done) => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(100);
    authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('expired')));

    const result = run();
    (result as any).subscribe((allowed: boolean) => {
      expect(allowed).toBeFalse();
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });
});
