import { Injectable } from '@angular/core';

/**
 * Sesion del panel de administracion.
 *
 * El login de admin (`POST /v1/auth/login/`) devuelve un token firmado que se manda en
 * la cabecera `X-Admin-Token` a las rutas de administracion. Se guarda en
 * `sessionStorage` (no sobrevive al cerrar la pestana) y nunca se guarda la contrasena.
 */
@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly tokenKey = 'adminToken';
  private readonly expiresKey = 'adminTokenExpiresAt';
  private readonly authStateKey = 'authState';

  start(token: string, expiresInSeconds: number): void {
    sessionStorage.setItem(this.tokenKey, token);
    sessionStorage.setItem(this.expiresKey, String(Date.now() + expiresInSeconds * 1000));
    localStorage.setItem(this.authStateKey, 'authenticated');
  }

  /** Token vigente, o `null` si no hay o ya vencio (en ese caso limpia la sesion). */
  token(): string | null {
    const token = sessionStorage.getItem(this.tokenKey);
    if (!token) {
      return null;
    }
    const expiresAt = Number(sessionStorage.getItem(this.expiresKey));
    if (!expiresAt || Date.now() >= expiresAt) {
      this.clear();
      return null;
    }
    return token;
  }

  clear(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.expiresKey);
    localStorage.removeItem(this.authStateKey);
  }
}
