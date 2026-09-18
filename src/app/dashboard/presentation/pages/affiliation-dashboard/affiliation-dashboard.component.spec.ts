import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AffiliationDashboardComponent } from './affiliation-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardService } from '../../../domain/services/dashboard.service';
import { AffiliationService } from '../../../domain/services/affiliation.service';

describe('AffiliationDashboardComponent', () => {
  let component: AffiliationDashboardComponent;
  let fixture: ComponentFixture<AffiliationDashboardComponent>;
  let affiliationService: jasmine.SpyObj<AffiliationService>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  // Typed as `any`: Router exposes read-only members (url, events, navigated).
  let router: any;

  const years = [{ year: 2020 }, { year: 2021 }] as any;

  beforeEach(() => {
    affiliationService = jasmine.createSpyObj('AffiliationService', [
      'getLineChartAffiliationInfo',
      'getTreeMapInfo',
      'getSummary',
      'getSummaryAcumulated',
      'getLineChartAffiliationRange',
      'getTreeMapAcumulated',
      'getSummaryYear',
      'getLineChartAffiliationYear',
      'getTreeMapYear',
      'getOptionYears',
    ]);
    // jasmine.createSpyObj throws on an empty method list, so stub the one
    // DashboardService member that could be reached from the template.
    dashboardService = jasmine.createSpyObj('DashboardService', ['getBarInfo']);
    dashboardService.getBarInfo.and.returnValue(of([{ name: 'a', value: 1 }]));
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.events = new Subject<any>();
    router.url = '/home/analitica/dashboard/by-affiliation';
    router.navigated = true;

    affiliationService.getOptionYears.and.returnValue(of(years));
    affiliationService.getLineChartAffiliationInfo.and.returnValue(
      of([{ name: 'Aff', series: [{ name: 'a', value: 1 }] }]),
    );
    affiliationService.getTreeMapInfo.and.returnValue(of([{ name: 'a', value: 1 }]));
    affiliationService.getSummary.and.returnValue(of({ articles: 5, topics: 3 }));
    affiliationService.getSummaryAcumulated.and.returnValue(of({ articles: 5, topics: 3 }));
    affiliationService.getLineChartAffiliationRange.and.returnValue(
      of([{ name: 'Aff', series: [] }]),
    );
    affiliationService.getTreeMapAcumulated.and.returnValue(of([{ name: 'a', value: 1 }]));
    affiliationService.getSummaryYear.and.returnValue(of({ articles: 5, topics: 3 }));
    affiliationService.getLineChartAffiliationYear.and.returnValue(
      of([{ name: 'Aff', series: [] }]),
    );
    affiliationService.getTreeMapYear.and.returnValue(of([{ name: 'a', value: 1 }]));

    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      declarations: [AffiliationDashboardComponent],
      // RouterTestingModule is intentionally omitted so that routerLink in the
      // template stays a plain attribute (NO_ERRORS_SCHEMA) instead of a real
      // directive that would need a fully featured Router instance.
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AffiliationService, useValue: affiliationService },
        { provide: Router, useValue: router },
        { provide: DashboardService, useValue: dashboardService },
        { provide: ActivatedRoute, useValue: { params: of({ id: '123' }) } },
      ],
    });
    fixture = TestBed.createComponent(AffiliationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads affiliation from route id in ngOnInit', () => {
    expect(component.scopusId).toBe('123');
    expect(affiliationService.getLineChartAffiliationInfo).toHaveBeenCalledWith('123');
    expect(component.affiliation).toBe('Aff');
    expect(component.charged).toBeTrue();
  });

  it('onSearchEntity navigates by affiliation', () => {
    component.onSearchEntity('aff-1');
    expect(router.navigate).toHaveBeenCalledWith([
      'home/analitica/dashboard/by-affiliation',
      'aff-1',
    ]);
  });

  it('ngOnChanges with scopusId reloads affiliation', () => {
    component.scopusId = '456';
    component.ngOnChanges({ scopusId: { currentValue: '456' } } as any);
    expect(affiliationService.getLineChartAffiliationInfo).toHaveBeenCalledWith('456');
  });

  it('getScopusId loads data', () => {
    component.getScopusId('789');
    expect(component.scopusId).toBe('789');
    expect(affiliationService.getLineChartAffiliationInfo).toHaveBeenCalledWith('789');
    expect(component.charged).toBeTrue();
  });

  it('updateData Until last-year branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'Until';
    component.updateData(2021);
    expect(affiliationService.getLineChartAffiliationInfo).toHaveBeenCalled();
    expect(affiliationService.getTreeMapInfo).toHaveBeenCalled();
    expect(affiliationService.getSummary).toHaveBeenCalled();
  });

  it('updateData Until accumulated branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'Until';
    component.updateData(2020);
    expect(affiliationService.getSummaryAcumulated).toHaveBeenCalled();
    expect(affiliationService.getLineChartAffiliationRange).toHaveBeenCalled();
    expect(affiliationService.getTreeMapAcumulated).toHaveBeenCalled();
  });

  it('updateData In branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'In';
    component.updateData(2021);
    expect(affiliationService.getSummaryYear).toHaveBeenCalled();
    expect(affiliationService.getLineChartAffiliationYear).toHaveBeenCalled();
    expect(affiliationService.getTreeMapYear).toHaveBeenCalled();
  });

  it('onSearchTopic navigates by topic', () => {
    component.onSearchTopic('topic-1');
    expect(router.navigate).toHaveBeenCalledWith(['home/analitica/dashboard/by-topic', 'topic-1']);
  });

  it('navigateGeneral and navigateTopic', () => {
    component.navigateGeneral();
    component.navigateTopic();
    expect(router.navigate).toHaveBeenCalledTimes(2);
  });

  it('isCharged behaves correctly', () => {
    component.articles = 0;
    component.topics = 0;
    component.yearOptions = [2021];
    // isCharged() returns the raw truthiness chain, not a boolean.
    expect(component.isCharged()).toBeFalsy();

    component.articles = 5;
    component.topics = 3;
    expect(component.isCharged()).toBeTruthy();
  });
});
