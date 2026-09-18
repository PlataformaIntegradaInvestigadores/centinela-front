import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { researcherOnlyGuard } from './researcher-only.guard';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

describe('researcherOnlyGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'isUser',
      'isCompany',
      'getCompanyId',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function run(): boolean {
    return TestBed.runInInjectionContext(() =>
      researcherOnlyGuard({} as any, {} as any),
    ) as boolean;
  }

  it('redirects to login and blocks access when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    expect(run()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('allows access for a logged-in researcher', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.isUser.and.returnValue(true);
    expect(run()).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects a company to its profile when companyId is known', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.isUser.and.returnValue(false);
    authServiceSpy.isCompany.and.returnValue(true);
    authServiceSpy.getCompanyId.and.returnValue('c-7');

    expect(run()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/company', 'c-7']);
  });

  it('redirects a company without a known id to /home', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.isUser.and.returnValue(false);
    authServiceSpy.isCompany.and.returnValue(true);
    authServiceSpy.getCompanyId.and.returnValue(null);

    expect(run()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('redirects to login when user type is neither user nor company', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.isUser.and.returnValue(false);
    authServiceSpy.isCompany.and.returnValue(false);

    expect(run()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
