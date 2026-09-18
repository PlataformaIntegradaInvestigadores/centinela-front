import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AffiliationInfo, TopicInfo } from '../../../shared/interfaces/dashboard.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SuggestionService {
  private apiUrl = environment.apiSearch + '/v1/dashboard/';
  constructor(private http: HttpClient) {}

  searchAffiliations(query: string): Observable<AffiliationInfo[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<AffiliationInfo[]>(`${this.apiUrl}affiliation/search/`, { params });
  }
  searchTopics(query: string): Observable<TopicInfo[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<TopicInfo[]>(`${this.apiUrl}country/search/`, { params });
  }
}
