import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { NavbarConsensusComponent } from './navbar-consensus.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { PhaseStateService } from 'src/app/consensus/domain/services/phaseState.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

describe('NavbarConsensusComponent', () => {
  let component: NavbarConsensusComponent;
  let phaseStateSpy: jasmine.SpyObj<PhaseStateService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let routerEvents$: Subject<any>;
  let phase$: BehaviorSubject<number>;
  let routeParamMap: Map<string, string>;
  let routerUrl: string;

  beforeEach(() => {
    phaseStateSpy = jasmine.createSpyObj('PhaseStateService', ['setPhase', 'getPhase']);
    phase$ = new BehaviorSubject<number>(0);
    (phaseStateSpy as any).phase$ = phase$.asObservable();
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['changeUserPhase']);
    routerEvents$ = new Subject<any>();
    routeParamMap = new Map([['groupId', 'g-1'], ['id', 'u-1']]);
    routerUrl = '/profile/u-1/my-groups/g-1/consensus/decision';

    TestBed.configureTestingModule({
      declarations: [NavbarConsensusComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PhaseStateService, useValue: phaseStateSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TopicService, useValue: topicServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(Object.fromEntries(routeParamMap)) } },
        },
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
            get url() {
              return routerUrl;
            },
          },
        },
      ],
    });
    component = TestBed.createComponent(NavbarConsensusComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('persists phase 1 when isPhaseTwo is set', () => {
      component.isPhaseTwo = true;
      component.groupId = 'g-1';
      component.ngOnInit();
      expect(phaseStateSpy.setPhase).toHaveBeenCalledWith(1, 'g-1');
    });

    it('persists phase 2 when isDecisionPhase is set', () => {
      component.isDecisionPhase = true;
      component.groupId = 'g-1';
      component.ngOnInit();
      expect(phaseStateSpy.setPhase).toHaveBeenCalledWith(2, 'g-1');
    });

    it('reacts to phase$ emissions by updating currentPhase', () => {
      component.ngOnInit();
      phase$.next(2);
      expect(component.currentPhase).toBe(2);
    });

    it('re-syncs currentPhase from route params on a router event', () => {
      phaseStateSpy.getPhase.and.returnValue(1);
      component.ngOnInit();
      routerEvents$.next({});
      expect(component.groupId).toBe('g-1');
      expect(component.userId).toBe('u-1');
      expect(component.currentPhase).toBe(1);
      expect(phaseStateSpy.setPhase).toHaveBeenCalledWith(1, 'g-1');
    });

    it('shows the repeat button only for the group owner', () => {
      authServiceSpy.getUserId.and.returnValue('owner-1');
      component.idOwnerGroup = 'owner-1';
      component.ngOnInit();
      expect(component.showRepeatButton).toBeTrue();
    });

    it('hides the repeat button for a non-owner', () => {
      authServiceSpy.getUserId.and.returnValue('someone-else');
      component.idOwnerGroup = 'owner-1';
      component.ngOnInit();
      expect(component.showRepeatButton).toBeFalse();
    });
  });

  it('ngOnDestroy unsubscribes both subscriptions without throwing', () => {
    component.ngOnInit();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('openModal/closeModal toggle showModal', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });

  it('cancelRepeatVote closes the modal', () => {
    component.openModal();
    component.cancelRepeatVote();
    expect(component.showModal).toBeFalse();
  });

  describe('confirmRepeatVote', () => {
    it('closes the modal and resets the phase to 1', () => {
      component.groupId = 'g-1';
      topicServiceSpy.changeUserPhase.and.returnValue(of({}));
      component.confirmRepeatVote();
      expect(component.showModal).toBeFalse();
      expect(topicServiceSpy.changeUserPhase).toHaveBeenCalledWith('g-1', 1);
    });

    it('logs an error when the phase reset fails', () => {
      spyOn(console, 'error');
      component.groupId = 'g-1';
      topicServiceSpy.changeUserPhase.and.returnValue(throwError(() => new Error('boom')));
      component.confirmRepeatVote();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateComponentVisibility', () => {
    it('detects the decision-phase URL', () => {
      component.userId = 'u-1';
      component.groupId = 'g-1';
      routerUrl = '/profile/u-1/my-groups/g-1/consensus/decision';
      component.updateComponentVisibility();
      expect(component.isDecisionPhase).toBeTrue();
    });

    it('is false for any other URL', () => {
      component.userId = 'u-1';
      component.groupId = 'g-1';
      routerUrl = '/profile/u-1/my-groups/g-1/consensus/valuation';
      component.updateComponentVisibility();
      expect(component.isDecisionPhase).toBeFalse();
    });
  });
});
