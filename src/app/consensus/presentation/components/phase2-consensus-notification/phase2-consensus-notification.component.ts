import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  NotificationAdd,
  NotificationGeneral,
} from 'src/app/consensus/domain/entities/notificationAdd.interface';
import { GetNotificationAddTopicService } from 'src/app/consensus/domain/services/GetNotificationAddTopicService.service';
import { WebSocketPhase2Service } from 'src/app/consensus/domain/services/websocket-phase2.service';

@Component({
  selector: 'phase2-consensus-notification',
  templateUrl: './phase2-consensus-notification.component.html',
  styleUrls: ['./phase2-consensus-notification.component.css'],
})
export class Phase2ConsensusNotificationComponent implements OnInit, OnDestroy {
  newNotificationSubscription: Subscription | undefined;
  notificationsWS: NotificationAdd[] = [];
  notificationsLoaded: NotificationGeneral[] = [];
  unifiedNotifications: any[] = [];

  groupId: string = '';

  constructor(
    private webSocketService: WebSocketPhase2Service,
    private notificationService: GetNotificationAddTopicService,
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

    /* Lo que trae el webscoket */
    this.newNotificationSubscription = this.webSocketService.topicReceived.subscribe(
      (topic: any) => {
        const notification: NotificationAdd = {
          ...topic,
          added_at: new Date(topic.added_at),
        };
        if (
          !this.notificationsWS.some(
            (t) => t.notification_message === notification.notification_message,
          )
        ) {
          const addTopicNotification: NotificationAdd = {
            id: notification.id,
            user_id: notification.user_id,
            group_id: notification.group_id,
            type: notification.type,
            topic_name: notification.topic_name,
            notification_message: notification.notification_message,
            added_at: new Date(notification.added_at),
            profile_picture_url: this.getProfilePictureUrl(notification.profile_picture_url),
          };

          this.notificationsWS.unshift(addTopicNotification);
          this.updateUnifiedNotifications();
          this.cdr.detectChanges();
        }
      },
    );

    this.newNotificationSubscription = this.webSocketService.notificationReceived.subscribe(
      (notification: any) => {
        if (notification.type === 'topic_reorder') {
          const existingNotificationIndex = this.notificationsLoaded.findIndex(
            (n) => n.id === notification.id,
          );
          if (existingNotificationIndex !== -1) {
            // Remove the existing notification
            this.notificationsLoaded.splice(existingNotificationIndex, 1);
          }

          const visitedNotification: NotificationGeneral = {
            id: notification.id,
            user_id: notification.user_id,
            group_id: notification.group_id,
            notification_type: notification.type,
            message: notification.notification_message,
            created_at: new Date(notification.added_at),
            profile_picture_url: this.getProfilePictureUrl(notification.profile_picture_url),
          };
          this.notificationsLoaded.unshift(visitedNotification);
          this.updateUnifiedNotifications();
          this.cdr.detectChanges();
        }
      },
    );
  }

  ngOnDestroy(): void {
    if (this.newNotificationSubscription) {
      this.newNotificationSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotificationsPhaseTwo(this.groupId).subscribe(
      (notifications) => {
        this.notificationsLoaded = notifications.map((notification) => ({
          ...notification,
          created_at: new Date(notification.created_at),
        }));

        this.updateUnifiedNotifications();
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading notifications:', error);
      },
    );
  }

  connectWebSocket(): void {
    if (this.groupId) {
      this.newNotificationSubscription = this.webSocketService.notificationReceived.subscribe(
        (notification: any) => {
          const existingNotificationIndex = this.notificationsLoaded.findIndex(
            (n) => n.id === notification.id,
          );
          if (existingNotificationIndex !== -1) {
            // Remove the existing notification
            this.notificationsLoaded.splice(existingNotificationIndex, 1);
          }

          const newNotification: NotificationGeneral = {
            id: notification.id,
            user_id: notification.user_id,
            group_id: notification.group_id,
            notification_type: notification.type,
            message: notification.notification_message,
            created_at: new Date(notification.added_at),
            profile_picture_url: this.getProfilePictureUrl(notification.profile_picture_url),
          };
          this.notificationsLoaded.unshift(newNotification);
          this.updateUnifiedNotifications();
          this.cdr.detectChanges();
        },
      );
    }
  }

  updateUnifiedNotifications(): void {
    this.unifiedNotifications = [
      ...this.notificationsLoaded.map((notification) => ({
        ...notification,
        type: 'rest',
        date: notification.created_at,
        message: notification.message,
      })),
      ...this.notificationsWS.map((notification) => ({
        ...notification,
        type: 'ws',
        date: notification.added_at,
        message: notification.notification_message,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
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
