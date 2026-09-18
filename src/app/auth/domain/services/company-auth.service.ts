import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Company, LoginCredentials, AuthResponse } from '../entities/interfaces';

@Injectable({
  providedIn: 'root',
})
export class CompanyAuthService {
  private apiUrl = environment.apiIdentity;

  constructor(private http: HttpClient) {}

  /**
   * Registra una nueva empresa.
   * @param company - Los datos de la empresa a registrar.
   * @returns Un Observable que emite la respuesta del registro.
   */
  register(company: Company): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/companies/register/`, company)
      .pipe(catchError(this.handleError));
  }

  /**
   * Inicia sesión con las credenciales de empresa.
   * @param credentials - Las credenciales de la empresa.
   * @returns Un Observable que emite la respuesta del inicio de sesión.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/companies/token/`, credentials)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene el perfil público de una empresa.
   * @param companyId - ID de la empresa.
   * @returns Un Observable que emite el perfil de la empresa.
   */
  getCompanyProfile(companyId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/companies/${companyId}/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            // Token expirado, intentar refrescar
            return this.refreshToken().pipe(switchMap(() => this.getCompanyProfile(companyId)));
          }
          return this.handleError(error);
        }),
      );
  }

  /**
   * Obtiene el perfil propio de la empresa.
   * @returns Un Observable que emite el perfil de la empresa.
   */
  getMyProfile(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/companies/profile/`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            return this.refreshToken().pipe(switchMap(() => this.getMyProfile()));
          }
          return this.handleError(error);
        }),
      );
  }

  /**
   * Actualiza el perfil de la empresa.
   * @param companyId - ID de la empresa.
   * @param formData - Datos del formulario a actualizar.
   * @returns Un Observable que emite la respuesta de la actualización.
   */
  updateProfile(companyId: string, formData: FormData): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/companies/${companyId}/update/`, formData, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        }),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            return this.refreshToken().pipe(
              switchMap(() => this.updateProfile(companyId, formData)),
            );
          }
          return this.handleError(error);
        }),
      );
  }

  /**
   * Lista todas las empresas.
   * @param verifiedOnly - Si solo incluir empresas verificadas.
   * @returns Un Observable que emite la lista de empresas.
   */
  listCompanies(verifiedOnly: boolean = false): Observable<Company[]> {
    const params = verifiedOnly ? '?verified_only=true' : '';
    return this.http
      .get<Company[]>(`${this.apiUrl}/companies/${params}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            return this.refreshToken().pipe(switchMap(() => this.listCompanies(verifiedOnly)));
          }
          return this.handleError(error);
        }),
      );
  }

  /**
   * Refresca el token de acceso.
   * @returns Un Observable que emite la nueva respuesta del token.
   */
  private refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token not found'));
    }
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/token/refresh/`, { refresh: refreshToken })
      .pipe(
        tap((response) => {
          localStorage.setItem('accessToken', response.access);
        }),
      );
  }

  /**
   * Obtiene los headers de autenticación.
   * @returns HttpHeaders con el token de autorización.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Maneja los errores de las peticiones HTTP.
   * @param error - El error de la petición HTTP.
   * @returns Un Observable que emite el error procesado.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      if (error.error && error.error.errors) {
        // Errores de validación
        const errors = error.error.errors;
        const errorMessages = [];
        for (const field in errors) {
          if (Object.prototype.hasOwnProperty.call(errors, field)) {
            errorMessages.push(...errors[field]);
          }
        }
        errorMessage = errorMessages.join('\n');
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
