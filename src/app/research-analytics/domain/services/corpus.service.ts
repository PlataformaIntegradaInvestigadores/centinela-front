import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ArticleDetail,
  ArticlePage,
  CorpusQuery,
  CorpusSummary,
  DescriptorPage,
} from '../entities/corpus';

@Injectable({ providedIn: 'root' })
export class CorpusService {
  private readonly base = environment.apiAnalytics;

  constructor(private readonly http: HttpClient) {}

  summary(): Observable<CorpusSummary> {
    return this.http.get<CorpusSummary>(`${this.base}/corpus/summary`);
  }

  articles(query: CorpusQuery): Observable<ArticlePage> {
    let params = new HttpParams().set('limit', query.limit).set('offset', query.offset);
    for (const key of ['year', 'has_abstract', 'author', 'descriptor'] as const) {
      const value = query[key];
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ArticlePage>(`${this.base}/corpus/articles`, { params });
  }

  article(identifier: string): Observable<ArticleDetail> {
    return this.http.get<ArticleDetail>(
      `${this.base}/corpus/articles/${encodeURIComponent(identifier)}`,
    );
  }

  descriptors(): Observable<DescriptorPage> {
    return this.http.get<DescriptorPage>(`${this.base}/corpus/descriptors`, {
      params: { limit: 10, offset: 0 },
    });
  }
}
