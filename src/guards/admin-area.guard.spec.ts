import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';
import { adminAreaGuard, adminSessionGuard } from './admin-area.guard';

describe('admin area guards', () => {
  let authenticationSpy: jasmine.SpyObj<AuthenticationService>;
  let moderationServiceSpy: jasmine.SpyObj<ModerationService>;
  let router: jasmine.SpyObj<Router>;
  const adminLoginTree = { target: '/admin' } as unknown as UrlTree;
  const moderationTree = { target: 'moderation' } as unknown as UrlTree;

  const run = (guard: typeof adminAreaGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    authenticationSpy = jasmine.createSpyObj('AuthenticationService', ['isAuthenticated']);
    moderationServiceSpy = jasmine.createSpyObj('ModerationService', ['isModerator']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) =>
      commands[0] === '/admin' ? adminLoginTree : moderationTree,
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: authenticationSpy },
        { provide: ModerationService, useValue: moderationServiceSpy },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('adminAreaGuard', () => {
    it('lets admins with an admin session in without checking moderation', () => {
      authenticationSpy.isAuthenticated.and.returnValue(true);
      expect(run(adminAreaGuard)).toBeTrue();
      expect(moderationServiceSpy.isModerator).not.toHaveBeenCalled();
    });

    it('lets moderators in', () => {
      authenticationSpy.isAuthenticated.and.returnValue(false);
      moderationServiceSpy.isModerator.and.returnValue(of(true));
      let result: unknown;
      (run(adminAreaGuard) as Observable<boolean | UrlTree>).subscribe((v) => (result = v));
      expect(result).toBeTrue();
    });

    it('sends everyone else to the admin login', () => {
      authenticationSpy.isAuthenticated.and.returnValue(false);
      moderationServiceSpy.isModerator.and.returnValue(of(false));
      let result: unknown;
      (run(adminAreaGuard) as Observable<boolean | UrlTree>).subscribe((v) => (result = v));
      expect(result).toBe(adminLoginTree);
    });
  });

  describe('adminSessionGuard', () => {
    it('allows admins', () => {
      authenticationSpy.isAuthenticated.and.returnValue(true);
      expect(run(adminSessionGuard)).toBeTrue();
    });

    it('sends moderator-only users to the moderation section', () => {
      authenticationSpy.isAuthenticated.and.returnValue(false);
      expect(run(adminSessionGuard)).toBe(moderationTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/dashboard/moderation']);
    });
  });
});
