import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';
import { moderatorGuard } from './moderator.guard';

describe('moderatorGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let moderationServiceSpy: jasmine.SpyObj<ModerationService>;
  let router: jasmine.SpyObj<Router>;
  const loginTree = {} as UrlTree;
  const adminTree = {} as UrlTree;

  const run = () =>
    TestBed.runInInjectionContext(() =>
      moderatorGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    moderationServiceSpy = jasmine.createSpyObj('ModerationService', ['isModerator']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) =>
      commands[0] === '/login' ? loginTree : adminTree,
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ModerationService, useValue: moderationServiceSpy },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('redirects anonymous users to login', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    expect(run()).toBe(loginTree);
    expect(moderationServiceSpy.isModerator).not.toHaveBeenCalled();
  });

  it('lets moderators in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    moderationServiceSpy.isModerator.and.returnValue(of(true));
    let result: unknown;
    (run() as Observable<boolean | UrlTree>).subscribe((value) => (result = value));
    expect(result).toBeTrue();
  });

  it('sends non-moderators to the admin login', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    moderationServiceSpy.isModerator.and.returnValue(of(false));
    let result: unknown;
    (run() as Observable<boolean | UrlTree>).subscribe((value) => (result = value));
    expect(result).toBe(adminTree);
  });
});
