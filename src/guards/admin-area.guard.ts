import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

/**
 * Entry to the admin dashboard layout (/admin/dashboard).
 *
 * Admins keep the existing admin session (loginGuard pattern: `authState` set
 * by the /admin login). Moderators signed in with their Centinela account are
 * also let in, but only to the sections allowed by `adminSessionGuard` /
 * `moderatorGuard`. Everyone else goes back to the admin login page.
 */
export const adminAreaGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const moderationService = inject(ModerationService);

  if (authenticationService.isAuthenticated()) {
    return true;
  }

  return moderationService
    .isModerator()
    .pipe(map((isModerator) => (isModerator ? true : router.createUrlTree(['/admin']))));
};

/**
 * Admin-only sections (dashboard, logger, fairness, analytics). Users that only
 * reached the admin area as moderators are sent to the moderation section.
 */
export const adminSessionGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);

  return authenticationService.isAuthenticated()
    ? true
    : router.createUrlTree(['/admin/dashboard/moderation']);
};
