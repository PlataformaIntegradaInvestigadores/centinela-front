import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

/**
 * Guard que permite el acceso solo a usuarios con rol de researcher.
 * Las empresas (companies) serán redirigidas a su perfil.
 */
export const researcherOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Verificar si el usuario está autenticado
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el usuario es un researcher
  if (authService.isUser()) {
    return true;
  }

  // Si es una empresa, redirigir a su perfil
  if (authService.isCompany()) {
    const companyId = authService.getCompanyId();
    if (companyId) {
      router.navigate(['/company', companyId]);
    } else {
      router.navigate(['/home']);
    }
    return false;
  }

  // En caso de que no sea ni usuario ni empresa, redirigir al login
  router.navigate(['/login']);
  return false;
};
