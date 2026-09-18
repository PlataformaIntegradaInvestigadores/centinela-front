import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Group } from '../entities/group.interface';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { ErrorService } from 'src/app/auth/domain/services/error.service';
import { LoadingService } from './loadingService.service';

@Injectable({
  providedIn: 'root',
})
export class GetGroupsService {
  private apiUrl = `${environment.apiIdentity}/test/user/groups/`; // Base URL para las peticiones a /test/user/groups/

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private errorService: ErrorService,
    private loadingService: LoadingService,
  ) {}

  // Método para obtener grupos con autenticación
  getGroupsByUserId(): Observable<Group[]> {
    this.loadingService.show(); // Mostrar el indicador de carga
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          this.loadingService.hide(); // Ocultar el indicador de carga si no hay token
          return throwError(() => new Error('No authentication token found'));
        }
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });
        return this.http.get<Group[]>(this.apiUrl, { headers }).pipe(
          tap((groups) => {
            console.log('Fetched groups:', groups); // Imprimir los arreglos de grupos en la consola
            this.loadingService.hide(); // Ocultar el indicador de carga al recibir la respuesta
          }),
        );
      }),
      catchError((error) => {
        this.loadingService.hide(); // Ocultar el indicador de carga en caso de error
        console.error('Error fetching groups:', error);
        return throwError(() => new Error('Error fetching groups: ' + error.message));
      }),
    );
  }

  deleteGroup(groupId: string): Observable<void> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });
        return this.http.delete<void>(`${this.apiUrl}${groupId}/delet8e/`, { headers });
      }),
      catchError((error) => {
        this.errorService.handleError();
        return throwError(() => new Error('Error deleting group: ' + error.message));
      }),
    );
  }

  leaveGroup(groupId: string): Observable<void> {
    return this.authService.getToken().pipe(
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('No authentication token found'));
        }
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });
        return this.http.post<void>(`${this.apiUrl}${groupId}/leave7/`, {}, { headers });
      }),
      catchError((error) => {
        this.errorService.handleError();
        return throwError(() => new Error('Error leaving group: ' + error.message));
      }),
    );
  }
}
