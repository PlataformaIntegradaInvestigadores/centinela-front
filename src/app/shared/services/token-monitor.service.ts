import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TokenMonitorService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private checkInterval: ReturnType<typeof setInterval> | undefined;
  private warningShown = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.startTokenMonitoring();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Inicia el monitoreo automático del token.
   */
  private startTokenMonitoring(): void {
    // Verificar cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkTokenExpiration();
    }, 30000);
  }

  /**
   * Verifica si el token está próximo a expirar y toma las acciones necesarias.
   */
  private checkTokenExpiration(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    const timeUntilExpiration = this.authService.getTokenExpirationTime();

    // Si el token ha expirado
    if (timeUntilExpiration <= 0) {
      this.handleTokenExpired();
      return;
    }

    // Si el token expira en menos de 2 minutos, intentar refrescarlo
    if (timeUntilExpiration < 120) {
      this.attemptTokenRefresh();
      return;
    }

    // Si el token expira en menos de 5 minutos, mostrar advertencia (solo una vez)
    if (timeUntilExpiration < 300 && !this.warningShown) {
      this.showExpirationWarning();
    }
  }

  /**
   * Maneja el caso cuando el token ha expirado.
   */
  private handleTokenExpired(): void {
    console.warn('Token has expired, logging out user');
    this.authService.clearLocalSession();
    this.router.navigate(['/login']);
    this.showExpiredMessage();
  }

  /**
   * Intenta refrescar el token automáticamente.
   */
  private attemptTokenRefresh(): void {
    console.log('Attempting to refresh token...');

    this.authService
      .refreshToken()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to refresh token:', error);
          this.handleTokenExpired();
          throw error;
        }),
      )
      .subscribe({
        next: () => {
          console.log('Token refreshed successfully');
          this.warningShown = false; // Reset warning flag
        },
        error: (error) => {
          console.error('Token refresh failed:', error);
        },
      });
  }

  /**
   * Muestra una advertencia de que el token está próximo a expirar.
   */
  private showExpirationWarning(): void {
    this.warningShown = true;

    // Solo mostrar en console por ahora, puedes integrar con un servicio de notificaciones
    console.warn('Session will expire soon. Activity detected, attempting to refresh token...');

    // Opcional: Mostrar una notificación toast
    // this.notificationService.showWarning('Tu sesión expirará pronto. Se renovará automáticamente.');
  }

  /**
   * Muestra un mensaje de que la sesión ha expirado.
   */
  private showExpiredMessage(): void {
    // Opcional: Mostrar una notificación toast
    console.warn('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');

    // Si tienes un servicio de notificaciones:
    // this.notificationService.showError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }

  /**
   * Reinicia el monitoreo después de un login exitoso.
   */
  restartMonitoring(): void {
    this.warningShown = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.startTokenMonitoring();
  }

  /**
   * Detiene el monitoreo (útil para logout).
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.warningShown = false;
  }
}
