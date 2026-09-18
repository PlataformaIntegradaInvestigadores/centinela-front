import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserProfile } from '../entities/user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiIdentity;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la información de un usuario por su ID.
   * @param userId - El ID del usuario.
   * @returns Un Observable que emite la información del usuario.
   */
  getUserById(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/${userId}`);
  }
}
