import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Status } from '../entities/author.comparator.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateCentinelaService {
  RootUrl = environment.apiSearch;
  constructor(private httpClient: HttpClient) {}

  updateAuthorsCentinela(): Observable<Status> {
    return this.httpClient.post<Status>(
      `${this.RootUrl}/v1/information/update/author-information/`,
      {},
    );
  }
  searchArticlesCentinela(): Observable<Status> {
    return this.httpClient.get<Status>(`${this.RootUrl}/v1/scopus-integration/`);
  }
}
