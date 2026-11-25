import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ResearchStudy } from '../entities/study';

@Injectable({ providedIn: 'root' })
export class StudyService {
  constructor(private readonly http: HttpClient) {}
  load(releaseId?: string): Observable<ResearchStudy> {
    return this.http.get<ResearchStudy>(
      `${environment.apiAnalytics}/study`,
      releaseId ? { params: { release_id: releaseId } } : {},
    );
  }
}
