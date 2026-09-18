import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthRedirectGuard } from './auth-redirect.guard';
import { AuthModalService } from 'src/app/auth/domain/services/auth-modal.service';

describe('AuthRedirectGuard', () => {
  let guard: AuthRedirectGuard;
  let routerSpy: jasmine.SpyObj<Router>;
  let authModalSpy: jasmine.SpyObj<AuthModalService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authModalSpy = jasmine.createSpyObj('AuthModalService', ['openLogin', 'openRegister']);

    TestBed.configureTestingModule({
      providers: [
        AuthRedirectGuard,
        { provide: Router, useValue: routerSpy },
        { provide: AuthModalService, useValue: authModalSpy },
      ],
    });

    guard = TestBed.inject(AuthRedirectGuard);
  });

  it('always redirects to /home and blocks the original route', () => {
    const allowed = guard.canActivate({ routeConfig: { path: 'login' } } as any);
    expect(allowed).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('opens the login modal for the login route', fakeAsync(() => {
    guard.canActivate({ routeConfig: { path: 'login' } } as any);
    tick(100);
    expect(authModalSpy.openLogin).toHaveBeenCalled();
    expect(authModalSpy.openRegister).not.toHaveBeenCalled();
  }));

  it('opens the register modal for the register route', fakeAsync(() => {
    guard.canActivate({ routeConfig: { path: 'register' } } as any);
    tick(100);
    expect(authModalSpy.openRegister).toHaveBeenCalled();
    expect(authModalSpy.openLogin).not.toHaveBeenCalled();
  }));

  it('opens no modal for an unrelated route', fakeAsync(() => {
    guard.canActivate({ routeConfig: { path: 'other' } } as any);
    tick(100);
    expect(authModalSpy.openLogin).not.toHaveBeenCalled();
    expect(authModalSpy.openRegister).not.toHaveBeenCalled();
  }));
});
