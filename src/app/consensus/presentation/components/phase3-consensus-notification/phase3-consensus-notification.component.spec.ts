import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Phase3ConsensusNotificationComponent } from './phase3-consensus-notification.component';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketPhase3Service } from 'src/app/consensus/domain/services/websocket-phase3.service';

describe('Phase3ConsensusNotificationComponent', () => {
  let component: Phase3ConsensusNotificationComponent;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let wsServiceSpy: jasmine.SpyObj<WebSocketPhase3Service>;
  let userSatisfactionReceived: Subject<any>;

  function build(groupId: string | null) {
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['getUserSatisfactionNotifications']);
    topicServiceSpy.getUserSatisfactionNotifications.and.returnValue(of([]));
    userSatisfactionReceived = new Subject<any>();
    wsServiceSpy = jasmine.createSpyObj('WebSocketPhase3Service', ['connect']);
    (wsServiceSpy as any).userSatisfactionReceived = userSatisfactionReceived;

    TestBed.configureTestingModule({
      declarations: [Phase3ConsensusNotificationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TopicService, useValue: topicServiceSpy },
        { provide: WebSocketPhase3Service, useValue: wsServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: of(convertToParamMap({ groupId: groupId ?? '' })) } },
        },
      ],
    });
    component = TestBed.createComponent(Phase3ConsensusNotificationComponent).componentInstance;
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
      expect(topicServiceSpy.getUserSatisfactionNotifications).toHaveBeenCalledWith('g-1');
      expect(wsServiceSpy.connect).toHaveBeenCalledWith('g-1');
    });

    it('does not connect the socket without a group id', () => {
      build(null);
      component.ngOnInit();
      expect(wsServiceSpy.connect).not.toHaveBeenCalled();
    });
  });

  describe('loadNotifications', () => {
    it('converts dates, appends, sorts, and triggers change detection', () => {
      build('g-1');
      topicServiceSpy.getUserSatisfactionNotifications.and.returnValue(
        of([
          { id: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: 2, created_at: '2024-01-03T00:00:00Z' },
        ]),
      );
      component.loadNotifications();
      expect(component.satisfactionNotifications[0].id).toBe(2); // most recent first
      expect(component.satisfactionNotifications[0].created_at instanceof Date).toBeTrue();
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });

    it('logs an error on failure', () => {
      build('g-1');
      spyOn(console, 'error');
      topicServiceSpy.getUserSatisfactionNotifications.and.returnValue(
        throwError(() => new Error('boom')),
      );
      component.loadNotifications();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('connectWebSocket via a received message', () => {
    it('derives created_at from added_at when created_at is missing, sets a profile url, and sorts', () => {
      build('g-1');
      component.groupId = 'g-1'; // connectWebSocket() only subscribes when groupId is set
      component.connectWebSocket();
      userSatisfactionReceived.next({ added_at: '2024-01-05T00:00:00Z', profile_picture_url: undefined });
      expect(component.satisfactionNotifications[0].created_at).toEqual(
        new Date('2024-01-05T00:00:00Z'),
      );
      expect(component.satisfactionNotifications[0].profile_picture_url).toBe(
        '../../../../../assets/profile.png',
      );
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });

    it('uses created_at directly when present, and prefixes a given profile url', () => {
      build('g-1');
      component.groupId = 'g-1';
      component.connectWebSocket();
      userSatisfactionReceived.next({
        created_at: '2024-01-06T00:00:00Z',
        profile_picture_url: '/media/pic.png',
      });
      expect(component.satisfactionNotifications[0].created_at).toEqual(
        new Date('2024-01-06T00:00:00Z'),
      );
      expect(component.satisfactionNotifications[0].profile_picture_url).toBe('/media/pic.png');
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

  it('ngOnDestroy unsubscribes from the websocket subscription without throwing', () => {
    build('g-1');
    component.connectWebSocket();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
