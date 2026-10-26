import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

/**
 * Solo moderadores (staff) entran a la cola de revisión. El permiso real lo
 * aplica social-service; este guard solo evita mostrar una pantalla vacía.
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
    .pipe(map((isModerator) => (isModerator ? true : router.createUrlTree(['/feeds']))));
};
