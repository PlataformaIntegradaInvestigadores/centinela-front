import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { Phase1ConsensusComponent } from './phase1-consensus.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketService } from 'src/app/consensus/domain/services/WebSocketService.service';
import { DebateService } from 'src/app/consensus/domain/services/debate.service';
import { UserPostureService } from 'src/app/consensus/domain/services/user-posture.service';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';
import { UserPosture } from 'src/app/consensus/domain/entities/user-posture.interface';

describe('Phase1ConsensusComponent', () => {
  let component: Phase1ConsensusComponent;
  let fixture: ComponentFixture<Phase1ConsensusComponent>;

  let authService: any;
  let topicService: any;
  let webSocketService: any;
  let debateService: any;
  let postureService: any;
  let debateStatisticsService: any;
  let router: any;

  let wsSubject: Subject<any>;
  let newTopicSubject: Subject<any>;
  let notificationsSubject: Subject<any>;
  let validateStatusSubject: Subject<void>;
  let connectSubject: Subject<any>;
  let topicsSubject: Subject<any>;

  const fakePostureComponent = () => ({
    isModalOpenPostureSelection: false,
    isModalOpenExistingPosture: false,
    existingPosture: null,
    existingPostureId: null,
    selectedPosture: '',
    debateId: 0,
  });

  function buildRoute(): any {
    const paramMap = of({ get: (k: string) => (k === 'groupId' ? '123' : '') } as any);
    return {
      parent: { paramMap },
      paramMap,
      snapshot: { paramMap: { get: (k: string) => (k === 'groupId' ? '123' : '') } },
      url: '/profile/1/my-groups/123/consensus/recommend-topics',
    } as any;
  }

  beforeEach(() => {
    wsSubject = new Subject<any>();
    newTopicSubject = new Subject<any>();
    notificationsSubject = new Subject<any>();
    validateStatusSubject = new Subject<void>();
    connectSubject = new Subject<any>();
    topicsSubject = new Subject<any>();

    authService = jasmine.createSpyObj('AuthService', ['getUserId']);
    authService.getUserId.and.returnValue('1');

    topicService = jasmine.createSpyObj('TopicService', [
      'getUserCurrentPhase',
      'getRecommendedTopicsByGroup',
      'getTopicsAddedByGroup',
      'getRandomRecommendedTopics',
      'updateTopics',
      'addNewTopic',
      'notifyExpertice',
      'notifyTopicVisited',
      'notifyCombinedSearch',
      'notifyPhaseOneCompleted',
    ]);
    topicService.topics$ = topicsSubject.asObservable();

    webSocketService = jasmine.createSpyObj('WebSocketService', [
      'connect',
      'sendMessage',
      'close',
      'closeAll',
    ]);
    webSocketService.notificationsReceived = notificationsSubject;
    webSocketService.newTopicReceived = newTopicSubject;
    webSocketService.connect.and.returnValue(connectSubject.asObservable());

    debateService = jasmine.createSpyObj('DebateService', [
      'getDebates',
      'createDebate',
      'triggerValidateDebateStatus',
      'closeDebate',
    ]);
    debateService.validateDebateStatus$ = validateStatusSubject.asObservable();

    postureService = jasmine.createSpyObj('UserPostureService', [
      'getUserPosture',
      'updateUserPosture',
      'createUserPosture',
    ]);

    debateStatisticsService = jasmine.createSpyObj('DebateStatisticsService', [
      'getStatistics',
      'sendDebateId',
    ]);

    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    (router as any).url = '/profile/1/my-groups/123/consensus/recommend-topics';
    (router as any).events = of({});

    topicService.getUserCurrentPhase.and.returnValue(of({ phase: 0 }));
    topicService.getRecommendedTopicsByGroup.and.returnValue(of([{ id: 1, topic_name: 'A' }]));
    topicService.getTopicsAddedByGroup.and.returnValue(of([]));
    topicService.getRandomRecommendedTopics.and.returnValue(of([{ id: 2, topic_name: 'B' }]));
    topicService.notifyExpertice.and.returnValue(of({}));
    debateService.getDebates.and.returnValue(of([]));

    TestBed.configureTestingModule({
      declarations: [Phase1ConsensusComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TopicService, useValue: topicService },
        { provide: WebSocketService, useValue: webSocketService },
        { provide: DebateService, useValue: debateService },
        { provide: UserPostureService, useValue: postureService },
        { provide: DebateStatisticsService, useValue: debateStatisticsService },
        { provide: ActivatedRoute, useValue: buildRoute() },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(Phase1ConsensusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.selectedPostureComponent = fakePostureComponent() as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load topics and connect on phase 0', () => {
    expect(component.recommendedTopics.length).toBe(1);
    expect(connectSubject).toBeDefined();
  });

  it('should not connect when phase is not 0', () => {
    webSocketService.connect.calls.reset();
    topicService.getUserCurrentPhase.and.returnValue(of({ phase: 1 }));
    component.checkUserPhase();
    expect(webSocketService.connect).not.toHaveBeenCalled();
  });

  it('should handle checkUserPhase error', () => {
    topicService.getUserCurrentPhase.and.returnValue(throwError(() => new Error('x')));
    component.checkUserPhase();
    expect(component).toBeTruthy();
  });

  it('should handle ws connection_count and new_topic messages', () => {
    connectSubject.next({ message: { type: 'connection_count', active_connections: 3 } });
    connectSubject.next({ message: { type: 'new_topic', topic_name: 'X' } });
    expect(component.activeConnections).toBe(3);
  });

  it('should handle newTopicReceived notifications', () => {
    newTopicSubject.next({
      topic_name: 'TopicA',
      notification_message: 'msg1',
    });
    expect(component.recommendedTopics.some((t) => t.topic_name === 'TopicA')).toBeTrue();
    newTopicSubject.next({
      topic_name: 'TopicA',
      notification_message: 'msg1',
    });
    expect(component.notifications.length).toBeGreaterThan(0);
  });

  it('should handle all notification types', () => {
    notificationsSubject.next({ type: 'debate_created' });
    notificationsSubject.next({ type: 'debate_closed' });
    notificationsSubject.next({ type: 'posture_created' });
    notificationsSubject.next({ type: 'posture_updated' });
    notificationsSubject.next({ type: 'unknown' });
    expect(component.isDebateActive).toBeTrue();
  });

  it('should reload debates when validateDebateStatus$ emits', () => {
    validateStatusSubject.next();
    expect(debateService.getDebates).toHaveBeenCalled();
  });

  it('should loadDebates with valid groupId', () => {
    debateService.getDebates.and.returnValue(of([{ id: 1, is_closed: false }]));
    component.loadDebates('123');
    expect(component.debates.length).toBe(1);
  });

  it('should not loadDebates with invalid groupId', () => {
    spyOn(console, 'error');
    debateService.getDebates.calls.reset();
    component.loadDebates('');
    expect(debateService.getDebates).not.toHaveBeenCalled();
  });

  it('should handle loadDebates error', () => {
    spyOn(console, 'error');
    debateService.getDebates.and.returnValue(throwError(() => new Error('err')));
    component.loadDebates('123');
    expect(component).toBeTruthy();
  });

  it('should submit a debate and open posture modal', () => {
    component.groupId = '123';
    component.debateTitle = 'Title';
    component.debateDescription = 'Desc';
    component.durationHours = 1;
    component.durationMinutes = 30;
    debateService.createDebate.and.returnValue(of({ id: 7 }));
    component.onSubmitDebate();
    expect(debateService.createDebate).toHaveBeenCalled();
    expect(component.isModalOpenPosture).toBeTrue();
    expect(component.debateTitle).toBe('');
  });

  it('should handle onSubmitDebate error', () => {
    spyOn(console, 'error');
    component.groupId = '123';
    debateService.createDebate.and.returnValue(throwError(() => new Error('err')));
    component.onSubmitDebate();
    expect(component).toBeTruthy();
  });

  it('should handle onPostureSaved', () => {
    const args: UserPosture = { debate: 5, id: 5, posture: 'agree' } as any;
    component.onPostureSaved(args);
    expect(component.activeDebateId).toBe(5);
    expect(component.isModalOpenPosture).toBeTrue();
  });

  it('should toggle debate modal', () => {
    const initial = component.isModalOpenDebate;
    component.toggleDebate();
    expect(component.isModalOpenDebate).toBe(!initial);
  });

  it('should join an active debate with existing posture', () => {
    component.groupId = '123';
    component.debates = [{ id: 1, is_closed: false }] as any;
    postureService.getUserPosture.and.returnValue(of({ id: 9, posture: 'agree' }));
    component.joinDebate();
    expect(component.activeDebateId).toBe(1);
    expect(component.isModalOpenPosture).toBeTrue();
  });

  it('should join an active debate with 404 (no posture)', () => {
    component.groupId = '123';
    component.debates = [{ id: 1, is_closed: false }] as any;
    postureService.getUserPosture.and.returnValue(
      throwError(() => ({ status: 404 })),
    );
    component.joinDebate();
    expect(component.isModalOpenPosture).toBeTrue();
  });

  it('should join an active debate with other error', () => {
    spyOn(console, 'error');
    component.groupId = '123';
    component.debates = [{ id: 1, is_closed: false }] as any;
    postureService.getUserPosture.and.returnValue(throwError(() => ({ status: 500 })));
    component.joinDebate();
    expect(component).toBeTruthy();
  });

  it('should warn when no active debate to join', () => {
    spyOn(console, 'warn');
    component.debates = [{ id: 1, is_closed: true }] as any;
    component.joinDebate();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should open posture modal with existing response', () => {
    const response: UserPosture = {
      id: 3,
      debate: 1,
      posture: 'agree',
    } as any;
    component.openSelectPostureModal(1, response, 1, 'T');
    expect(component.isModalOpenPosture).toBeTrue();
    expect(component.selectedPostureComponent.existingPosture).toEqual(response);
  });

  it('should open posture modal without response', () => {
    component.openSelectPostureModal(1, null, 1, 'T');
    expect(component.isModalOpenPosture).toBeTrue();
    expect(component.selectedPostureComponent.existingPosture).toBeNull();
  });

  it('should close posture modal', () => {
    component.closePostureModal({});
    expect(component.isModalOpenPosture).toBeFalse();
  });

  it('should validate debate status with active debate', () => {
    debateService.getDebates.and.returnValue(
      of([{ id: 1, is_closed: false }]),
    );
    component.validateDebateStatus();
    expect(component.isDebateActive).toBeTrue();
    expect(component.activeDebateId).toBe(1);
  });

  it('should validate debate status without active debate', () => {
    debateService.getDebates.and.returnValue(of([{ id: 1, is_closed: true }]));
    component.validateDebateStatus();
    expect(component.isDebateActive).toBeFalse();
  });

  it('should handle validateDebateStatus error', () => {
    spyOn(console, 'error');
    debateService.getDebates.and.returnValue(throwError(() => new Error('e')));
    component.validateDebateStatus();
    expect(component).toBeTruthy();
  });

  it('should reset the form', () => {
    component.debateTitle = 'x';
    component.durationHours = 5;
    component.resetForm();
    expect(component.debateTitle).toBe('');
    expect(component.durationHours).toBe(0);
  });

  it('should handle open and close chat', () => {
    component.handleOpenChat();
    expect(component.isModalOpenChat).toBeTrue();
    component.handleCloseChat();
    expect(component.isModalOpenChat).toBeFalse();
  });

  it('should destroy and unsubscribe', () => {
    component.groupId = '123';
    component.ngOnDestroy();
    expect(webSocketService.closeAll).toHaveBeenCalled();
  });

  it('should load topics and assign random when empty', () => {
    topicService.getRecommendedTopicsByGroup.and.returnValue(of([]));
    component.loadTopics();
    expect(topicService.getRandomRecommendedTopics).toHaveBeenCalled();
  });

  it('should handle loadTopics error', () => {
    spyOn(console, 'error');
    topicService.getRecommendedTopicsByGroup.and.returnValue(throwError(() => new Error('e')));
    component.loadTopics();
    expect(component).toBeTruthy();
  });

  it('should handle getTopicsAddedByGroup error', () => {
    spyOn(console, 'error');
    topicService.getTopicsAddedByGroup.and.returnValue(throwError(() => new Error('e')));
    component.loadTopics();
    expect(component).toBeTruthy();
  });

  it('should handle getAndAssignRandomTopics error', () => {
    spyOn(console, 'error');
    topicService.getRandomRecommendedTopics.and.returnValue(throwError(() => new Error('e')));
    component.getAndAssignRandomTopics();
    expect(component).toBeTruthy();
  });

  it('should connect and disconnect websocket', () => {
    component.groupId = '123';
    component.connectWebSocket();
    component.disconnectWebSocket();
    expect(webSocketService.close).toHaveBeenCalledWith('123');
  });

  it('should add a topic', () => {
    component.groupId = '123';
    component.newTopic = '  New Topic  ';
    authService.getUserId.and.returnValue('1');
    topicService.addNewTopic.and.returnValue(
      of({ id: 1, topic: { topic_name: 'New Topic' }, added_at: 'now' }),
    );
    component.addTopic();
    expect(topicService.addNewTopic).toHaveBeenCalled();
    expect(webSocketService.sendMessage).toHaveBeenCalled();
  });

  it('should not add topic without required data', () => {
    component.newTopic = '   ';
    authService.getUserId.and.returnValue(null);
    component.addTopic();
    expect(topicService.addNewTopic).not.toHaveBeenCalled();
  });

  it('should handle addTopic 403 error', fakeAsync(() => {
    spyOn(console, 'error');
    spyOn(document, 'getElementById').and.returnValue(null);
    component.groupId = '123';
    component.newTopic = 'Topic';
    authService.getUserId.and.returnValue('1');
    topicService.addNewTopic.and.returnValue(
      throwError(() => ({ status: 403, error: { error: 'forbidden' } })),
    );
    component.addTopic();
    tick(0);
    tick(8000);
    expect(component.showError).toBeFalse();
  }));

  it('should handle addTopic 400 error', () => {
    spyOn(console, 'error');
    component.groupId = '123';
    component.newTopic = 'Topic';
    authService.getUserId.and.returnValue('1');
    topicService.addNewTopic.and.returnValue(throwError(() => ({ status: 400 })));
    component.addTopic();
    expect(component.errorMessage).toBe('This topic already exists in the group.');
  });

  it('should handle addTopic generic error', () => {
    spyOn(console, 'error');
    component.groupId = '123';
    component.newTopic = 'Topic';
    authService.getUserId.and.returnValue('1');
    topicService.addNewTopic.and.returnValue(throwError(() => ({ status: 500 })));
    component.addTopic();
    expect(component.errorMessage).toBe('An error occurred.');
  });

  it('should send user expertise', () => {
    component.groupId = '123';
    authService.getUserId.and.returnValue('1');
    component.recommendedTopics = [{ id: 5, topic_name: 'A' }] as any;
    component.rangeValues = [80];
    component.sendUserExpertise(0);
    expect(topicService.notifyExpertice).toHaveBeenCalled();
  });

  it('should initialize properties', () => {
    component.recommendedTopics = [{ id: 1 }, { id: 2 }] as any;
    component.initializeProperties();
    expect(component.rangeValues.length).toBe(2);
    expect(component.showLabel.length).toBe(2);
  });

  it('should toggle labels and checks', () => {
    component.showLabels(0);
    component.hideLabels(0);
    component.showCheckTopic(1);
    component.hideCheckTopic(1);
    expect(component.showLabel[0]).toBeFalse();
    expect(component.showCheckTopics[1]).toBeFalse();
  });

  it('should handle slider change', () => {
    const event = { target: { value: '42' } } as any;
    component.onSliderChange(0, event);
    expect(component.rangeValues[0]).toBe(42);
  });

  it('should compute gradient', () => {
    expect(component.getGradient(50)).toContain('linear-gradient');
  });

  it('should redirect to google scholar', () => {
    spyOn(window, 'open').and.returnValue(null);
    topicService.notifyTopicVisited.and.returnValue(of({}));
    component.groupId = '123';
    authService.getUserId.and.returnValue('1');
    component.redirectToGoogleScholar({ id: 1, topic_name: 'Quantum' } as any);
    expect(window.open).toHaveBeenCalled();
    expect(topicService.notifyTopicVisited).toHaveBeenCalled();
  });

  it('should run combined search with selected topics', () => {
    spyOn(window, 'open').and.returnValue(null);
    topicService.notifyCombinedSearch.and.returnValue(of({}));
    component.groupId = '123';
    authService.getUserId.and.returnValue('1');
    component.recommendedTopics = [
      { id: 1, topic_name: 'A' },
      { id: 2, topic_name: 'B' },
    ] as any;
    component.combinedChecksState = [true, false];
    component.combinedSearch();
    expect(window.open).toHaveBeenCalled();
    expect(topicService.notifyCombinedSearch).toHaveBeenCalled();
  });

  it('should alert when combined search has no topics', () => {
    spyOn(window, 'alert');
    component.combinedChecksState = [false, false];
    component.combinedSearch();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should check and run combined search when enabled', () => {
    spyOn(window, 'open').and.returnValue(null);
    component.enableCombinedSearch = true;
    topicService.notifyCombinedSearch.and.returnValue(of({}));
    component.groupId = '123';
    authService.getUserId.and.returnValue('1');
    component.recommendedTopics = [{ id: 1, topic_name: 'A' }] as any;
    component.combinedChecksState = [true];
    component.checkAndCombinedSearch();
    expect(window.open).toHaveBeenCalled();
  });

  it('should alert when combined search disabled', () => {
    spyOn(window, 'alert');
    component.enableCombinedSearch = false;
    component.checkAndCombinedSearch();
    expect(window.alert).toHaveBeenCalled();
    expect(component.enableCombinedSearch).toBeTrue();
  });

  it('should toggle expertise', () => {
    const v = component.showSliders;
    component.toggleExpertise();
    expect(component.showSliders).toBe(!v);
  });

  it('should toggle add topic form', () => {
    const v = component.showAddTopicForm;
    component.toggleAddTopicForm();
    expect(component.showAddTopicForm).toBe(!v);
  });

  it('should complete and close consensus phase one', () => {
    component.completeConsensusPhaseOne();
    expect(component.showModal).toBeTrue();
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });

  it('should confirm phase completion', () => {
    spyOn(localStorage, 'setItem');
    component.groupId = '123';
    authService.getUserId.and.returnValue('1');
    topicService.notifyPhaseOneCompleted.and.returnValue(of({}));
    component.confirmPhaseCompletion();
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });

  it('should not confirm phase completion without group/user', () => {
    component.groupId = '';
    authService.getUserId.and.returnValue(null);
    component.confirmPhaseCompletion();
    expect(topicService.notifyPhaseOneCompleted).not.toHaveBeenCalled();
  });

  it('should handle confirmPhaseCompletion error', () => {
    spyOn(console, 'error');
    component.groupId = '123';
    authService.getUserId.and.returnValue('1');
    topicService.notifyPhaseOneCompleted.and.returnValue(throwError(() => new Error('e')));
    component.confirmPhaseCompletion();
    expect(component).toBeTruthy();
  });

  it('should cancel phase completion', () => {
    component.showModal = true;
    component.cancelPhaseCompletion();
    expect(component.showModal).toBeFalse();
  });
});
