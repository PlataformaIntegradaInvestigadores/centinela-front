import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface ModelSummary {
  model_id: string;
  workset_id: string;
  method: 'tfidf-nmf';
  purpose: 'technical';
  evaluation_status: 'not_research_validated';
  fit_document_count: number;
  configuration: Record<string, number>;
  versions: Record<string, string>;
  cutoff: string | null;
  temporal_status: string;
}

export interface ModelPage {
  status: 'ok' | 'empty';
  total: number;
  limit: number;
  offset: number;
  items: ModelSummary[];
}

@Injectable({ providedIn: 'root' })
export class ModelsService {
  constructor(private readonly http: HttpClient) {}
  list(offset = 0) {
    return this.http.get<ModelPage>(`${environment.apiAnalytics}/models`, {
      params: { limit: 20, offset },
    });
  }
  detail(id: string) {
    return this.http.get<ModelSummary>(
      `${environment.apiAnalytics}/models/${encodeURIComponent(id)}`,
    );
  }
}
