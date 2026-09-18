import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LLMSearchService {
  private apiUrl = environment.apiSearch;

  constructor(private http: HttpClient) {}

  semanticSearch(query: string, topK: number = 10): Observable<any> {
    return this.http.post(`${this.apiUrl}/v2/search`, {
      query,
      page: 1,
      page_size: topK,
      filters: {},
    });
  }
}
