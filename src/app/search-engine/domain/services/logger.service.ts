import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private apiUrl = environment.apiSearch + '/v1/admin/logs/';

  constructor(private http: HttpClient) {}

  getLogs(
    page: number,
    linesPerPage: number,
    level?: string,
    startDate?: string,
    endDate?: string,
    keyword?: string,
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('lines_per_page', linesPerPage.toString());

    if (level) params = params.set('level', level);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    if (keyword) params = params.set('keyword', keyword);
    console.log(params);
    console.log(this.apiUrl);

    return this.http.get<any>(this.apiUrl, { params });
  }
}
