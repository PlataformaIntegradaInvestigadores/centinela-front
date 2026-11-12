import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
  AuthorSearchResult,
  AuthorSearchResponse,
  RecommendRequest,
  RecommendResponse,
  RecommenderError,
  RecommenderHealth,
} from '../entities/team-recommendation.interface';

/** Estados HTTP con los que el proxy (ng serve / gateway) indica que el backend no responde. */
const UNAVAILABLE_STATUSES = [0, 502, 503, 504];

/**
 * Cliente de ethical-recommender-service. Usa el path relativo environment.apiRecommender
 * (mismo origen, convención del repo). Igual que /api/predictive, gateway-service reescribe
 * /api/recommender/<ruta> a /api/v1/<ruta> del servicio (y /api/recommender/health a /health);
 * en local, proxy.conf.json replica esa reescritura contra uvicorn en http://localhost:8000.
 *
 * Los endpoints son públicos: si no hay sesión, AuthInterceptor deja pasar la petición sin
 * cabecera Authorization; si la hay, el backend la ignora (nunca responde 401).
 */
@Injectable({
  providedIn: 'root',
})
export class TeamRecommenderService {
  private readonly baseUrl = environment.apiRecommender;

  constructor(private http: HttpClient) {}

  health(): Observable<RecommenderHealth> {
    return this.http.get<RecommenderHealth>(`${this.baseUrl}/health`);
  }

  searchAuthors(query: string, limit: number = 8): Observable<AuthorSearchResult[]> {
    const params = new HttpParams().set('q', query.trim()).set('limit', limit.toString());
    return this.http
      .get<AuthorSearchResponse>(`${this.baseUrl}/authors`, { params })
      .pipe(map((response) => response.results ?? []));
  }

  recommend(request: RecommendRequest): Observable<RecommendResponse> {
    return this.http.post<RecommendResponse>(`${this.baseUrl}/recommend`, request);
  }

  /** Traduce un error HTTP del recomendador a un mensaje en español para la UI. */
  toRecommenderError(error: unknown): RecommenderError {
    if (!(error instanceof HttpErrorResponse)) {
      return { kind: 'unexpected', message: 'Ocurrió un error inesperado.', unknownIds: [] };
    }
    if (UNAVAILABLE_STATUSES.includes(error.status) || this.isProxyError(error)) {
      return {
        kind: 'unavailable',
        message:
          'No se pudo conectar con el servicio de recomendación. Intenta de nuevo en unos ' +
          'minutos; si persiste, verifica que ethical-recommender-service esté en ejecución.',
        unknownIds: [],
      };
    }
    const detail = error.error?.detail;
    if (error.status === 404 && Array.isArray(detail?.unknown_author_ids)) {
      const unknownIds: string[] = detail.unknown_author_ids.map(String);
      return {
        kind: 'unknown_ids',
        message: `Estos investigadores no están en el corpus del modelo: ${unknownIds.join(', ')}.`,
        unknownIds,
      };
    }
    if (error.status === 422) {
      return {
        kind: 'invalid',
        message: `La solicitud no es válida: ${this.detailText(detail)}`,
        unknownIds: [],
      };
    }
    return {
      kind: 'unexpected',
      message: `El servicio respondió con un error (${error.status}).`,
      unknownIds: [],
    };
  }

  /** El proxy de ng serve responde 500 con texto plano cuando el backend rechaza la conexión. */
  private isProxyError(error: HttpErrorResponse): boolean {
    return (
      error.status === 500 &&
      typeof error.error === 'string' &&
      /ECONNREFUSED|proxy/i.test(error.error)
    );
  }

  private detailText(detail: unknown): string {
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((d) => d?.msg ?? String(d)).join('; ');
    }
    return 'parámetros fuera de rango.';
  }
}
