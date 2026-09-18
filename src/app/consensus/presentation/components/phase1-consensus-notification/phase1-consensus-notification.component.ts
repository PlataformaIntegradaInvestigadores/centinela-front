import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  NotificationAdd,
  NotificationGeneral,
} from 'src/app/consensus/domain/entities/notificationAdd.interface';
import { GetNotificationAddTopicService } from 'src/app/consensus/domain/services/GetNotificationAddTopicService.service';
import { WebSocketService } from 'src/app/consensus/domain/services/WebSocketService.service';

@Component({
  selector: 'phase1-consensus-notification',
  templateUrl: './phase1-consensus-notification.component.html',
  styleUrls: ['./phase1-consensus-notification.component.css'],
})
export class Phase1ConsensusNotificationComponent implements OnInit, OnDestroy {
  newNotificationSubscription: Subscription | undefined;
  notificationsWS: NotificationAdd[] = [];
  notificationsLoaded: NotificationGeneral[] = [];
  unifiedNotifications: any[] = [];

  groupId: string = '';

  constructor(
    private webSocketService: WebSocketService,
    private notificationService: GetNotificationAddTopicService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.groupId = params.get('groupId') || '';
      this.loadNotifications();
    });

    /* Notificar que se agrego un topico en el grupo */
    this.newNotificationSubscription = this.webSocketService.newTopicReceived.subscribe(
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
        console.log('New topic received:', topic);
        console.log('Notifications:', this.unifiedNotifications);
      },
    );

    this.newNotificationSubscription = this.webSocketService.notificationsReceived.subscribe(
      (notification: any) => {
        if (
          notification.type === 'topic_visited' ||
          notification.type === 'combined_search' ||
          notification.type === 'user_expertise' ||
          notification.type === 'consensus_completed' ||
          notification.type === 'debate_created' ||
          notification.type === 'debate_closed' ||
          notification.type === 'posture_created' ||
          notification.type === 'posture_updated'
        ) {
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
    this.notificationService.getNotificationsAddTopicByGroup(this.groupId).subscribe(
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
