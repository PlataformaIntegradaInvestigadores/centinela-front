import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { NotificationGeneral } from '../entities/notificationAdd.interface';

@Injectable({
  providedIn: 'root',
})
export class GetNotificationAddTopicService {
  private apiUrl = `${environment.apiSocial}/v1/groups/`;

  constructor(private http: HttpClient) {}

  getNotificationsAddTopicByGroup(groupId: string): Observable<NotificationGeneral[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<NotificationGeneral[]>(`${this.apiUrl}${groupId}/notifications/`, { headers })
      .pipe(catchError(this.handleError));
  }

  getNotificationsPhaseTwo(groupId: string): Observable<NotificationGeneral[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<NotificationGeneral[]>(`${this.apiUrl}${groupId}/notifications-phase-two/`, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else if (error.error) {
      errorMessage = `Server-side error: ${error.error.detail || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
