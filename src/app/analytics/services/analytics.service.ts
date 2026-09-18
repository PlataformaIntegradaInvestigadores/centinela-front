import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// --- Interfaces que coinciden con los Schemas de FastAPI ---

export interface DataPoint {
  year: number;
  publications: number;
  type: 'actual' | 'predicted';
}

export interface ProjectionResponse {
  affiliation_name: string;
  data: DataPoint[];
}

export interface AffiliationListResponse {
  affiliations: string[];
}

export interface ComparisonResponse {
  results: ProjectionResponse[];
}

export interface RankingItem {
  rank: number;
  affiliation_name: string;
  current_year_publications: number;
  predicted_next_year_publications: number;
  growth: number;
  growth_percentage: number;
}

export interface RankingResponse {
  ranking: RankingItem[];
}

export interface ModelPerformance {
  mae: number;
  rmse: number;
}

export interface ModelDetailsResponse {
  model_type: string;
  training_data_range: string;
  target_variable: string;
  total_affiliations: number;
  performance_metrics: ModelPerformance;
  feature_importances: { [key: string]: number };
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = environment.apiPredictive;

  constructor(private http: HttpClient) {}

  getAffiliations(): Observable<AffiliationListResponse> {
    return this.http.get<AffiliationListResponse>(`${this.apiUrl}/affiliations`);
  }

  getProjection(
    affiliationName: string,
    projectionYears: number,
    hypotheticalAuthors?: number,
  ): Observable<ProjectionResponse> {
    const params: { projection_years: number; hypothetical_authors?: number } = {
      projection_years: projectionYears,
    };
    if (hypotheticalAuthors !== null && hypotheticalAuthors !== undefined) {
      params.hypothetical_authors = hypotheticalAuthors;
    }
    return this.http.get<ProjectionResponse>(`${this.apiUrl}/projection/${affiliationName}`, {
      params,
    });
  }

  getComparison(
    affiliationNames: string[],
    projectionYears: number,
  ): Observable<ComparisonResponse> {
    const body = { affiliation_names: affiliationNames };
    return this.http.post<ComparisonResponse>(
      `${this.apiUrl}/projection/compare?projection_years=${projectionYears}`,
      body,
    );
  }

  getRanking(): Observable<RankingResponse> {
    return this.http.get<RankingResponse>(`${this.apiUrl}/ranking`);
  }

  getModelDetails(): Observable<ModelDetailsResponse> {
    return this.http.get<ModelDetailsResponse>(`${this.apiUrl}/model-details`);
  }
}
