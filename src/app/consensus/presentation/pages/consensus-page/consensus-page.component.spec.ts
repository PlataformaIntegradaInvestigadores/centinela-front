import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ConsensusPageComponent } from './consensus-page.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConsensusService } from 'src/app/consensus/domain/services/GetGroupDataService.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

describe('ConsensusPageComponent', () => {
  let component: ConsensusPageComponent;
  let fixture: ComponentFixture<ConsensusPageComponent>;

  let consensusService: any;
  let topicService: any;
  let router: any;

  function buildRoute(): any {
    return {
      snapshot: {
        paramMap: {
          get: (k: string) => (k === 'groupId' ? '123' : k === 'id' ? '1' : ''),
        },
      },
    } as any;
  }

  beforeEach(() => {
    consensusService = jasmine.createSpyObj('ConsensusService', ['getGroupById']);
    consensusService.getGroupById.and.returnValue(
      of({ id: '123', name: 'G', users: [{ id: 'a' }, { id: 'b' }] }),
    );

    topicService = {};

    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    (router as any).url = '';
    (router as any).events = of({});

    TestBed.configureTestingModule({
      declarations: [ConsensusPageComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: ConsensusService, useValue: consensusService },
        { provide: TopicService, useValue: topicService },
        { provide: ActivatedRoute, useValue: buildRoute() },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(ConsensusPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.groupId).toBe('123');
    expect(component.userId).toBe('1');
  });

  it('should load group on init', () => {
    expect(consensusService.getGroupById).toHaveBeenCalledWith('123');
    expect(component.group).toBeDefined();
  });

  it('should handle loadGroup error', () => {
    spyOn(console, 'error');
    consensusService.getGroupById.and.returnValue(throwError(() => new Error('e')));
    component.loadGroup('123');
    expect(component.errorMessage).toBe('You do not have permission to access this group.');
  });

  it('should not load group without groupId', () => {
    TestBed.resetTestingModule();
    const emptyRoute: any = {
      snapshot: { paramMap: { get: () => '' } },
    };
    const localConsensus = jasmine.createSpyObj('ConsensusService', ['getGroupById']);
    TestBed.configureTestingModule({
      declarations: [ConsensusPageComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: ConsensusService, useValue: localConsensus },
        { provide: TopicService, useValue: topicService },
        { provide: ActivatedRoute, useValue: emptyRoute },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const comp = TestBed.createComponent(ConsensusPageComponent).componentInstance;
    comp.ngOnInit();
    expect(localConsensus.getGroupById).not.toHaveBeenCalled();
  });

  it('should navigate to phase 0', () => {
    router.url = '/something-else';
    component.navigateToPhase('123', 0);
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should navigate to phase 1', () => {
    router.url = '/something-else';
    component.navigateToPhase('123', 1);
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should navigate to phase 2', () => {
    router.url = '/something-else';
    component.navigateToPhase('123', 2);
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should navigate to default phase', () => {
    router.url = '/something-else';
    component.navigateToPhase('123', 99);
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should not navigate when already on the phase', () => {
    router.url = `/profile/1/my-groups/123/consensus/recommend-topics`;
    component.navigateToPhase('123', 0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should update component visibility for decision phase', () => {
    router.url = `/profile/1/my-groups/123/consensus/decision`;
    component.updateComponentVisibility();
    expect(component.isDecisionPhase).toBeTrue();
    expect(component.isPhaseTwo).toBeFalse();
  });

  it('should update component visibility for valuation phase', () => {
    router.url = `/profile/1/my-groups/123/consensus/valuation`;
    component.updateComponentVisibility();
    expect(component.isPhaseTwo).toBeTrue();
    expect(component.isDecisionPhase).toBeFalse();
  });

  it('should remove a member and show success', fakeAsync(() => {
    component.group = { id: '123', users: [{ id: 'a' }, { id: 'b' }] } as any;
    component.onMemberDeleted('a');
    expect(component.group?.users?.length).toBe(1);
    expect(component.successMessage).toBe('Member has been removed successfully.');
    tick(3000);
    expect(component.successMessage).toBeNull();
  }));

  it('should not remove member when group or users missing', () => {
    component.group = null;
    component.onMemberDeleted('a');
    expect(component.successMessage).toBeNull();
  });
});
