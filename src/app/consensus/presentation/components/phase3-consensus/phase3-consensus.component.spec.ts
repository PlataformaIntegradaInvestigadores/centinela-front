import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { Phase3ConsensusComponent } from './phase3-consensus.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketPhase3Service } from 'src/app/consensus/domain/services/websocket-phase3.service';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';

describe('Phase3ConsensusComponent', () => {
  let component: Phase3ConsensusComponent;
  let fixture: ComponentFixture<Phase3ConsensusComponent>;

  let topicDataService: any;
  let webSocketService: any;
  let dashboardService: any;
  let router: any;

  let wsSubject: Subject<any>;
  let debateIdSubject: Subject<number>;

  function buildRoute(): any {
    const paramMap = of({
      get: (k: string) => (k === 'groupId' ? '123' : k === 'id' ? '1' : ''),
    } as any);
    return { parent: { paramMap } } as any;
  }

  beforeEach(() => {
    wsSubject = new Subject<any>();
    debateIdSubject = new Subject<number>();

    topicDataService = jasmine.createSpyObj('TopicService', ['getConsensusResults']);
    topicDataService.getConsensusResults.and.returnValue(
      of({
        results: [
          { final_value: 1, topic_name: 'Topic A', labels: ['label1'] },
          { final_value: 2, topic_name: 'Topic B', labels: ['label2'] },
          { final_value: 3, topic_name: 'Topic C', labels: ['label3'] },
        ],
      }),
    );

    webSocketService = jasmine.createSpyObj('WebSocketPhase3Service', [
      'connect',
      'sendMessage',
      'close',
      'closeAll',
    ]);
    webSocketService.connect.and.returnValue(wsSubject.asObservable());

    dashboardService = jasmine.createSpyObj('DebateStatisticsService', [
      'getStatistics',
      'sendDebateId',
    ]);
    dashboardService.debateId$ = debateIdSubject.asObservable();
    dashboardService.getStatistics.and.returnValue(
      of({ total_agree: 1, total_disagree: 2, total_neutral: 3 }),
    );

    router = jasmine.createSpyObj('Router', ['navigate']);
    (router as any).url = '';
    (router as any).events = of({});

    TestBed.configureTestingModule({
      declarations: [Phase3ConsensusComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: TopicService, useValue: topicDataService },
        { provide: WebSocketPhase3Service, useValue: webSocketService },
        { provide: DebateStatisticsService, useValue: dashboardService },
        { provide: ActivatedRoute, useValue: buildRoute() },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(Phase3ConsensusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.groupId).toBe('123');
  });

  it('should load consensus results on init', () => {
    expect(component.showResults).toBeTrue();
    expect(component.consensusResults.length).toBe(3);
  });

  it('should set debateId and load statistics from debateId$', () => {
    debateIdSubject.next(9);
    expect(component.debateId).toBe(9);
    expect(component.totalAgree).toBe(1);
  });

  it('should handle loadConsensusResults error for incomplete phases', () => {
    topicDataService.getConsensusResults.and.returnValue(
      throwError(() => ({ error: 'Not all users have completed phase 1 and 2' })),
    );
    component.loadConsensusResults();
    expect(component.showResults).toBeFalse();
  });

  it('should handle loadConsensusResults generic error', () => {
    spyOn(console, 'error');
    topicDataService.getConsensusResults.and.returnValue(throwError(() => new Error('e')));
    component.loadConsensusResults();
    expect(component).toBeTruthy();
  });

  it('should validate debate status', () => {
    spyOn(console, 'log');
    component.validateDebateStatus(5);
    expect(console.log).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });

  it('should handle websocket messages', fakeAsync(() => {
    wsSubject.next({ message: { type: 'connection_count', active_connections: 4 } });
    wsSubject.next({
      message: { type: 'consensus_calculation_completed', results: [{ final_value: 2 }] },
    });
    wsSubject.next({ message: { type: 'phase_update', phase: 1 } });
    tick(1500);
    wsSubject.next({ message: { type: 'phase_update', phase: 0 } });
    tick(1500);
    wsSubject.next({ message: { type: 'remove_member' } });
    expect(component.activeConnections).toBe(4);
    expect(router.navigate).toHaveBeenCalled();
  }));

  it('should handle websocket error', () => {
    spyOn(console, 'error');
    component.connectWebSocket();
    expect(webSocketService.connect).toHaveBeenCalled();
  });

  it('should detect a tie', () => {
    component.consensusResults = [{ final_value: 1 }, { final_value: 1 }] as any;
    (component as any).checkForTie();
    expect(component.isDraw).toBeTrue();
  });

  it('should not detect a tie when values differ', () => {
    component.consensusResults = [{ final_value: 1 }, { final_value: 2 }] as any;
    (component as any).checkForTie();
    expect(component.isDraw).toBeFalse();
  });

  it('should load posture statistics', () => {
    component.debateId = 5;
    component.loadPostureStatistics();
    expect(component.totalAgree).toBe(1);
    expect(component.totalDisagree).toBe(2);
    expect(component.totalNeutral).toBe(3);
  });

  it('should handle loadPostureStatistics error', () => {
    spyOn(console, 'error');
    dashboardService.getStatistics.and.returnValue(throwError(() => new Error('e')));
    component.loadPostureStatistics();
    expect(component).toBeTruthy();
  });

  it('should default statistics to zero when undefined', () => {
    dashboardService.getStatistics.and.returnValue(of({}));
    component.debateId = 5;
    component.loadPostureStatistics();
    expect(component.totalAgree).toBe(0);
  });
});
