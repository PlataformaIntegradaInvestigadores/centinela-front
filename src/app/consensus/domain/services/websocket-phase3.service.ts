import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';
import { ConsensusResult } from '../entities/consensus-result.interface';

@Injectable({
  providedIn: 'root',
})
export class WebSocketPhase3Service {
  private groupSockets: { [key: string]: WebSocketSubject<any> } = {};
  public notificationReceived: Subject<ConsensusResult> = new Subject<ConsensusResult>();
  public userSatisfactionReceived: Subject<any> = new Subject<any>();
  public phaseUpdateReceived: Subject<any> = new Subject<any>();
  public userRemoveReceived: Subject<any> = new Subject<any>();

  connect(groupId: string): WebSocketSubject<any> {
    if (!this.groupSockets[groupId] || this.groupSockets[groupId].closed) {
      this.groupSockets[groupId] = webSocket(`${environment.wsUrl}/phase3/groups/${groupId}/`);
      this.groupSockets[groupId].subscribe((message) => this.handleMessage(groupId, message));
    }
    return this.groupSockets[groupId];
  }

  private handleMessage(groupId: string, message: any): void {
    if (message && message.message) {
      const { type, results } = message.message;
      switch (type) {
        case 'connection_count':
          break;
        case 'consensus_calculation_completed':
          this.notificationReceived.next(results);
          break;
        case 'user_satisfaction':
          this.userSatisfactionReceived.next(message.message);
          break;
        case 'phase_update':
          this.phaseUpdateReceived.next(message.message);
          break;
        case 'remove_member':
          this.userRemoveReceived.next(message.message);
          break;
        default:
          console.warn('Unknown message type:', type);
      }
    } else {
      console.warn('Received message with unexpected structure:', message);
    }
  }

  sendMessage(groupId: string, message: any): void {
    if (this.groupSockets[groupId]) {
      this.groupSockets[groupId].next(message);
    } else {
      console.warn(`No WebSocket connection found for group ${groupId} to send message.`);
    }
  }

  close(groupId: string): void {
    if (this.groupSockets[groupId]) {
      this.groupSockets[groupId].complete();
      delete this.groupSockets[groupId];
    } else {
      console.warn(`No WebSocket connection found for group ${groupId} to close.`);
    }
  }

  closeAll(): void {
    for (const groupId in this.groupSockets) {
      this.groupSockets[groupId].complete();
    }
    this.groupSockets = {};
  }
}
