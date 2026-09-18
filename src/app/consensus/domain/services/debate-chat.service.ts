import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DebateChatService {
  private socket$!: WebSocketSubject<any>;
  private baseUrl = `${environment.wsUrl}/chat`;

  constructor(private http: HttpClient) {}

  /**
   * Conecta al WebSocket utilizando el token almacenado en localStorage.
   * @param groupId ID del grupo.
   * @param debateId ID del debate.
   */
  connect(groupId: string, debateId: string): void {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('El token no está disponible en localStorage.');
      return;
    }

    const url = `${this.baseUrl}/${groupId}/${debateId}/?token=${token}`;

    this.socket$ = webSocket({
      url: url,
      deserializer: (msg) => JSON.parse(msg.data),
      serializer: (value) => JSON.stringify(value),
    });

    this.socket$.subscribe({
      next: (msg) => console.log('Mensaje recibido:', msg),
      error: (err) => console.error('Error en WebSocket:', err),
      complete: () => console.log('Conexión cerrada.'),
    });
  }

  /**
   * Envía un mensaje al WebSocket.
   * @param message El mensaje a enviar.
   */
  sendMessage(message: { text: string; posture: string; parent?: number }): void {
    if (this.socket$) {
      this.socket$.next(message);
    }
  }

  /**
   * Obtiene los mensajes del WebSocket como un observable.
   */
  getMessages(): Observable<any> {
    return this.socket$.asObservable();
  }

  /**
   * Obtiene los mensajes históricos del debate.
   * @param debateId ID del debate.
   */
  getMessageHistory(debateId: number): Observable<any[]> {
    const token = localStorage.getItem('accessToken'); // Obtén el token del localStorage

    if (!token) {
      console.error('Token no encontrado en localStorage.');
      throw new Error('No se puede autenticar la solicitud sin token.');
    }

    const headers = {
      Authorization: `Bearer ${token}`, // Incluye el token en el encabezado
    };

    return this.http.get<any[]>(`${environment.apiSocial}/v1/messages/${debateId}/`, { headers });
  }

  /**
   * Cierra la conexión del WebSocket.
   */
  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
