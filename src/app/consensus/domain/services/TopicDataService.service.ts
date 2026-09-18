// src/app/services/topic.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, map } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { RecommendedTopic, TopicAddedUser } from '../entities/topic.interface';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { RESTConsensusResult, Result } from '../repositories/rest-consensus-results.interface';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private apiUrl = `${environment.apiSocial}/v1/groups/`;
  private topicsSubject = new BehaviorSubject<TopicAddedUser[]>([]);
  topics$ = this.topicsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getRandomRecommendedTopics(groupId: string): Observable<RecommendedTopic[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<RecommendedTopic[]>(`${this.apiUrl}${groupId}/topics/random/`, { headers })
      .pipe(catchError(this.handleError));
  }

  /* Para obtener los tópicos recomendados para un grupo específico */
  getRecommendedTopicsByGroup(groupId: string): Observable<RecommendedTopic[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<RecommendedTopic[]>(`${this.apiUrl}${groupId}/recommended-topics/`, { headers })
      .pipe(catchError(this.handleError));
  }

  /* Para obtener los tópicos ya votados */
  getFinalsTopicsByGroup(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get(`${this.apiUrl}${groupId}/finals-topics/`, { headers })
      .pipe(catchError(this.handleError));
  }

  getTopicsAddedByGroup(groupId: string): Observable<TopicAddedUser[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<TopicAddedUser[]>(`${this.apiUrl}${groupId}/added-topics/`, { headers })
      .pipe(catchError(this.handleError));
  }

  getGroupTopics(
    groupId: string,
  ): Observable<{ recommended_topics: RecommendedTopic[]; added_topics: TopicAddedUser[] }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http
      .get<{ recommended_topics: RecommendedTopic[]; added_topics: TopicAddedUser[] }>(
        `${this.apiUrl}${groupId}/topics/`,
        { headers },
      )
      .pipe(catchError(this.handleError));
  }

  addNewTopic(groupId: string, topicName: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const userId = this.authService.getUserId();
    const body = { topic: topicName, user_id: userId };

    // Imprimir la estructura de datos que se enviará
    console.log('Datos que se enviarán:', JSON.stringify(body, null, 2));

    return this.http.get<any>(`${this.apiUrl}${groupId}/current-phase/`, { headers }).pipe(
      switchMap((phaseResponse) => {
        if (phaseResponse.phase >= 2) {
          return throwError({
            status: 403,
            error: {
              error:
                'A user in this group is already in phase 2, adding new topics is not allowed.',
            },
          });
        } else {
          return this.http.post<any>(`${this.apiUrl}${groupId}/add-topic/`, body, { headers }).pipe(
            tap((response) => {
              const currentTopics = this.topicsSubject.getValue();
              this.topicsSubject.next([...currentTopics, response]);
            }),
          );
        }
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  updateTopics(newTopic: TopicAddedUser): void {
    const currentTopics = this.topicsSubject.getValue();
    this.topicsSubject.next([...currentTopics, newTopic]);
  }

  notifyTopicVisited(groupId: string, topicId: string, userId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      topic_id: topicId,
      user_id: userId,
    };
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/topic-visited/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  notifyCombinedSearch(groupId: string, topicIds: string[], userId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      topics: topicIds,
      user_id: userId,
    };
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/combined-search/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  notifyExpertice(
    groupId: string,
    topicId: number,
    userId: string,
    expertiseLevel: number,
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      group_id: groupId,
      topic_id: topicId,
      user_id: userId,
      expertise_level: expertiseLevel,
    };
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/user-expertise/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  notifyPhaseOneCompleted(groupId: string, userId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      user_id: userId,
    };
    //console.log('Datos que se enviarán:', JSON.stringify(body, null, 2));
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/phase-one-completed/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  notifyTopicReorder(
    groupId: string,
    userId: string,
    topicId: string,
    originalPosition: number,
    newPosition: number,
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      user_id: userId,
      topic_id: topicId,
      original_position: originalPosition,
      new_position: newPosition,
    };
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/topic-reorder/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  // Método para notificar el cambio de etiqueta del tópico
  notifyTopicTagChange(
    groupId: string,
    userId: string,
    topicId: number,
    tag: string,
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      user_id: userId,
      topic_id: topicId,
      tag: tag,
    };
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/tag-topic/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  // Método para guardar el orden final de los tópicos
  saveFinalTopicOrder(groupId: string, userId: string, finalTopicOrders: any[]): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const body = {
      final_topic_orders: finalTopicOrders,
    };
    return this.http
      .post<any>(`${this.apiUrl}${groupId}/save-final-topic-order/`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  getConsensusResults(groupId: string): Observable<RESTConsensusResult> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.get<RESTConsensusResult>(
      `${this.apiUrl}${groupId}/execute_consensus_calculations/`,
      { headers },
    );
  }

  getConsensusResultsByVotingType(groupId: string, votingType: string): Observable<Result[]> {
    if (groupId === '') return throwError(() => new Error('Group ID is empty'));

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });

    return this.http
      .get<RESTConsensusResult>(
        `${this.apiUrl}${groupId}/execute_consensus_calculations/${votingType}/`,
        { headers },
      )
      .pipe(
        map((restConsensusResult) => restConsensusResult.results),
        catchError((error) => {
          console.error('Error fetching consensus results:', error);
          return throwError(() => new Error('Error fetching consensus results'));
        }),
      );
  }

  saveUserSatisfaction(
    groupId: string,
    userId: string,
    satisfactionLevel: string,
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    const body = { satisfaction_level: satisfactionLevel };
    return this.http.post(`${this.apiUrl}${groupId}/user_satisfaction/`, body, { headers });
  }

  getUserSatisfactionNotifications(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.get(`${this.apiUrl}${groupId}/satisfaction/notifications/`, { headers });
  }

  getSatisfactionCounts(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.get(`${this.apiUrl}${groupId}/satisfaction-counts/`, { headers });
  }

  getUserCurrentPhase(groupId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    return this.http.get(`${this.apiUrl}${groupId}/current-phase/`, { headers });
  }

  changeUserPhase(groupId: string, newPhase: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
    const body = { phase: newPhase };
    return this.http.post(`${this.apiUrl}${groupId}/update-phase/`, body, { headers });
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
