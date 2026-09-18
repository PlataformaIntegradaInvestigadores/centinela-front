import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ArticleComparator,
  AuthorComparator,
  ModelCorpusObserver,
  Status,
} from '../entities/author.comparator.interface';
import {
  DashboardCounts,
  YearsResponse,
  EtlStatusResponse,
  SystemHealth,
  HeatmapResponse,
  Word,
} from '../../../shared/interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardAdminService {
  rootURL: string = environment.apiSearch;
  constructor(private httpClient: HttpClient) {}

  getAuthorComparator(): Observable<AuthorComparator> {
    return this.httpClient.get<AuthorComparator>(
      `${this.rootURL}/v1/dashboard/information/get_authors_comparator/`,
    );
  }

  getArticlesComparator(): Observable<ArticleComparator> {
    return this.httpClient.get<ArticleComparator>(
      `${this.rootURL}/v1/dashboard/information/get_articles_comparator/`,
    );
  }

  getmodelCorpusObserver(): Observable<ModelCorpusObserver> {
    return this.httpClient.get<ModelCorpusObserver>(
      `${this.rootURL}/v1/dashboard/information/tfidf_model_corpus/`,
    );
  }

  generateCorpus(): Observable<Status> {
    return this.httpClient.post<Status>(`${this.rootURL}/v1/generate-corpus/`, {});
  }

  generateModel(): Observable<Status> {
    return this.httpClient.post<Status>(`${this.rootURL}/v1/generate-model/`, {});
  }

  getNoSqlDbYears(): Observable<YearsResponse[]> {
    return this.httpClient.get<YearsResponse[]>(
      `${this.rootURL}/v1/dashboard/country/get_last_years/`,
    );
  }
  getNoSqlDbCounts(year: number): Observable<DashboardCounts> {
    const params = new HttpParams().set('year', year.toString());
    return this.httpClient.get<DashboardCounts>(
      `${this.rootURL}/v1/dashboard/country/get_acumulated/`,
      { params },
    );
  }

  populateNoSqlDb(): Observable<Status> {
    return this.httpClient.post<Status>(`${this.rootURL}/v1/dashboard/populate`, {});
  }

  runEtl(): Observable<EtlStatusResponse> {
    return this.httpClient.post<EtlStatusResponse>(`${this.rootURL}/v1/admin/etl/run/`, {});
  }

  getEtlStatus(): Observable<EtlStatusResponse> {
    return this.httpClient.get<EtlStatusResponse>(`${this.rootURL}/v1/admin/etl/run/`);
  }

  getSystemHealth(): Observable<SystemHealth> {
    return this.httpClient.get<SystemHealth>(
      `${this.rootURL}/v1/dashboard/information/get_system_health/`,
    );
  }

  getTopAffiliationsYear(year: number): Observable<Word[]> {
    const params = new HttpParams().set('year', year.toString());
    return this.httpClient.get<Word[]>(
      `${this.rootURL}/v1/dashboard/affiliation/get_top_affiliations_year/`,
      { params },
    );
  }

  getTopicsHeatmap(year: number): Observable<HeatmapResponse> {
    const params = new HttpParams().set('year', year.toString());
    return this.httpClient.get<HeatmapResponse>(
      `${this.rootURL}/v1/dashboard/affiliation/get_topics_heatmap/`,
      { params },
    );
  }

  getCountryTopics(numberTop: number): Observable<Word[]> {
    const params = new HttpParams().set('number_top', numberTop.toString());
    return this.httpClient.get<Word[]>(`${this.rootURL}/v1/dashboard/country/get_topics/`, {
      params,
    });
  }
}
