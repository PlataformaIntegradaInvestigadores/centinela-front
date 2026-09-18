import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  LineChartInfo,
  NameValue,
  TopicResponse,
  TopicSummary,
  Word,
  YearsResponse,
} from '../../../shared/interfaces/dashboard.interface';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private apiUrl = environment.apiSearch + '/v1/dashboard';

  constructor(private http: HttpClient) {}

  getOptionYears(topic: string): Observable<YearsResponse[]> {
    const params = new HttpParams().set('topic', topic.toString());
    return this.http.get<YearsResponse[]>(`${this.apiUrl}/country/get_topics_years/`, { params });
  }

  getSummary(topic: string): Observable<TopicSummary> {
    const params = new HttpParams().set('topic', topic.toString());
    return this.http.get<TopicSummary>(`${this.apiUrl}/country/get_topics_summary/`, { params });
  }

  getSummaryYear(topic: string, year: number): Observable<TopicSummary> {
    const params = new HttpParams().set('topic', topic.toString()).set('year', year.toString());
    return this.http.get<TopicSummary>(`${this.apiUrl}/country/get_topics_summary_year/`, {
      params,
    });
  }

  getSummaryAcumulated(topic: string, year: number): Observable<TopicSummary> {
    const params = new HttpParams().set('topic', topic.toString()).set('year', year.toString());
    return this.http.get<TopicSummary>(`${this.apiUrl}/country/get_topics_summary_acumulated/`, {
      params,
    });
  }

  getYears(topic: string): Observable<TopicResponse[]> {
    const params = new HttpParams().set('topic', topic.toString());
    return this.http.get<TopicResponse[]>(`${this.apiUrl}/country/get_topics_year_info/`, {
      params,
    });
  }

  getLineChartTopicInfo(topic: string): Observable<LineChartInfo[]> {
    return this.getYears(topic).pipe(
      map((response) => {
        const nameTopic = response[0].topic_name;
        const series: NameValue[] = response.map((t) => ({
          name: t.year.toString(),
          value: t.total_articles,
        }));
        return [
          {
            name: nameTopic,
            series: series,
          },
        ];
      }),
    );
  }

  getYear(topic: string, year: number): Observable<TopicResponse[]> {
    const params = new HttpParams().set('topic', topic.toString()).set('year', year.toString());
    return this.http.get<TopicResponse[]>(`${this.apiUrl}/country/get_topics_year/`, { params });
  }

  getLineChartAffiliationYear(topic: string, year: number): Observable<LineChartInfo[]> {
    return this.getYear(topic, year).pipe(
      map((response) => {
        const nameTopic = response[0].topic_name;
        const series: NameValue[] = response.map((t) => ({
          name: t.year.toString(),
          value: t.total_articles,
        }));
        return [
          {
            name: nameTopic,
            series: series,
          },
        ];
      }),
    );
  }

  getRangeYear(topic: string, year: number): Observable<TopicResponse[]> {
    const params = new HttpParams().set('topic', topic.toString()).set('year', year.toString());
    return this.http.get<TopicResponse[]>(`${this.apiUrl}/country/get_topics_range_year/`, {
      params,
    });
  }

  getLineChartAffiliationRange(topic: string, year: number): Observable<LineChartInfo[]> {
    return this.getRangeYear(topic, year).pipe(
      map((response) => {
        const nameAffiliation = response[0].topic_name;
        const series: NameValue[] = response.map((t) => ({
          name: t.year.toString(),
          value: t.total_articles,
        }));
        return [
          {
            name: nameAffiliation,
            series: series,
          },
        ];
      }),
    );
  }

  getAffiliations(topic: string): Observable<Word[]> {
    const params = new HttpParams().set('topic', topic.toString());
    return this.http.get<Word[]>(`${this.apiUrl}/country/get_topics_affiliations/`, { params });
  }

  getBarMapInfo(topic: string): Observable<NameValue[]> {
    return this.getAffiliations(topic).pipe(
      map((response) => {
        const info: NameValue[] = response.map((t) => ({
          name: t.text,
          value: t.size,
        }));
        return info;
      }),
    );
  }

  getTopicsAcumulated(topic: string, year: number): Observable<Word[]> {
    const params = new HttpParams().set('topic', topic.toString()).set('year', year.toString());
    return this.http.get<Word[]>(`${this.apiUrl}/country/get_topics_affiliations_acumulated/`, {
      params,
    });
  }

  getBarMapAcumulated(topic: string, year: number): Observable<NameValue[]> {
    return this.getTopicsAcumulated(topic, year).pipe(
      map((response) => {
        const info: NameValue[] = response.map((t) => ({
          name: t.text,
          value: t.size,
        }));
        return info;
      }),
    );
  }

  getTopicsYear(topic: string, year: number): Observable<Word[]> {
    const params = new HttpParams().set('topic', topic.toString()).set('year', year.toString());
    return this.http.get<Word[]>(`${this.apiUrl}/country/get_topics_affiliations_year/`, {
      params,
    });
  }

  getBarMapYear(topic: string, year: number): Observable<NameValue[]> {
    return this.getTopicsYear(topic, year).pipe(
      map((response) => {
        const info: NameValue[] = response.map((t) => ({
          name: t.text,
          value: t.size,
        }));
        return info;
      }),
    );
  }
}
