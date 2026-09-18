import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Phase2ConsensusNotificationComponent } from './phase2-consensus-notification.component';
import { GetNotificationAddTopicService } from 'src/app/consensus/domain/services/GetNotificationAddTopicService.service';
import { WebSocketPhase2Service } from 'src/app/consensus/domain/services/websocket-phase2.service';

describe('Phase2ConsensusNotificationComponent', () => {
  let component: Phase2ConsensusNotificationComponent;
  let notificationServiceSpy: jasmine.SpyObj<GetNotificationAddTopicService>;
  let wsServiceSpy: jasmine.SpyObj<WebSocketPhase2Service>;
  let topicReceived: Subject<any>;
  let notificationReceived: Subject<any>;

  function build(groupId: string | null) {
    notificationServiceSpy = jasmine.createSpyObj('GetNotificationAddTopicService', [
      'getNotificationsPhaseTwo',
    ]);
    notificationServiceSpy.getNotificationsPhaseTwo.and.returnValue(of([]));
    topicReceived = new Subject<any>();
    notificationReceived = new Subject<any>();
    wsServiceSpy = {} as jasmine.SpyObj<WebSocketPhase2Service>;
    (wsServiceSpy as any).topicReceived = topicReceived;
    (wsServiceSpy as any).notificationReceived = notificationReceived;

    TestBed.configureTestingModule({
      declarations: [Phase2ConsensusNotificationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GetNotificationAddTopicService, useValue: notificationServiceSpy },
        { provide: WebSocketPhase2Service, useValue: wsServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: of(convertToParamMap({ groupId: groupId ?? '' })) } },
        },
      ],
    });
    component = TestBed.createComponent(Phase2ConsensusNotificationComponent).componentInstance;
    spyOn((component as any).cdr, 'detectChanges');
  }

  it('should create', () => {
    build(null);
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('reads the group id, loads notifications, and connects the socket', () => {
      build('g-1');
      component.ngOnInit();
      expect(component.groupId).toBe('g-1');
      expect(notificationServiceSpy.getNotificationsPhaseTwo).toHaveBeenCalledWith('g-1');
    });

    it('adds a new topic notification once, deduplicating by message', () => {
      build('g-1');
      component.ngOnInit();
      const topic = {
        id: 1,
        user_id: 'u1',
        group_id: 'g-1',
        type: 'topic_added',
        topic_name: 'T',
        notification_message: 'msg-1',
        added_at: '2024-01-01T00:00:00Z',
      };
      topicReceived.next(topic);
      topicReceived.next(topic);
      expect(component.notificationsWS.length).toBe(1);
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });

    it('processes a topic_reorder notification and dedupes by id', () => {
      build('g-1');
      component.ngOnInit();
      const notif = {
        id: 5,
        user_id: 'u1',
        group_id: 'g-1',
        type: 'topic_reorder',
        notification_message: 'reordered',
        added_at: '2024-01-02T00:00:00Z',
      };
      notificationReceived.next(notif);
      notificationReceived.next({ ...notif, notification_message: 'reordered-again' });
      expect(component.notificationsLoaded.length).toBe(1);
      expect(component.notificationsLoaded[0].message).toBe('reordered-again');
    });

    it('still adds an unrelated-type notification, since connectWebSocket subscribes to the same subject without a type filter', () => {
      build('g-1');
      component.ngOnInit();
      notificationReceived.next({ id: 9, type: 'unrelated', added_at: '2024-01-01T00:00:00Z' });
      expect(component.notificationsLoaded.length).toBe(1);
    });
  });

  describe('loadNotifications', () => {
    it('converts dates and updates unified notifications', () => {
      build('g-1');
      notificationServiceSpy.getNotificationsPhaseTwo.and.returnValue(
        of([{ id: 1, created_at: '2024-01-01T00:00:00Z' } as any]),
      );
      component.loadNotifications();
      expect(component.notificationsLoaded[0].created_at instanceof Date).toBeTrue();
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });

    it('logs an error on failure', () => {
      build('g-1');
      spyOn(console, 'error');
      notificationServiceSpy.getNotificationsPhaseTwo.and.returnValue(
        throwError(() => new Error('boom')),
      );
      component.loadNotifications();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('connectWebSocket via a received message', () => {
    it('adds and sorts a notification when a groupId is set', () => {
      build('g-1');
      component.groupId = 'g-1';
      component.connectWebSocket();
      notificationReceived.next({
        id: 7,
        notification_message: 'direct',
        added_at: '2024-01-05T00:00:00Z',
      });
      expect(component.notificationsLoaded[0].message).toBe('direct');
    });

    it('does not subscribe without a groupId', () => {
      build(null);
      component.groupId = '';
      component.connectWebSocket();
      notificationReceived.next({ id: 1, added_at: '2024-01-01T00:00:00Z' });
      expect(component.notificationsLoaded.length).toBe(0);
    });
  });

  it('formatDate returns a time string for a recent date and a date string for an old one', () => {
    build('g-1');
    const recent = new Date(Date.now() - 1000);
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(component.formatDate(recent)).toBe(recent.toLocaleTimeString());
    expect(component.formatDate(old)).toBe(old.toLocaleDateString());
  });

  describe('getProfilePictureUrl', () => {
    it('returns the default avatar when no url is given', () => {
      build('g-1');
      expect(component.getProfilePictureUrl(undefined)).toBe(
        '../../../../../assets/profile.png',
      );
    });

    it('returns the given url unchanged (empty base url)', () => {
      build('g-1');
      expect(component.getProfilePictureUrl('/media/pic.png')).toBe('/media/pic.png');
    });
  });

  it('ngOnDestroy unsubscribes without throwing', () => {
    build('g-1');
    component.ngOnInit();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
