import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Article,
  PaginationArticleResult,
  SearchFiltersResponse,
} from '../../../shared/interfaces/article.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  rootURL: string = environment.apiSearch;

  constructor(private http: HttpClient) {}

  getArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.rootURL}/v2/articles/${id}`);
  }

  getSearchFilters(): Observable<SearchFiltersResponse> {
    return this.http.get<SearchFiltersResponse>(`${this.rootURL}/v2/search/filters`);
  }

  getMostRelevantArticlesByQuery(
    query: string,
    page: number,
    size: number,
    years?: number[],
  ): Observable<PaginationArticleResult> {
    const bodyParams: {
      query: string;
      page: number;
      page_size: number;
      filters?: { years: number[] };
    } = {
      query,
      page,
      page_size: size,
    };

    if (years && years.length > 0) {
      bodyParams.filters = {
        years: years ?? [],
      };
    }

    return this.http.post<PaginationArticleResult>(
      `${this.rootURL}/v2/articles/relevant`,
      bodyParams,
    );
  }

  getArticlesByAuthor(authorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.rootURL}/v2/articles/by-author?author_id=${authorId}`);
  }
}
