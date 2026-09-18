import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TopicDashboardComponent } from './topic-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardService } from '../../../domain/services/dashboard.service';
import { TopicService } from '../../../domain/services/topic.service';
import { AffiliationService } from '../../../domain/services/affiliation.service';

describe('TopicDashboardComponent', () => {
  let component: TopicDashboardComponent;
  let fixture: ComponentFixture<TopicDashboardComponent>;
  let topicService: jasmine.SpyObj<TopicService>;
  let affiliationService: jasmine.SpyObj<AffiliationService>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  // Typed as `any`: Router exposes read-only members (url, events, navigated).
  let router: any;

  const years = [{ year: 2020 }, { year: 2021 }] as any;

  beforeEach(() => {
    topicService = jasmine.createSpyObj('TopicService', [
      'getOptionYears',
      'getLineChartTopicInfo',
      'getBarMapInfo',
      'getSummary',
      'getSummaryAcumulated',
      'getLineChartAffiliationRange',
      'getBarMapAcumulated',
      'getSummaryYear',
      'getLineChartAffiliationYear',
      'getBarMapYear',
    ]);
    affiliationService = jasmine.createSpyObj('AffiliationService', ['getId']);
    // jasmine.createSpyObj throws on an empty method list, so stub the one
    // DashboardService member that could be reached from the template.
    dashboardService = jasmine.createSpyObj('DashboardService', ['getBarInfo']);
    dashboardService.getBarInfo.and.returnValue(of([{ name: 'a', value: 1 }]));
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.events = new Subject<any>();
    router.url = '/home/analitica/dashboard/by-topic';
    router.navigated = true;

    topicService.getOptionYears.and.returnValue(of(years));
    topicService.getLineChartTopicInfo.and.returnValue(
      of([{ name: 'Topic', series: [{ name: 'a', value: 1 }] }]),
    );
    topicService.getBarMapInfo.and.returnValue(of([{ name: 'a', value: 1 }]));
    topicService.getSummary.and.returnValue(of({ articles: 5, affiliations: 3 }));
    topicService.getSummaryAcumulated.and.returnValue(of({ articles: 5, affiliations: 3 }));
    topicService.getLineChartAffiliationRange.and.returnValue(of([{ name: 'Topic', series: [] }]));
    topicService.getBarMapAcumulated.and.returnValue(of([{ name: 'a', value: 1 }]));
    topicService.getSummaryYear.and.returnValue(of({ articles: 5, affiliations: 3 }));
    topicService.getLineChartAffiliationYear.and.returnValue(of([{ name: 'Topic', series: [] }]));
    topicService.getBarMapYear.and.returnValue(of([{ name: 'a', value: 1 }]));

    affiliationService.getId.and.returnValue(of({ scopus_id: 'x' }));
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      declarations: [TopicDashboardComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TopicService, useValue: topicService },
        { provide: AffiliationService, useValue: affiliationService },
        { provide: Router, useValue: router },
        { provide: DashboardService, useValue: dashboardService },
        { provide: ActivatedRoute, useValue: { params: of({ name: 'topicX' }) } },
      ],
    });
    fixture = TestBed.createComponent(TopicDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads topic from route params in constructor', () => {
    expect(topicService.getOptionYears).toHaveBeenCalledWith('topicX');
    expect(component.topic_name).toBe('topicX');
  });

  it('getTopicName resets and loads data', () => {
    component.getTopicName('another');
    expect(component.topic_name).toBe('another');
    expect(component.charged).toBeTrue();
    expect(component.name).toBe('Topic');
  });

  it('ngOnChanges with scopusId reloads topic', () => {
    component.ngOnChanges({ scopusId: { currentValue: 'topicY' } } as any);
    expect(topicService.getLineChartTopicInfo).toHaveBeenCalled();
  });

  it('updateData Until last-year branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'Until';
    component.updateData(2021);
    expect(topicService.getLineChartTopicInfo).toHaveBeenCalled();
    expect(topicService.getBarMapInfo).toHaveBeenCalled();
    expect(topicService.getSummary).toHaveBeenCalled();
  });

  it('updateData Until accumulated branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'Until';
    component.updateData(2020);
    expect(topicService.getSummaryAcumulated).toHaveBeenCalled();
    expect(topicService.getLineChartAffiliationRange).toHaveBeenCalled();
    expect(topicService.getBarMapAcumulated).toHaveBeenCalled();
  });

  it('updateData In branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'In';
    component.updateData(2021);
    expect(topicService.getSummaryYear).toHaveBeenCalled();
    expect(topicService.getLineChartAffiliationYear).toHaveBeenCalled();
    expect(topicService.getBarMapYear).toHaveBeenCalled();
  });

  it('getId resolves scopus id then navigates', () => {
    component.getId('some name');
    expect(affiliationService.getId).toHaveBeenCalledWith('some name');
    expect(router.navigate).toHaveBeenCalled();
  });

  it('onSearch navigates by topic', () => {
    component.onSearch('topic-1');
    expect(router.navigate).toHaveBeenCalledWith(['home/analitica/dashboard/by-topic', 'topic-1']);
  });

  it('onSearchEntity navigates by affiliation', () => {
    component.onSearchEntity('aff-1');
    expect(router.navigate).toHaveBeenCalledWith([
      'home/analitica/dashboard/by-affiliation',
      'aff-1',
    ]);
  });

  it('navigateGeneral and navigateAffiliation', () => {
    component.navigateGeneral();
    component.navigateAffiliation();
    expect(router.navigate).toHaveBeenCalledTimes(2);
  });

  it('isCharged behaves correctly', () => {
    component.articles = 0;
    component.barMapInfo = [{ name: 'a', value: 1 }];
    component.yearOptions = [2021];
    component.year = 2021;
    // isCharged() returns the raw truthiness chain, not a boolean.
    expect(component.isCharged()).toBeFalsy();

    component.articles = 5;
    expect(component.isCharged()).toBeTruthy();
  });
});
