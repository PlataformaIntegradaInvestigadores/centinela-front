import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Job, JobCreate, JobFilter } from '../entities/job.interface';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  private apiUrl = environment.apiSocial;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Obtiene la lista de trabajos con filtros opcionales
   */
  getJobs(filters?: JobFilter): Observable<Job[]> {
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
          if (filters.q) params = params.set('q', filters.q);
          if (filters.location) params = params.set('location', filters.location);
          if (filters.type) params = params.set('type', filters.type);
          if (filters.experience) params = params.set('experience', filters.experience);
          if (filters.remote !== undefined)
            params = params.set('remote', filters.remote.toString());
        }

        return this.http.get<Job[]>(`${this.apiUrl}/v1/jobs/`, { headers, params });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtiene un trabajo específico por ID
   */
  getJob(jobId: number): Observable<Job> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<Job>(`${this.apiUrl}/v1/jobs/${jobId}/`, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Crea un nuevo trabajo (solo para empresas)
   */
  createJob(jobData: JobCreate): Observable<Job> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        });

        return this.http.post<Job>(`${this.apiUrl}/v1/jobs/`, jobData, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Actualiza un trabajo existente (solo para la empresa propietaria)
   */
  updateJob(jobId: number, jobData: Partial<JobCreate>): Observable<Job> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        });

        return this.http.put<Job>(`${this.apiUrl}/v1/jobs/${jobId}/`, jobData, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Elimina un trabajo (solo para la empresa propietaria)
   */
  deleteJob(jobId: number): Observable<void> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.delete<void>(`${this.apiUrl}/v1/jobs/${jobId}/`, { headers });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtiene trabajos recomendados para el usuario actual
   */
  getRecommendedJobs(limit: number = 10): Observable<{ count: number; results: Job[] }> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        const params = new HttpParams().set('limit', limit.toString());

        return this.http.get<{ count: number; results: Job[] }>(
          `${this.apiUrl}/v1/jobs/recommendations/`,
          { headers, params },
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtiene trabajos trending
   */
  getTrendingJobs(limit: number = 10): Observable<{ count: number; results: Job[] }> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        const params = new HttpParams().set('limit', limit.toString());

        return this.http.get<{ count: number; results: Job[] }>(
          `${this.apiUrl}/v1/jobs/trending/`,
          { headers, params },
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Realiza búsqueda semántica de trabajos
   */
  semanticSearch(query: string): Observable<Job[]> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        });

        return this.http.post<Job[]>(
          `${this.apiUrl}/v1/jobs/semantic-search/`,
          { query },
          { headers },
        );
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Obtiene trabajos de una empresa específica
   */
  getJobsByCompany(companyId: string): Observable<Job[]> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        const params = new HttpParams().set('company', companyId);

        return this.http.get<Job[]>(`${this.apiUrl}/v1/jobs/`, { headers, params });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Jobs Service Error:', error);
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
