import { Injectable } from '@angular/core';

import { map, Observable, shareReplay } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Author,
  AuthorResult,
  CoauthorInfo,
  Coauthors,
  PaginationAuthorResult,
  RandItem,
} from '../../../shared/interfaces/author.interface';
import { environment } from 'src/environments/environment';
import {
  AuthorYears,
  LineChartInfo,
  NameValue,
  Word,
} from '../../../shared/interfaces/dashboard.interface';
import { ArticlesResponse } from '../../../shared/interfaces/article.interface';

interface AuthorProfile {
  coauthors?: CoauthorInfo;
  topics?: Word[];
  years?: AuthorYears[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthorService {
  rootURL: string = environment.apiSearch;
  // dashURL: string = environment.apiDashboard;

  // Slice 2 (API Composition): cache por autor del perfil compuesto. shareReplay
  // hace que las multiples secciones (coautores, topics, anios) que consumen
  // distintos componentes compartan UNA sola peticion a /v2/authors/{id}/profile.
  private profileCache = new Map<string, Observable<AuthorProfile>>();

  getAuthorProfile(id: string | number): Observable<AuthorProfile> {
    const key = id.toString();
    if (!this.profileCache.has(key)) {
      this.profileCache.set(
        key,
        this.http
          .get<AuthorProfile>(`${this.rootURL}/v2/authors/${key}/profile`)
          .pipe(shareReplay(1)),
      );
    }
    return this.profileCache.get(key)!;
  }

  constructor(private http: HttpClient) {}

  getAuthorsByQuery(
    query: string,
    page?: number,
    size?: number,
  ): Observable<PaginationAuthorResult> {
    const bodyParams = {
      query: query,
      page: page ?? 1,
      page_size: size ?? 10,
    };

    return this.http
      .post<PaginationAuthorResult>(`${this.rootURL}/v2/authors/search`, bodyParams)
      .pipe(
        map((response) => {
          const mappedData = response.data.map((author) => {
            return this.mapAuthorTopics(author);
          });
          return { data: mappedData, total: response.total };
        }),
      );
  }

  getAuthorById(id: string): Observable<Author> {
    return this.http.get<Author>(`${this.rootURL}/v2/authors/${id}`);
  }

  getCoauthorsById(id: string | number): Observable<CoauthorInfo> {
    // Slice 2: deriva de la composicion v2 en vez de llamar directo a v1.
    return this.getAuthorProfile(id).pipe(map((p) => p.coauthors as CoauthorInfo));
  }

  getMostRelevantAuthors(
    topic: string,
    authors_number?: number,
    typeFilter?: string,
    affiliations?: string[],
  ): Observable<Coauthors> {
    const bodyParams: {
      query: string;
      page: number;
      page_size?: number;
      filters?: { mode?: string; affiliations: string[] };
    } = {
      query: topic,
      page: 1,
      page_size: authors_number,
    };

    if (typeFilter || (affiliations && affiliations.length > 0)) {
      bodyParams.filters = {
        mode: typeFilter,
        affiliations: affiliations ?? [],
      };
    }

    return this.http.post<Coauthors>(`${this.rootURL}/v2/authors/relevant`, bodyParams);
  }

  mapAuthorTopics(author: AuthorResult) {
    if (author.topics.length > 10) {
      author.topics = author.topics.splice(0, 10);
      author.topics.push('...');
    }
    return author;
  }

  // getRandomAuthors(): Observable<RandItem[]> {
  //   return this.http.get<RandItem[]>(`${this.rootURL}random-authors`);
  // }

  getRandomTopics(): Observable<RandItem[]> {
    return this.http.get<RandItem[]>(`${this.rootURL}random-topics`);
  }
  getTopicsById(scopus_id: number): Observable<NameValue[]> {
    // Slice 2: las topics ahora vienen de la composicion v2 (misma forma {text,size}).
    return this.getAuthorProfile(scopus_id).pipe(
      map((p) =>
        ((p.topics || []) as Word[]).map((t) => ({
          name: t.text.toString(),
          value: t.size,
        })),
      ),
    );
  }

  getYears(scopus_id: string): Observable<AuthorYears[]> {
    // Slice 2: los anios ahora vienen de la composicion v2.
    return this.getAuthorProfile(scopus_id).pipe(map((p) => (p.years || []) as AuthorYears[]));
  }

  getLineChartInfo(scopus_id: string, name: string): Observable<LineChartInfo[]> {
    return this.getYears(scopus_id).pipe(
      map((response) => {
        console.log(response);
        const series: NameValue[] = response.map((au) => ({
          name: au.year.toString(),
          value: au.total_articles,
        }));
        console.log(series);
        return [
          {
            name: name,
            series: series,
          },
        ];
      }),
    );
  }

  getArticles(scopus_id: string): Observable<ArticlesResponse[]> {
    const params = new HttpParams().set('author_id', scopus_id.toString());
    return this.http.get<ArticlesResponse[]>(`${this.rootURL}/v2/articles/by-author`, { params });
  }
}
