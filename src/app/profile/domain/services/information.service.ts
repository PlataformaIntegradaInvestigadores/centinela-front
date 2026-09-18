import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserInfo } from '../entities/user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class InformationService {
  private apiUrl = environment.apiIdentity;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los encabezados HTTP con el token de autorización.
   * @returns Un objeto con los encabezados HTTP.
   */
  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  /**
   * Obtiene la información del perfil de un usuario específico.
   * @param userId - El ID del usuario cuya información de perfil se desea obtener.
   * @returns Un Observable que emite la información del perfil del usuario.
   */
  getInformation(userId: string): Observable<UserInfo> {
    return this.http.get<UserInfo>(
      `${this.apiUrl}/profile-information/${userId}/`,
      this.getHeaders(),
    );
  }

  /**
   * Actualiza la información del perfil.
   * @param info - La nueva información del perfil.
   * @returns Un Observable que emite la respuesta de la actualización.
   */
  updateInformation(info: UserInfo): Observable<UserInfo> {
    return this.http.put<UserInfo>(`${this.apiUrl}/profile-information/`, info, this.getHeaders());
  }

  /**
   * Elimina la información del perfil.
   * @returns Un Observable que emite la respuesta de la eliminación.
   */
  deleteInformation(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/profile-information/`, this.getHeaders());
  }

  /**
   * Obtiene la información pública del perfil de un usuario específico.
   * @param userId - El ID del usuario cuya información pública de perfil se desea obtener.
   * @returns Un Observable que emite la información pública del perfil del usuario.
   */
  getPublicInformation(userId: string): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiUrl}/profile-information/${userId}/`);
  }
}
