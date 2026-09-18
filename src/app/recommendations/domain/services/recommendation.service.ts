import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  GroupsResponse,
  MetricsResponse,
  RecommendationHealthResponse,
  ResearchGroup,
} from '../entities/recommendation.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  // Mismo backend y convención de proxy que AnalyticsService: environment.apiPredictive
  // ya resuelve al prefijo /api/v1 del backend, así que aquí solo se añade el path del router.
  private readonly apiUrl = `${environment.apiPredictive}/recommendations`;

  constructor(private http: HttpClient) {}

  getHealth(): Observable<RecommendationHealthResponse> {
    return this.http.get<RecommendationHealthResponse>(`${this.apiUrl}/health`);
  }

  getGroups(k: number = 10, limit: number = 50): Observable<GroupsResponse> {
    const params = new HttpParams().set('k', k.toString()).set('limit', limit.toString());

    return this.http.get<GroupsResponse>(`${this.apiUrl}/groups`, { params });
  }

  getGroupRecommendations(groupId: number, k: number = 10): Observable<ResearchGroup> {
    const params = new HttpParams().set('k', k.toString());

    return this.http.get<ResearchGroup>(`${this.apiUrl}/group/${groupId}`, { params });
  }

  getMetrics(k: number = 10): Observable<MetricsResponse> {
    const params = new HttpParams().set('k', k.toString());

    return this.http.get<MetricsResponse>(`${this.apiUrl}/metrics`, { params });
  }
}
