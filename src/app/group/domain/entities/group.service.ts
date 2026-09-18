// group.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Group } from './group.interface';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = `${environment.apiIdentity}/groups/`;
  private apiUrl2 = `${environment.apiIdentity}/test/user/groups/`; //obtener los grupos propietario e invitado, en base al id del usuario o autenticado
  private userOwnGroupApiUrl = `${environment.apiIdentity}/test/users/groups/`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  leaveGroup(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });

    return this.http
      .post<void>(`${this.apiUrl2}${groupId}/leave/`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  deleteGroup(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });

    return this.http
      .delete(`${this.apiUrl2}${groupId}/delete/`, { headers })
      .pipe(catchError(this.handleError));
  }

  getGroups(): Observable<Group[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.get<Group[]>(this.apiUrl2, { headers }).pipe(
      map((groups) =>
        groups.map((group) => ({
          ...group,
          owner: group.admin_id, // Temporalmente asignar admin_id como owner
          phase: '1/3', // Valor quemado temporalmente
        })),
      ),
      catchError(this.handleError),
    );
  }

  getUserById(userId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<any>(`${this.userOwnGroupApiUrl}${userId}/`, { headers })
      .pipe(catchError(this.handleError));
  }

  createGroup(groupData: { title: string; description: string; users?: any[] }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });

    return this.http.post(this.apiUrl, groupData, { headers }).pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else if (error.error) {
      // Server-side error
      errorMessage = `Server-side error: ${error.error.detail || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
