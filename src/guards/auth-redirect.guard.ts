import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthModalService } from 'src/app/auth/domain/services/auth-modal.service';

@Injectable({
  providedIn: 'root',
})
export class AuthRedirectGuard implements CanActivate {
  constructor(
    private router: Router,
    private authModalService: AuthModalService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Redirigir a home
    this.router.navigate(['/home']);

    // Abrir el modal correspondiente basado en la ruta
    setTimeout(() => {
      if (route.routeConfig?.path === 'login') {
        this.authModalService.openLogin();
      } else if (route.routeConfig?.path === 'register') {
        this.authModalService.openRegister();
      }
    }, 100); // Pequeño delay para asegurar que la navegación complete

    return false; // Prevenir la activación de la ruta original
  }
}
