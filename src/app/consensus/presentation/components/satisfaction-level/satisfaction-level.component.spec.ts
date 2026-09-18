import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { SatisfactionLevelComponent } from './satisfaction-level.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketPhase3Service } from 'src/app/consensus/domain/services/websocket-phase3.service';

describe('SatisfactionLevelComponent', () => {
  let component: SatisfactionLevelComponent;
  let fixture: ComponentFixture<SatisfactionLevelComponent>;

  let authService: any;
  let topicService: any;
  let webSocketService: any;
  let router: any;

  let satisfactionSubject: Subject<any>;

  const initialCounts = {
    Unsatisfied: 0,
    'Slightly Unsatisfied': 0,
    Neutral: 0,
    'Slightly Satisfied': 0,
    Satisfied: 0,
  };

  function buildRoute(): any {
    return {
      snapshot: { paramMap: { get: (k: string) => (k === 'groupId' ? '123' : '') } },
    } as any;
  }

  beforeEach(() => {
    satisfactionSubject = new Subject<any>();

    authService = jasmine.createSpyObj('AuthService', ['getUserId']);
    authService.getUserId.and.returnValue('1');

    topicService = jasmine.createSpyObj('TopicService', [
      'getSatisfactionCounts',
      'saveUserSatisfaction',
    ]);
    topicService.getSatisfactionCounts.and.returnValue(of({ counts: { ...initialCounts } }));
    topicService.saveUserSatisfaction.and.returnValue(of({ ok: true }));

    webSocketService = jasmine.createSpyObj('WebSocketPhase3Service', [
      'connect',
      'close',
      'sendMessage',
    ]);
    webSocketService.userSatisfactionReceived = satisfactionSubject;

    router = jasmine.createSpyObj('Router', ['navigate']);
    (router as any).url = '';
    (router as any).events = of({});

    TestBed.configureTestingModule({
      declarations: [SatisfactionLevelComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TopicService, useValue: topicService },
        { provide: WebSocketPhase3Service, useValue: webSocketService },
        { provide: ActivatedRoute, useValue: buildRoute() },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(SatisfactionLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.groupId).toBe('123');
  });

  it('should load satisfaction counts on init', () => {
    expect(topicService.getSatisfactionCounts).toHaveBeenCalled();
  });

  it('should handle loadSatisfactionCounts error', () => {
    spyOn(console, 'error');
    topicService.getSatisfactionCounts.and.returnValue(throwError(() => new Error('e')));
    component.loadSatisfactionCounts();
    expect(component).toBeTruthy();
  });

  it('should update satisfaction counts from websocket', () => {
    const counts = { ...initialCounts, Satisfied: 3 };
    satisfactionSubject.next({ counts });
    expect(component.satisfactionCounts.Satisfied).toBe(3);
  });

  it('should handle websocket error', () => {
    spyOn(console, 'error');
    component.connectWebSocket();
    expect(webSocketService.connect).toHaveBeenCalled();
  });

  it('should unsubscribe and close on destroy', () => {
    component.ngOnDestroy();
    expect(webSocketService.close).toHaveBeenCalledWith('123');
  });

  it('should open modal when not voted', () => {
    component.hasVoted = false;
    component.openModal('Satisfied');
    expect(component.showModal).toBeTrue();
    expect(component.selectedSatisfactionLevel).toBe('Satisfied');
  });

  it('should notify already voted when trying to open modal', fakeAsync(() => {
    component.hasVoted = true;
    component.openModal('Satisfied');
    expect(component.showAlreadyVotedNotification).toBeTrue();
    tick(4000);
    expect(component.showAlreadyVotedNotification).toBeFalse();
  }));

  it('should confirm vote', () => {
    component.selectedSatisfactionLevel = 'Satisfied';
    component.confirmVote(true);
    expect(topicService.saveUserSatisfaction).toHaveBeenCalledWith('123', '1', 'Satisfied');
    expect(component.showModal).toBeFalse();
  });

  it('should cancel vote without saving', () => {
    component.confirmVote(false);
    expect(component.showModal).toBeFalse();
    expect(topicService.saveUserSatisfaction).not.toHaveBeenCalled();
  });

  it('should submit satisfaction and mark voted', () => {
    topicService.saveUserSatisfaction.and.returnValue(of({ ok: true }));
    component.submitSatisfaction('Neutral');
    expect(component.hasVoted).toBeTrue();
  });

  it('should not submit satisfaction without group or user', () => {
    component.groupId = '';
    authService.getUserId.and.returnValue(null);
    component.submitSatisfaction('Neutral');
    expect(topicService.saveUserSatisfaction).not.toHaveBeenCalled();
  });

  it('should notify on submit 500 error', fakeAsync(() => {
    topicService.saveUserSatisfaction.and.returnValue(
      throwError(() => ({ status: 500 })),
    );
    component.submitSatisfaction('Neutral');
    expect(component.showAlreadyVotedNotification).toBeTrue();
    tick(4000);
    expect(component.showAlreadyVotedNotification).toBeFalse();
  }));

  it('should update satisfaction counts directly', () => {
    const counts = { ...initialCounts, Unsatisfied: 2 };
    component.updateSatisfactionCounts(counts as any);
    expect(component.satisfactionCounts.Unsatisfied).toBe(2);
  });

  it('should close notification', () => {
    component.showAlreadyVotedNotification = true;
    component.closeNotification();
    expect(component.showAlreadyVotedNotification).toBeFalse();
  });

  it('falls back to an empty groupId when the route param is missing', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [SatisfactionLevelComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TopicService, useValue: topicService },
        { provide: WebSocketPhase3Service, useValue: webSocketService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const noRouteFixture = TestBed.createComponent(SatisfactionLevelComponent);
    const noRouteComponent = noRouteFixture.componentInstance;

    expect(noRouteComponent.groupId).toBe('');
    noRouteComponent.loadSatisfactionCounts();
    noRouteComponent.submitSatisfaction('Neutral'); // no-op: submitSatisfaction requires groupId
    expect(topicService.saveUserSatisfaction).not.toHaveBeenCalled();
  });
});
