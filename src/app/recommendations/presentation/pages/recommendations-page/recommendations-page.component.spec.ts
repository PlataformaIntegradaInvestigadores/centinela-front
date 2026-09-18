import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { RecommendationsPageComponent } from './recommendations-page.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, asyncScheduler } from 'rxjs';
import { RecommendationService } from '../../../domain/services/recommendation.service';
import {
  GroupsResponse,
  MetricsResponse,
  ResearchGroup,
} from '../../../domain/entities/recommendation.interface';

describe('RecommendationsPageComponent', () => {
  let component: RecommendationsPageComponent;
  let fixture: ComponentFixture<RecommendationsPageComponent>;
  let serviceSpy: jasmine.SpyObj<RecommendationService>;

  const groupA: ResearchGroup = {
    group_id: 1,
    members: [1, 2],
    n_members: 2,
    papers_total: 10,
    recommendations: [],
    count: 1,
  };
  const groupB: ResearchGroup = { ...groupA, group_id: 2 };

  const groupsResponse: GroupsResponse = {
    total_groups: 2,
    displayed_groups: 2,
    groups: [groupA, groupB],
  };

  const metrics: MetricsResponse = {
    groups_persistent: 1,
    topics_unique: 3,
    novelty_rate: 0.5,
    new_vs_recent: 0.4,
    coverage: 0.6,
    diversity: 0.7,
    avg_relevance: 0.8,
    avg_score: 0.9,
    fairness_gini: 0.1,
    fairness_score_gap_by_group_size: 0.2,
    n_recommendations: 5,
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('RecommendationService', [
      'getGroups',
      'getMetrics',
      'getGroupRecommendations',
    ]);
    serviceSpy.getGroups.and.returnValue(of(groupsResponse, asyncScheduler));
    serviceSpy.getMetrics.and.returnValue(of(metrics, asyncScheduler));
    serviceSpy.getGroupRecommendations.and.returnValue(of(groupA, asyncScheduler));

    TestBed.configureTestingModule({
      declarations: [RecommendationsPageComponent],
      imports: [],
      providers: [{ provide: RecommendationService, useValue: serviceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(RecommendationsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads groups + metrics and auto-selects the first group', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.groups.length).toBe(2);
    expect(component.loadingGroups).toBeFalse();
    expect(component.metrics).toEqual(metrics);
    expect(component.loadingMetrics).toBeFalse();
    expect(component.groupsError).toBe('');
    expect(component.metricsError).toBe('');
    expect(serviceSpy.getGroupRecommendations).toHaveBeenCalledWith(
      groupA.group_id,
      component.recommendationsLimit,
    );
    expect(component.selectedGroup).toEqual(groupA);
    expect(component.loadingGroupDetail).toBeFalse();
  }));

  it('ngOnInit surfaces a groups error and keeps an empty list', fakeAsync(() => {
    serviceSpy.getGroups.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();
    tick();

    expect(component.groupsError).toBe('Could not load the research groups.');
    expect(component.loadingGroups).toBeFalse();
    expect(component.groups).toEqual([]);
  }));

  it('ngOnInit surfaces a metrics error', fakeAsync(() => {
    serviceSpy.getMetrics.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();
    tick();

    expect(component.metricsError).toBe('Could not load the GRS metrics.');
    expect(component.loadingMetrics).toBeFalse();
  }));

  it('selectGroup pushes the group through the switchMap selection stream', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    serviceSpy.getGroupRecommendations.calls.reset();

    component.selectGroup(groupB);
    tick();

    expect(serviceSpy.getGroupRecommendations).toHaveBeenCalledWith(
      groupB.group_id,
      component.recommendationsLimit,
    );
    expect(component.selectedGroup).toEqual(groupA);
    expect(component.loadingGroupDetail).toBeFalse();
  }));

  it('selection stream records a group-detail error and emits null on failure', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    serviceSpy.getGroupRecommendations.and.returnValue(throwError(() => new Error('boom')));

    component.selectGroup(groupB);
    tick();

      expect(component.groupDetailError).toBe('Could not load the group recommendations.');
      expect(component.selectedGroup).not.toEqual(groupB);
  }));

  it('reloadData clears selection and reloads groups + metrics', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    component.selectedGroup = groupA;
    component.currentPage = 3;
    serviceSpy.getGroups.calls.reset();
    serviceSpy.getMetrics.calls.reset();

    component.reloadData();
    expect(component.selectedGroup).toBeNull();
    expect(component.currentPage).toBe(1);
    expect(serviceSpy.getGroups).toHaveBeenCalled();
    expect(serviceSpy.getMetrics).toHaveBeenCalled();
    tick();
  }));

  it('trackGroupById returns the group id', () => {
    expect(component.trackGroupById(0, groupA)).toBe(groupA.group_id);
  });

  it('trackRecommendationByRank returns the rank', () => {
    expect(component.trackRecommendationByRank(0, { rank: 7 })).toBe(7);
  });

  it('ngOnDestroy unsubscribes from the selection stream', () => {
    fixture.detectChanges();
    const sub = (component as any).groupSelectionSubscription;
    expect(sub?.closed).toBeFalse();
    component.ngOnDestroy();
    expect(sub?.closed).toBeTrue();
  });
});
