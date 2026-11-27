import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  GovernanceError,
  ResolutionRequest,
  ResolutionResponse,
  ReviewCase,
  ReviewCasePage,
  ReviewCaseQuery,
} from '../entities/review.interface';

/**
 * Supervision API of governance-service. The `AuthInterceptor` adds `X-Admin-Token`
 * (ADR 0005); responses are `no-store`, so nothing here caches protected content.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly root = `${environment.apiGovernance}/review-cases`;

  constructor(private http: HttpClient) {}

  /** Proposed `GET /review-cases` (not yet in the service; see docs/admin-review.md). */
  listCases(query: ReviewCaseQuery = {}): Observable<ReviewCasePage> {
    let params = new HttpParams();
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.caseType) {
      params = params.set('case_type', query.caseType);
    }
    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.limit) {
      params = params.set('limit', query.limit);
    }
    return this.http
      .get<ReviewCasePage>(`${this.root}/`, { params })
      .pipe(catchError((error) => throwError(() => toGovernanceError(error, true))));
  }

  getCase(caseId: string): Observable<ReviewCase> {
    return this.http
      .get<ReviewCase>(`${this.root}/${encodeURIComponent(caseId)}`)
      .pipe(catchError((error) => throwError(() => toGovernanceError(error))));
  }

  resolve(caseId: string, request: ResolutionRequest): Observable<ResolutionResponse> {
    return this.http
      .post<ResolutionResponse>(`${this.root}/${encodeURIComponent(caseId)}/resolution`, request)
      .pipe(catchError((error) => throwError(() => toGovernanceError(error))));
  }
}

export function toGovernanceError(error: HttpErrorResponse, isList = false): GovernanceError {
  const body = error.error;
  const code = typeof body?.code === 'string' ? body.code : null;
  const traceId = typeof body?.trace_id === 'string' ? body.trace_id : null;
  if (code) {
    return { status: error.status, code, traceId };
  }
  if (error.status === 0) {
    return { status: 0, code: 'NETWORK_ERROR', traceId };
  }
  if (isList && (error.status === 404 || error.status === 405)) {
    return { status: error.status, code: 'CASE_LIST_UNAVAILABLE', traceId };
  }
  return { status: error.status, code: 'UNEXPECTED', traceId };
}
