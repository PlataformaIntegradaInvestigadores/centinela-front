import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPosture } from '../entities/user-posture.interface';

@Injectable({
  providedIn: 'root',
})
export class UserPostureService {
  private apiUrl = `${environment.apiSocial}/v1/postures`;
  private headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la postura del usuario actual para un debate específico.
   * @param debateId ID del debate
   * @returns Observable con la postura del usuario o un error si no existe
   */
  getUserPostureByDebate(debateId: number): Observable<UserPosture> {
    return this.http.get<UserPosture>(`${this.apiUrl}/debate/${debateId}/`, {
      headers: this.headers,
    });
  }

  /**
   * Obtiene la postura del usuario actual para un debate específico.
   * @param debateId ID del debate
   * @returns Observable con la postura del usuario o null si no tiene
   */
  getUserPosture(debateId: number): Observable<UserPosture> {
    return this.http.get<UserPosture>(`${this.apiUrl}/debate/${debateId}/`, {
      headers: this.headers,
    });
  }

  /**
   * Registra una nueva postura en el backend.
   * @param data Contiene el ID del debate y la postura seleccionada.
   */
  createUserPosture(posture: UserPosture): Observable<UserPosture> {
    return this.http.post<UserPosture>(`${this.apiUrl}/`, posture, { headers: this.headers });
  }

  /**
   * Actualiza una postura existente.
   * @param id ID de la postura existente.
   * @param data Contiene la postura actualizada.
   */
  updateUserPosture(
    postureId: number,
    updatedPosture: Partial<UserPosture>,
  ): Observable<UserPosture> {
    return this.http.patch<UserPosture>(`${this.apiUrl}/${postureId}/`, updatedPosture, {
      headers: this.headers,
    });
  }
}
