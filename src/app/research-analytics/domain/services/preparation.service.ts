import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PreparationConfiguration, QualityReport, WorksetSummary } from '../entities/preparation';

@Injectable({ providedIn: 'root' })
export class PreparationService {
  private readonly base = `${environment.apiAnalytics}/corpus`;
  constructor(private readonly http: HttpClient) {}

  quality(): Observable<QualityReport> {
    return this.http.get<QualityReport>(`${this.base}/quality`);
  }

  preview(configuration: PreparationConfiguration): Observable<WorksetSummary> {
    return this.http.post<WorksetSummary>(`${this.base}/preparation/preview`, configuration);
  }

  create(
    configuration: PreparationConfiguration,
    expectedWorksetId: string,
  ): Observable<WorksetSummary> {
    return this.http.post<WorksetSummary>(`${this.base}/worksets`, {
      configuration,
      expected_workset_id: expectedWorksetId,
    });
  }

  workset(identifier: string): Observable<WorksetSummary> {
    return this.http.get<WorksetSummary>(`${this.base}/worksets/${encodeURIComponent(identifier)}`);
  }
}
