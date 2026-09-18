import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Debate } from '../entities/debate.interface';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WebSocketSubject } from 'rxjs/webSocket';

interface DebateSocketMessage {
  type?: string;
  time_left?: number;
  message?: string;
  action?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DebateService {
  //WebSocket
  private socket$: WebSocketSubject<DebateSocketMessage> | null = null;
  private countdownSubject = new BehaviorSubject<number | null>(null);
  private debateClosedSubject = new BehaviorSubject<boolean>(false);
  private baseUrl = `${environment.wsUrl}/debate`;

  // URL de la API

  private apiUrl = `${environment.apiSocial}/v1/groups/`;
  private validateDebateStatusSubject = new Subject<void>();
  validateDebateStatus$ = this.validateDebateStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  connect(debateId: number): void {
    const token = this.getAuthToken();
    if (!token) {
      console.error('No access token found. WebSocket connection aborted.');
      return;
    }

    const url = `${this.baseUrl}/${debateId}/?token=${token}`;

    if (!this.socket$) {
      this.socket$ = new WebSocketSubject(url);

      this.socket$.subscribe(
        (msg) => {
          if (msg.type === 'countdown') {
            this.countdownSubject.next(msg.time_left ?? null);
          } else if (msg.type === 'debate_closed') {
            this.debateClosedSubject.next(true);
            alert(msg.message);
          }
        },
        (err) => console.error('WebSocket error:', err),
        () => console.log('WebSocket connection closed'),
      );
    }
  }

  startCountdown(duration: number = 60): void {
    if (this.socket$) {
      this.socket$.next({ action: 'start_countdown', duration });
    }
  }

  closeDebateManually(): void {
    if (this.socket$) {
      this.socket$.next({ action: 'close_debate' });
    }
  }

  getCountdown(): Observable<number | null> {
    return this.countdownSubject.asObservable();
  }

  getDebateClosedStatus(): Observable<boolean> {
    return this.debateClosedSubject.asObservable();
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  // Obtiene los datos del debate
  getDebates(groupId: string): Observable<Debate[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Añade el token
      'Content-Type': 'application/json',
    });

    if (!groupId || groupId.trim() === '') {
      console.error('El groupId es inválido:', groupId);
      throw new Error('El groupId es requerido para obtener los debates.');
    }

    const url = `${this.apiUrl}${groupId}/debates/`; // Construye la URL
    console.log('URL de la API para getDebates:', url);

    return this.http.get<Debate[]>(url, { headers });
  }

  createDebate(groupId: string, debate: Debate | undefined): Observable<Debate> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    return this.http.post<Debate>(`${this.apiUrl}${groupId}/debates/`, debate, { headers });
  }

  // Verificar si existe un debate
  getDebateDetails(groupId: string, debateId: number): Observable<Debate> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const url = `${this.apiUrl}${groupId}/debates/${debateId}/`;
    return this.http.get<Debate>(url, { headers });
  }

  // Validar si el debate está abierto
  validateDebateStatus(groupId: string, debateId: number): Observable<{ is_open: boolean }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const url = `${this.apiUrl}${groupId}/debates/${debateId}/validate-status/`;
    return this.http.get<{ detail: string }>(url, { headers }).pipe(
      map((response) => ({ is_open: response.detail === 'El debate está abierto.' })), // Devuelve un objeto con is_open
    );
  }

  closeDebate(groupId: string, debateId: number): Observable<Debate> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    });
    const url = `${this.apiUrl}${groupId}/debates/${debateId}/close/`;
    return this.http.post<Debate>(url, {}, { headers });
  }

  triggerValidateDebateStatus() {
    this.validateDebateStatusSubject.next();
  }
}
