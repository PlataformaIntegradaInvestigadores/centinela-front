import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ModeratedContentType,
  ModerationDecision,
  ReportResult,
  ReviewCaseDetail,
  ReviewQueueFilters,
  ReviewQueuePage,
} from '../entities/moderation.interface';

/**
 * Moderación de discurso de odio. Todo pasa por social-service: el front
 * nunca habla con hatespeech-service directamente.
 */
@Injectable({
  providedIn: 'root',
})
export class ModerationService {
  private readonly baseUrl = `${environment.apiSocial}/v1`;
  private moderatorCheck$: Observable<boolean> | null = null;
  private moderatorCheckToken: string | null = null;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /** ¿El usuario actual puede usar la cola de revisión? (cacheado por token) */
  isModerator(): Observable<boolean> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return of(false);
    }
    if (!this.moderatorCheck$ || this.moderatorCheckToken !== token) {
      this.moderatorCheckToken = token;
      this.moderatorCheck$ = this.http
        .get<{ is_moderator: boolean }>(`${this.baseUrl}/moderation/me/`, {
          headers: this.getHeaders(),
        })
        .pipe(
          map((response) => !!response.is_moderator),
          catchError(() => of(false)),
          shareReplay(1),
        );
    }
    return this.moderatorCheck$;
  }

  report(contentType: ModeratedContentType, id: string, reason?: string): Observable<ReportResult> {
    const path = contentType === 'post' ? 'posts' : 'comments';
    const body = reason && reason.trim() ? { reason: reason.trim() } : {};
    return this.http.post<ReportResult>(`${this.baseUrl}/${path}/${id}/report/`, body, {
      headers: this.getHeaders(),
    });
  }

  getQueue(filters: ReviewQueueFilters): Observable<ReviewQueuePage> {
    let params = new HttpParams()
      .set('status', filters.status)
      .set('limit', filters.limit)
      .set('offset', filters.offset);
    if (filters.reason) {
      params = params.set('reason', filters.reason);
    }
    if (filters.content_type) {
      params = params.set('content_type', filters.content_type);
    }
    return this.http.get<ReviewQueuePage>(`${this.baseUrl}/moderation/review-queue/`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getCase(caseId: number): Observable<ReviewCaseDetail> {
    return this.http.get<ReviewCaseDetail>(`${this.baseUrl}/moderation/review-queue/${caseId}/`, {
      headers: this.getHeaders(),
    });
  }

  decide(caseId: number, decision: ModerationDecision, notes?: string): Observable<unknown> {
    const body: { decision: ModerationDecision; notes?: string } = { decision };
    if (notes && notes.trim()) {
      body.notes = notes.trim();
    }
    return this.http.post(`${this.baseUrl}/moderation/review-queue/${caseId}/decision/`, body, {
      headers: this.getHeaders(),
    });
  }

  /** Mensaje legible para errores del backend (503 si el modelo no está disponible). */
  errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }
    if (error.status === 503) {
      return 'El servicio de moderación no está disponible. Intenta más tarde.';
    }
    const detail = error.error?.detail;
    return typeof detail === 'string' && detail ? detail : fallback;
  }
}
