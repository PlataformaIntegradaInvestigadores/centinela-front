import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketPhase2Service {
  private groupSockets: { [key: string]: WebSocketSubject<any> } = {};
  public topicReceived: Subject<any> = new Subject<any>();
  public notificationReceived: Subject<any> = new Subject<any>();

  /**
   * Connect to WebSocket for the specified group ID.
   * @param groupId - The group ID to connect to.
   * @returns WebSocketSubject for the group.
   */
  connect(groupId: string): WebSocketSubject<any> {
    if (!this.groupSockets[groupId] || this.groupSockets[groupId].closed) {
      this.groupSockets[groupId] = webSocket(`${environment.wsUrl}/phase2/groups/${groupId}/`);
      this.groupSockets[groupId].subscribe((message) => this.handleMessage(groupId, message));
    }
    return this.groupSockets[groupId];
  }

  /**
   * Handle incoming messages from the WebSocket.
   * @param groupId - The group ID for which the message was received.
   * @param message - The received message.
   */
  private handleMessage(groupId: string, message: any): void {
    //console.log(`Message received on WebSocket 2 for group ${groupId}:`, JSON.stringify(message, null, 2));

    if (message && message.message) {
      const { type } = message.message;

      switch (type) {
        case 'connection_count':
          break;
        case 'topic_reorder':
          this.topicReceived.next(message.message);
          break;
        case 'topic_tag':
          this.topicReceived.next(message.message);
          break;

        default:
          console.warn('Unknown message type:', type);
      }
    } else {
      console.warn('Received message with unexpected structure:', message);
    }
  }

  /**
   * Send a message to the WebSocket for the specified group ID.
   * @param groupId - The group ID to send the message to.
   * @param message - The message to send.
   */
  sendMessage(groupId: string, message: any): void {
    if (this.groupSockets[groupId]) {
      this.groupSockets[groupId].next(message);
    } else {
      console.warn(`No WebSocket connection found for group ${groupId} to send message.`);
    }
  }

  /**
   * Close the WebSocket connection for the specified group ID.
   * @param groupId - The group ID to close the connection for.
   */
  close(groupId: string): void {
    if (this.groupSockets[groupId]) {
      this.groupSockets[groupId].complete();
      delete this.groupSockets[groupId];
    } else {
      console.warn(`No WebSocket connection found for group ${groupId} to close.`);
    }
  }

  /**
   * Close all WebSocket connections.
   */
  closeAll(): void {
    for (const groupId in this.groupSockets) {
      this.groupSockets[groupId].complete();
    }
    this.groupSockets = {};
  }
}
