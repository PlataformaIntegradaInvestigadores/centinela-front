import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

/**
 * Only moderators (MODERATOR_USER_IDS / staff in social-service) can open the
 * review queue. The real permission check is enforced by social-service; this
 * guard only avoids rendering an empty screen.
 */
export const moderatorGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const moderationService = inject(ModerationService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return moderationService
    .isModerator()
    .pipe(map((isModerator) => (isModerator ? true : router.createUrlTree(['/admin']))));
};
