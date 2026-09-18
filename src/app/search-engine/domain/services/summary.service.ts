import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Summary } from '../entities/sumary.interface';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Add this line

@Injectable({ providedIn: 'root' })
export class SummaryService {
  rootURL: string = environment.apiSearch;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<Summary> {
    return this.http.get<Summary>(`${this.rootURL}/v1/summary/`).pipe(
      map((response: Summary) => {
        return response;
      }),
    );
  }
}
