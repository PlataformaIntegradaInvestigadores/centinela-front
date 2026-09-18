import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DebateStatisticsService {
  private apiUrl = `${environment.apiSocial}/v1/debates`;
  private debateIdSubject = new Subject<number>(); // Emitirá el debateId
  debateId$ = this.debateIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas de posturas de un debate específico.
   * @param debateId ID del debate.
   */
  getStatistics(debateId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.get(`${this.apiUrl}/${debateId}/statistics/`, { headers });
  }

  sendDebateId(debateId: number): void {
    this.debateIdSubject.next(debateId); // Envía el debateId a los suscriptores
  }
}
