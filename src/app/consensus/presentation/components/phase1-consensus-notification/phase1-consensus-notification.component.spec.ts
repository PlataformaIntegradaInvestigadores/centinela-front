import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Phase1ConsensusNotificationComponent } from './phase1-consensus-notification.component';
import { GetNotificationAddTopicService } from 'src/app/consensus/domain/services/GetNotificationAddTopicService.service';
import { WebSocketService } from 'src/app/consensus/domain/services/WebSocketService.service';

describe('Phase1ConsensusNotificationComponent', () => {
  let component: Phase1ConsensusNotificationComponent;
  let notificationServiceSpy: jasmine.SpyObj<GetNotificationAddTopicService>;
  let wsServiceSpy: jasmine.SpyObj<WebSocketService>;
  let newTopicReceived: Subject<any>;
  let notificationsReceived: Subject<any>;

  function build(groupId: string | null) {
    notificationServiceSpy = jasmine.createSpyObj('GetNotificationAddTopicService', [
      'getNotificationsAddTopicByGroup',
    ]);
    notificationServiceSpy.getNotificationsAddTopicByGroup.and.returnValue(of([]));
    newTopicReceived = new Subject<any>();
    notificationsReceived = new Subject<any>();
    wsServiceSpy = {} as jasmine.SpyObj<WebSocketService>;
    (wsServiceSpy as any).newTopicReceived = newTopicReceived;
    (wsServiceSpy as any).notificationsReceived = notificationsReceived;

    TestBed.configureTestingModule({
      declarations: [Phase1ConsensusNotificationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GetNotificationAddTopicService, useValue: notificationServiceSpy },
        { provide: WebSocketService, useValue: wsServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: of(convertToParamMap({ groupId: groupId ?? '' })) } },
        },
      ],
    });
    component = TestBed.createComponent(Phase1ConsensusNotificationComponent).componentInstance;
    spyOn((component as any).cdr, 'detectChanges');
  }

  it('should create', () => {
    build(null);
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('reads the group id and loads notifications', () => {
      build('g-1');
      component.ngOnInit();
      expect(component.groupId).toBe('g-1');
      expect(notificationServiceSpy.getNotificationsAddTopicByGroup).toHaveBeenCalledWith('g-1');
    });

    it('adds a new topic notification once, deduplicating by message', () => {
      build('g-1');
      spyOn(console, 'log');
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
      newTopicReceived.next(topic);
      newTopicReceived.next(topic);
      expect(component.notificationsWS.length).toBe(1);
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });

    it('processes recognized notification types and dedupes by id', () => {
      build('g-1');
      component.ngOnInit();
      const notif = {
        id: 5,
        user_id: 'u1',
        group_id: 'g-1',
        type: 'topic_visited',
        notification_message: 'seen',
        added_at: '2024-01-02T00:00:00Z',
      };
      notificationsReceived.next(notif);
      notificationsReceived.next({ ...notif, notification_message: 'seen-again' });
      expect(component.notificationsLoaded.length).toBe(1);
      expect(component.notificationsLoaded[0].message).toBe('seen-again');
    });

    it('ignores unrecognized notification types', () => {
      build('g-1');
      component.ngOnInit();
      notificationsReceived.next({ id: 9, type: 'unrelated', added_at: '2024-01-01T00:00:00Z' });
      expect(component.notificationsLoaded.length).toBe(0);
    });
  });

  describe('loadNotifications', () => {
    it('converts dates and updates unified notifications', () => {
      build('g-1');
      notificationServiceSpy.getNotificationsAddTopicByGroup.and.returnValue(
        of([{ id: 1, created_at: '2024-01-01T00:00:00Z' } as any]),
      );
      component.loadNotifications();
      expect(component.notificationsLoaded[0].created_at instanceof Date).toBeTrue();
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });

    it('logs an error on failure', () => {
      build('g-1');
      spyOn(console, 'error');
      notificationServiceSpy.getNotificationsAddTopicByGroup.and.returnValue(
        throwError(() => new Error('boom')),
      );
      component.loadNotifications();
      expect(console.error).toHaveBeenCalled();
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

  it('ngOnDestroy is a no-op when there is no subscription', () => {
    build('g-1');
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
