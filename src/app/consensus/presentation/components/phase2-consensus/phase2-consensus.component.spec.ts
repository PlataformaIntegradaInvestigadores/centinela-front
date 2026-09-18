import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Phase2ConsensusComponent } from './phase2-consensus.component';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketPhase2Service } from 'src/app/consensus/domain/services/websocket-phase2.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { WebSocketService } from 'src/app/consensus/domain/services/WebSocketService.service';
import { RecommendedTopic } from 'src/app/consensus/domain/entities/topic.interface';

describe('Phase2ConsensusComponent', () => {
  let component: Phase2ConsensusComponent;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let wsPhase2ServiceSpy: jasmine.SpyObj<WebSocketPhase2Service>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let webSocketServiceSpy: jasmine.SpyObj<WebSocketService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let paramMapSubject: Subject<any>;

  const makeTopic = (over: Partial<RecommendedTopic> = {}): RecommendedTopic =>
    ({ id: 1, topic_name: 'AI', tags: [], ...over }) as RecommendedTopic;

  beforeEach(() => {
    localStorage.clear();
    topicServiceSpy = jasmine.createSpyObj('TopicService', [
      'getUserCurrentPhase',
      'getRecommendedTopicsByGroup',
      'getFinalsTopicsByGroup',
      'notifyTopicTagChange',
      'notifyTopicReorder',
      'saveFinalTopicOrder',
    ]);
    wsPhase2ServiceSpy = jasmine.createSpyObj(
      'WebSocketPhase2Service',
      ['connect', 'close', 'sendMessage'],
      { topicReceived: new Subject<any>(), notificationReceived: new Subject<any>() },
    );
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    webSocketServiceSpy = jasmine.createSpyObj('WebSocketService', ['close']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl'], { url: '/consensus/g1/valuation' });
    paramMapSubject = new Subject();

    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 2 }));
    topicServiceSpy.getRecommendedTopicsByGroup.and.returnValue(of([]));
    topicServiceSpy.getFinalsTopicsByGroup.and.returnValue(of({ data: [] }));
    wsPhase2ServiceSpy.connect.and.returnValue(new Subject() as any);
    authServiceSpy.getUserId.and.returnValue('u1');

    TestBed.configureTestingModule({
      imports: [Phase2ConsensusComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TopicService, useValue: topicServiceSpy },
        { provide: WebSocketPhase2Service, useValue: wsPhase2ServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: WebSocketService, useValue: webSocketServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: paramMapSubject.asObservable() } },
        },
      ],
    });
    component = TestBed.createComponent(Phase2ConsensusComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('resolves groupId and loads topics/websocket/phase', () => {
      component.ngOnInit();
      paramMapSubject.next(convertToParamMap({ groupId: 'g1' }));
      expect(component.groupId).toBe('g1');
      expect(topicServiceSpy.getFinalsTopicsByGroup).toHaveBeenCalledWith('g1');
      expect(topicServiceSpy.getRecommendedTopicsByGroup).toHaveBeenCalledWith('g1');
      expect(topicServiceSpy.getUserCurrentPhase).toHaveBeenCalledWith('g1');
      expect(component.userPhase).toBe(2);
    });

    it('does not load recommended topics when final topics already exist', () => {
      topicServiceSpy.getFinalsTopicsByGroup.and.returnValue(of({ data: [makeTopic()] }));
      component.ngOnInit();
      paramMapSubject.next(convertToParamMap({ groupId: 'g1' }));
      expect(component.hasFinalOrderedTopics).toBeTrue();
      expect(topicServiceSpy.getRecommendedTopicsByGroup).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('disconnects the websocket', () => {
      component.ngOnInit();
      paramMapSubject.next(convertToParamMap({ groupId: 'g1' }));
      component.ngOnDestroy();
      expect(wsPhase2ServiceSpy.close).toHaveBeenCalledWith('g1');
    });
  });

  describe('checkUserPhase', () => {
    it('logs on failure', () => {
      spyOn(console, 'error');
      topicServiceSpy.getUserCurrentPhase.and.returnValue(throwError(() => new Error('boom')));
      component.checkUserPhase();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadRecommendedTopics', () => {
    it('does nothing without a groupId', () => {
      component.groupId = '';
      component.loadRecommendedTopics();
      expect(topicServiceSpy.getRecommendedTopicsByGroup).not.toHaveBeenCalled();
    });

    it('restores tags from localStorage per topic', () => {
      component.groupId = 'g1';
      localStorage.setItem('topic_1_tags', JSON.stringify(['Novel']));
      topicServiceSpy.getRecommendedTopicsByGroup.and.returnValue(of([makeTopic({ id: 1 })]));
      component.loadRecommendedTopics();
      expect(component.recommendedTopics[0].tags).toEqual(['Novel']);
    });

    it('defaults to an empty tags array without a saved entry', () => {
      component.groupId = 'g1';
      topicServiceSpy.getRecommendedTopicsByGroup.and.returnValue(of([makeTopic({ id: 2 })]));
      component.loadRecommendedTopics();
      expect(component.recommendedTopics[0].tags).toEqual([]);
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      component.groupId = 'g1';
      topicServiceSpy.getRecommendedTopicsByGroup.and.returnValue(throwError(() => new Error('boom')));
      component.loadRecommendedTopics();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadFinalOrderedTopics', () => {
    it('does nothing without a groupId', () => {
      component.groupId = '';
      component.loadFinalOrderedTopics();
      expect(topicServiceSpy.getFinalsTopicsByGroup).not.toHaveBeenCalled();
    });

    it('leaves hasFinalOrderedTopics false for an empty response', () => {
      component.groupId = 'g1';
      topicServiceSpy.getFinalsTopicsByGroup.and.returnValue(of({ data: [] }));
      component.loadFinalOrderedTopics();
      expect(component.hasFinalOrderedTopics).toBeFalse();
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      component.groupId = 'g1';
      topicServiceSpy.getFinalsTopicsByGroup.and.returnValue(throwError(() => new Error('boom')));
      component.loadFinalOrderedTopics();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('drop', () => {
    it('reorders topics and sends a notification when the index changed', () => {
      component.groupId = 'g1';
      component.recommendedTopics = [makeTopic({ id: 1 }), makeTopic({ id: 2 })];
      topicServiceSpy.notifyTopicReorder.and.returnValue(of({}));
      component.drop({ previousIndex: 0, currentIndex: 1 } as any);
      expect(component.recommendedTopics.map((t) => t.id)).toEqual([2, 1]);
      expect(topicServiceSpy.notifyTopicReorder).toHaveBeenCalled();
    });

    it('does not notify when the index is unchanged', () => {
      component.recommendedTopics = [makeTopic({ id: 1 })];
      component.drop({ previousIndex: 0, currentIndex: 0 } as any);
      expect(topicServiceSpy.notifyTopicReorder).not.toHaveBeenCalled();
    });
  });

  describe('toggleTag', () => {
    it('adds a tag and removes conflicting negative tags', () => {
      const topic = makeTopic({ tags: ['Obsolete'] });
      component.recommendedTopics = [topic];
      component.toggleTag(topic, 'Novel');
      expect(topic.tags).toContain('Novel');
      expect(topic.tags).not.toContain('Obsolete');
    });

    it('adds a negative tag and removes conflicting positive tags', () => {
      const topic = makeTopic({ tags: ['Trend'] });
      component.recommendedTopics = [topic];
      component.toggleTag(topic, 'Obsolete');
      expect(topic.tags).toContain('Obsolete');
      expect(topic.tags).not.toContain('Trend');
    });

    it('removes the tag if already present (toggle off)', () => {
      const topic = makeTopic({ tags: ['Attractive'] });
      component.recommendedTopics = [topic];
      component.toggleTag(topic, 'Attractive');
      expect(topic.tags).not.toContain('Attractive');
    });

    it('moves the topic to the front when tagged Novel', () => {
      const t1 = makeTopic({ id: 1 });
      const t2 = makeTopic({ id: 2 });
      component.recommendedTopics = [t1, t2];
      component.toggleTag(t2, 'Novel');
      expect(component.recommendedTopics[0].id).toBe(2);
    });

    it('moves the topic to the back when tagged Obsolete', () => {
      const t1 = makeTopic({ id: 1 });
      const t2 = makeTopic({ id: 2 });
      component.recommendedTopics = [t1, t2];
      component.toggleTag(t1, 'Obsolete');
      expect(component.recommendedTopics[component.recommendedTopics.length - 1].id).toBe(1);
    });

    it('notifies the backend when groupId and userId are present', () => {
      component.groupId = 'g1';
      topicServiceSpy.notifyTopicTagChange.and.returnValue(of({}));
      const topic = makeTopic();
      component.recommendedTopics = [topic];
      component.toggleTag(topic, 'Trend');
      expect(topicServiceSpy.notifyTopicTagChange).toHaveBeenCalled();
    });

    it('does not notify without a groupId', () => {
      component.groupId = '';
      const topic = makeTopic();
      component.recommendedTopics = [topic];
      component.toggleTag(topic, 'Trend');
      expect(topicServiceSpy.notifyTopicTagChange).not.toHaveBeenCalled();
    });
  });

  describe('modal controls', () => {
    it('completeConsensusPhaseTwo opens the modal', () => {
      component.completeConsensusPhaseTwo();
      expect(component.showModalPhaseTwo).toBeTrue();
    });

    it('closeModalPhaseTwo closes it', () => {
      component.showModalPhaseTwo = true;
      component.closeModalPhaseTwo();
      expect(component.showModalPhaseTwo).toBeFalse();
    });

    it('cancelPhaseTwoCompletion closes it', () => {
      component.showModalPhaseTwo = true;
      component.cancelPhaseTwoCompletion();
      expect(component.showModalPhaseTwo).toBeFalse();
    });
  });

  describe('confirmPhaseTwoCompletion', () => {
    it('does nothing without groupId/userId', () => {
      component.groupId = '';
      component.confirmPhaseTwoCompletion();
      expect(topicServiceSpy.saveFinalTopicOrder).not.toHaveBeenCalled();
    });

    it('saves the order, clears storage, navigates, and closes the modal on success', () => {
      component.groupId = 'g1';
      component.finalOrderedTopics = [{ id: 1, topic_name: 'AI', tags: ['Novel'] }];
      topicServiceSpy.saveFinalTopicOrder.and.returnValue(of({}));
      localStorage.setItem('topic_1_tags', '["Novel"]');
      component.showModalPhaseTwo = true;

      component.confirmPhaseTwoCompletion();

      expect(localStorage.getItem(`phase_g1`)).toBe('2');
      expect(localStorage.getItem('topic_1_tags')).toBeNull();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/consensus/g1/decision');
      expect(component.showModalPhaseTwo).toBeFalse();
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      component.groupId = 'g1';
      component.finalOrderedTopics = [{ id: 1, topic_name: 'AI', tags: [] }];
      topicServiceSpy.saveFinalTopicOrder.and.returnValue(throwError(() => new Error('boom')));
      component.confirmPhaseTwoCompletion();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('connectWebSocket / disconnectWebSocket', () => {
    it('does nothing without a groupId', () => {
      component.groupId = '';
      component.connectWebSocket();
      expect(wsPhase2ServiceSpy.connect).not.toHaveBeenCalled();
    });

    it('closes the legacy socket, connects, and wires message/topic/notification streams', () => {
      component.groupId = 'g1';
      const socket$ = new Subject<any>();
      wsPhase2ServiceSpy.connect.and.returnValue(socket$ as any);

      component.connectWebSocket();

      expect(webSocketServiceSpy.close).toHaveBeenCalledWith('g1');
      socket$.next({ message: { type: 'connection_count', active_connections: 4 } });
      expect(component.activeConnections).toBe(4);
    });

    it('logs a websocket error', () => {
      spyOn(console, 'error');
      component.groupId = 'g1';
      const socket$ = new Subject<any>();
      wsPhase2ServiceSpy.connect.and.returnValue(socket$ as any);
      component.connectWebSocket();
      socket$.error(new Error('ws failure'));
      expect(console.error).toHaveBeenCalled();
    });

    it('updates final ordered topics when a topic is received', () => {
      component.groupId = 'g1';
      component.connectWebSocket();
      spyOn(component, 'updateFinalOrderedTopics');
      (wsPhase2ServiceSpy.topicReceived as Subject<any>).next({});
      expect(component.updateFinalOrderedTopics).toHaveBeenCalled();
    });

    it('disconnectWebSocket closes and unsubscribes', () => {
      component.groupId = 'g1';
      component.connectWebSocket();
      component.disconnectWebSocket();
      expect(wsPhase2ServiceSpy.close).toHaveBeenCalledWith('g1');
    });

    it('disconnectWebSocket does nothing without a groupId', () => {
      component.groupId = '';
      component.disconnectWebSocket();
      expect(wsPhase2ServiceSpy.close).not.toHaveBeenCalled();
    });
  });
});
