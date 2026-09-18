import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  private apiUrl = `${environment.apiSocial}/v1/reactions`;

  constructor(private http: HttpClient) {}

  /**
   * Agrega una reacción (Me gusta) a un mensaje.
   * @param data Contiene el ID del mensaje al que se reacciona.
   */
  addReaction(data: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    return this.http.post(this.apiUrl, data, { headers });
  }

  /**
   * Elimina una reacción existente.
   * @param id ID de la reacción a eliminar.
   */
  removeReaction(id: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.delete(`${this.apiUrl}/${id}/`, { headers });
  }
}
