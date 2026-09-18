import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CompanyProfile, CompanyListItem, CompanyUpdate } from '../entities/company.interface';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private apiUrl = environment.apiIdentity;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Obtiene el perfil de la empresa autenticada
   */
  getMyProfile(): Observable<CompanyProfile> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<CompanyProfile>(`${this.apiUrl}/companies/profile/`, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtiene el perfil público de una empresa específica
   */
  getCompanyProfile(companyId: string): Observable<CompanyProfile> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<CompanyProfile>(`${this.apiUrl}/companies/${companyId}/`, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Actualiza el perfil de la empresa
   */
  updateCompanyProfile(companyId: string, updateData: CompanyUpdate): Observable<CompanyProfile> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const formData = new FormData();

        // Agregar todos los campos al FormData
        Object.keys(updateData).forEach((key) => {
          const value = (updateData as any)[key];
          if (value !== null && value !== undefined) {
            if (key === 'logo' && value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.patch<CompanyProfile>(
          `${this.apiUrl}/companies/${companyId}/update/`,
          formData,
          { headers },
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Lista todas las empresas (opcional: solo verificadas)
   */
  listCompanies(verifiedOnly: boolean = false): Observable<CompanyListItem[]> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        const params = verifiedOnly ? '?verified_only=true' : '';
        return this.http.get<CompanyListItem[]>(`${this.apiUrl}/companies/${params}`, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Company Service Error:', error);
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
