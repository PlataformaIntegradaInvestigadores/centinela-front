import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  ApplicationFilter,
} from '../entities/application.interface';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = environment.apiSocial;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Obtiene las aplicaciones del usuario actual (si es researcher)
   * o las aplicaciones a los trabajos de la empresa (si es company)
   */
  getApplications(filters?: ApplicationFilter): Observable<Application[]> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        let params = new HttpParams();
        if (filters) {
          if (filters.job_id) params = params.set('job_id', filters.job_id.toString());
          if (filters.status) params = params.set('status', filters.status);
        }

        return this.http.get<Application[]>(`${this.apiUrl}/v1/applications/`, { headers, params });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtiene una aplicación específica por ID
   */
  getApplication(applicationId: number): Observable<Application> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<Application>(`${this.apiUrl}/v1/applications/${applicationId}/`, {
          headers,
        });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Crear una nueva aplicación (solo para researchers)
   */
  createApplication(applicationData: ApplicationCreate): Observable<Application> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        let headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        // Si hay archivo, usar FormData
        let body: FormData | Pick<ApplicationCreate, 'job' | 'cover_letter'>;
        if (applicationData.resume_file) {
          const formBody = new FormData();
          formBody.append('job', applicationData.job.toString());
          if (applicationData.cover_letter) {
            formBody.append('cover_letter', applicationData.cover_letter);
          }
          formBody.append('resume_file', applicationData.resume_file);
          // No añadir Content-Type para FormData, el navegador lo hará automáticamente
          body = formBody;
        } else {
          headers = headers.set('Content-Type', 'application/json');
          body = {
            job: applicationData.job,
            cover_letter: applicationData.cover_letter,
          };
        }

        return this.http.post<Application>(`${this.apiUrl}/v1/applications/`, body, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Actualizar una aplicación existente
   */
  updateApplication(
    applicationId: number,
    applicationData: ApplicationUpdate,
  ): Observable<Application> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        let headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        // Si hay archivo, usar FormData
        let body: FormData | ApplicationUpdate;
        if (applicationData.resume_file) {
          const formBody = new FormData();
          if (applicationData.status) formBody.append('status', applicationData.status);
          if (applicationData.notes) formBody.append('notes', applicationData.notes);
          if (applicationData.cover_letter)
            formBody.append('cover_letter', applicationData.cover_letter);
          formBody.append('resume_file', applicationData.resume_file);
          // No añadir Content-Type para FormData
          body = formBody;
        } else {
          headers = headers.set('Content-Type', 'application/json');
          body = applicationData;
        }

        return this.http.put<Application>(
          `${this.apiUrl}/v1/applications/${applicationId}/`,
          body,
          { headers },
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Eliminar una aplicación (solo el usuario que se postuló)
   */
  deleteApplication(applicationId: number): Observable<void> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.delete<void>(`${this.apiUrl}/v1/applications/${applicationId}/`, {
          headers,
        });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtener aplicaciones para un trabajo específico (solo para empresas)
   */
  getJobApplications(jobId: number): Observable<Application[]> {
    return this.getApplications({ job_id: jobId });
  }

  /**
   * Verificar si el usuario actual ya postuló a un trabajo específico
   */
  checkApplicationStatus(
    jobId: number,
  ): Observable<{ has_applied: boolean; application: Application | null }> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<{ has_applied: boolean; application: Application | null }>(
          `${this.apiUrl}/v1/jobs/${jobId}/application-status/`,
          { headers },
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtener todas las postulaciones de la empresa actual (solo para empresas)
   */
  getCompanyApplications(filters?: ApplicationFilter): Observable<Application[]> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        let params = new HttpParams();
        if (filters) {
          if (filters.job_id) params = params.set('job_id', filters.job_id.toString());
          if (filters.status) params = params.set('status', filters.status);
        }

        return this.http.get<Application[]>(`${this.apiUrl}/v1/company/applications/`, {
          headers,
          params,
        });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtener todas las postulaciones del usuario actual (solo para usuarios)
   */
  getUserApplications(statusFilter?: string): Observable<Application[]> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        let params = new HttpParams();
        if (statusFilter) {
          params = params.set('status', statusFilter);
        }

        return this.http.get<Application[]>(`${this.apiUrl}/v1/user/applications/`, {
          headers,
          params,
        });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Application service error:', error);
    return throwError(() => error);
  }
}
