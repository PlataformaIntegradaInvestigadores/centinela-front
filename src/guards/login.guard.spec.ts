import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { loginGuard } from './login.guard';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';

describe('loginGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthenticationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthenticationService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function run(): boolean {
    return TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any)) as boolean;
  }

  it('allows access when authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    expect(run()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /admin and blocks access when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    expect(run()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });
});
