import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketPhase3Service } from 'src/app/consensus/domain/services/websocket-phase3.service';

@Component({
  selector: 'phase3-consensus-notification',
  templateUrl: './phase3-consensus-notification.component.html',
  styleUrls: ['./phase3-consensus-notification.component.css'],
})
export class Phase3ConsensusNotificationComponent implements OnInit, OnDestroy {
  satisfactionNotifications: any[] = [];
  groupId: string = '';
  private wsSubscription: Subscription | undefined;

  constructor(
    private webSocketService: WebSocketPhase3Service,
    private topicService: TopicService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.groupId = params.get('groupId') || '';
      this.loadNotifications();
      this.connectWebSocket();
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.topicService.getUserSatisfactionNotifications(this.groupId).subscribe(
      (notifications) => {
        notifications.forEach((notification: any) => {
          // Convertir `created_at` a objeto Date
          notification.created_at = new Date(notification.created_at);
          this.satisfactionNotifications.push(notification);
        });
        // Ordenar notificaciones por `created_at` de más reciente a más antigua
        this.sortNotifications();
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading notifications:', error);
      },
    );
  }

  connectWebSocket(): void {
    if (this.groupId) {
      this.webSocketService.connect(this.groupId);
      this.wsSubscription = this.webSocketService.userSatisfactionReceived.subscribe(
        (msg) => {
          // Convertir `added_at` a objeto Date si existe
          if (msg.added_at) {
            msg.added_at = new Date(msg.added_at);
          }
          // Convertir `created_at` a objeto Date si no es null, de lo contrario usar `added_at`
          msg.created_at = msg.created_at ? new Date(msg.created_at) : msg.added_at;

          msg.profile_picture_url = this.getProfilePictureUrl(msg.profile_picture_url);

          this.satisfactionNotifications.push(msg);
          // Ordenar notificaciones por `created_at` de más reciente a más antigua
          this.sortNotifications();
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error receiving WebSocket notification:', error);
        },
      );
    }
  }

  sortNotifications(): void {
    this.satisfactionNotifications.sort((a, b) => b.created_at - a.created_at);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return date.toLocaleTimeString(); // HH:MM AM/PM format
    } else {
      return date.toLocaleDateString(); // MM/DD/YYYY format
    }
  }

  getProfilePictureUrl(url: string | undefined): string {
    const baseUrl = '';
    return url ? `${baseUrl}${url}` : '../../../../../assets/profile.png';
  }
}
