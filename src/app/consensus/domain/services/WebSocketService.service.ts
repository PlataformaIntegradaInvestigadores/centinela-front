// websocket.service.ts

import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private sockets: { [key: string]: WebSocketSubject<any> } = {};
  public newTopicReceived: Subject<any> = new Subject<any>();
  public notificationsReceived: Subject<any> = new Subject<any>();

  connect(groupId: string): WebSocketSubject<any> {
    if (!this.sockets[groupId] || this.sockets[groupId].closed) {
      this.sockets[groupId] = webSocket(`${environment.wsUrl}/groups/${groupId}/`);
      this.sockets[groupId].subscribe((msg) => {
        // Imprimir la estructura completa del mensaje recibido
        //console.log(`Message received on group ws service estructura completa del mensaje recibido ${groupId}:`, JSON.stringify(msg, null, 2));

        // Verificar si msg.message existe antes de acceder a sus propiedades
        if (msg && msg.message) {
          const { type } = msg.message;

          switch (type) {
            case 'new_topic':
              this.newTopicReceived.next(msg.message);
              break;

            case 'connection_count':
              break;

            case 'topic_visited':
              this.notificationsReceived.next(msg.message);
              break;

            case 'combined_search':
              this.notificationsReceived.next(msg.message);
              break;

            case 'user_expertise':
              this.notificationsReceived.next(msg.message);
              break;

            case 'consensus_completed':
              this.notificationsReceived.next(msg.message);
              break;

            case 'debate_created':
              this.notificationsReceived.next(msg.message);
              break;
            case 'debate_closed':
              this.notificationsReceived.next(msg.message);
              break;
            case 'posture_created':
              this.notificationsReceived.next(msg.message);
              break;
            case 'posture_updated':
              this.notificationsReceived.next(msg.message);
              break;

            default:
              console.warn('Tipo de mensaje desconocido:', type);
          }
        } else {
          console.warn('Received message without expected structure:', msg);
        }
      });
    } else {
      console.log(`Reusing existing WebSocket connection for group: ${groupId}`);
    }
    return this.sockets[groupId];
  }

  sendMessage(groupId: string, message: any) {
    if (this.sockets[groupId]) {
      this.sockets[groupId].next(message);
    } else {
      console.warn(`No WebSocket connection found for group ${groupId} to send message.`);
    }
  }

  close(groupId: string) {
    if (this.sockets[groupId]) {
      this.sockets[groupId].complete();
      delete this.sockets[groupId];
    } else {
      console.warn(`No WebSocket connection found for group ${groupId} to close.`);
    }
  }

  closeAll() {
    for (const groupId in this.sockets) {
      this.sockets[groupId].complete();
    }
    this.sockets = {};
  }
}
