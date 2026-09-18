import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { GeneralComponent } from './general.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { DashboardService } from '../../../domain/services/dashboard.service';
import { AffiliationService } from '../../../domain/services/affiliation.service';

describe('GeneralComponent', () => {
  let component: GeneralComponent;
  let fixture: ComponentFixture<GeneralComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let affiliationService: jasmine.SpyObj<AffiliationService>;
  // Typed as `any`: Router exposes read-only members (url, events, navigated).
  let router: any;
  let bpObserver: jasmine.SpyObj<BreakpointObserver>;
  let bpSubject: Subject<any>;

  const years = [{ year: 2020 }, { year: 2021 }] as any;

  beforeEach(() => {
    bpSubject = new Subject<any>();
    dashboardService = jasmine.createSpyObj('DashboardService', [
      'getLineChartInfo',
      'getTreeMap',
      'getBarInfo',
      'getYears',
      'getTreeMapInfoAcumulated',
      'getBarInfoAcumulated',
      'getProvinces',
      'getCounts',
      'getLineChartInfoRange',
      'getCountsYear',
      'getBarInfoYear',
      'getTreeMapInfo',
      'getLineChartInfoYear',
      'getProvincesYear',
      'getProvincesAcumulated',
    ]);
    affiliationService = jasmine.createSpyObj('AffiliationService', ['getId']);
    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    router.events = new Subject<any>();
    router.url = '/home/analitica/dashboard';
    router.navigated = true;
    bpObserver = jasmine.createSpyObj('BreakpointObserver', ['observe']);

    dashboardService.getYears.and.returnValue(of(years));
    dashboardService.getLineChartInfo.and.returnValue(
      of([
        {
          name: 'Ecuador',
          series: [
            { name: 'a', value: 1 },
            { name: 'b', value: 2 },
          ],
        },
      ]),
    );
    dashboardService.getLineChartInfoRange.and.returnValue(of([{ name: 'Ecuador', series: [] }]));
    dashboardService.getLineChartInfoYear.and.returnValue(of([{ name: 'Ecuador', series: [] }]));
    dashboardService.getTreeMap.and.returnValue(of([]));
    dashboardService.getBarInfo.and.returnValue(of([]));
    dashboardService.getTreeMapInfoAcumulated.and.returnValue(of([]));
    dashboardService.getBarInfoAcumulated.and.returnValue(of([]));
    dashboardService.getTreeMapInfo.and.returnValue(of([]));
    dashboardService.getBarInfoYear.and.returnValue(of([]));
    dashboardService.getCounts.and.returnValue(
      of({ author: 1, article: 1, affiliation: 1, topic: 1 }),
    );
    dashboardService.getCountsYear.and.returnValue(
      of({ author: 1, article: 1, affiliation: 1, topic: 1 }),
    );
    dashboardService.getProvinces.and.returnValue('/prov');
    dashboardService.getProvincesYear.and.returnValue('/prov-year');
    dashboardService.getProvincesAcumulated.and.returnValue('/prov-acum');

    affiliationService.getId.and.returnValue(of({ scopus_id: 'x' }));
    router.navigate.and.returnValue(Promise.resolve(true));
    router.createUrlTree.and.returnValue({});
    router.serializeUrl.and.returnValue('/');
    bpObserver.observe.and.returnValue(bpSubject);

    TestBed.configureTestingModule({
      declarations: [GeneralComponent],
      // RouterTestingModule is intentionally omitted so that routerLink/routerLinkActive
      // in the template stay plain attributes (NO_ERRORS_SCHEMA) instead of real
      // directives that would need a fully featured Router instance.
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: AffiliationService, useValue: affiliationService },
        { provide: Router, useValue: router },
        { provide: BreakpointObserver, useValue: bpObserver },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    });
    fixture = TestBed.createComponent(GeneralComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data in ngOnInit', () => {
    fixture.detectChanges();
    expect(component.lineChartInfo).toBeDefined();
    expect(component.treeMapInfo).toBeDefined();
    expect(component.barChartInfo).toBeDefined();
    expect(component.provinces).toContain('/v1/dashboard/province');
    expect(component.isCharged()).toBeTruthy();
  });

  it('isCharged returns false when data is missing', () => {
    component.lineChartInfo = undefined as any;
    expect(component.isCharged()).toBeFalsy();
  });

  it('updateData Until last-year branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'Until';
    component.updateData(2021);
    expect(dashboardService.getTreeMap).toHaveBeenCalled();
    expect(dashboardService.getBarInfo).toHaveBeenCalled();
  });

  it('updateData Until accumulated branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'Until';
    component.updateData(2020);
    expect(dashboardService.getTreeMapInfoAcumulated).toHaveBeenCalled();
    expect(dashboardService.getBarInfoAcumulated).toHaveBeenCalled();
  });

  it('updateData In branch', () => {
    component.yearOptions = [2020, 2021];
    component.selectedOption = 'In';
    component.updateData(2021);
    expect(dashboardService.getCountsYear).toHaveBeenCalled();
    expect(dashboardService.getBarInfoYear).toHaveBeenCalled();
    expect(dashboardService.getTreeMapInfo).toHaveBeenCalled();
    expect(dashboardService.getLineChartInfoYear).toHaveBeenCalled();
  });

  it('onSearchEntity navigates', () => {
    component.onSearchEntity('aff-1');
    expect(router.navigate).toHaveBeenCalledWith([
      'home/analitica/dashboard/by-affiliation',
      'aff-1',
    ]);
  });

  it('getId resolves scopus id then navigates', () => {
    component.getId('some name');
    expect(affiliationService.getId).toHaveBeenCalledWith('some name');
    expect(router.navigate).toHaveBeenCalled();
  });

  it('onSearchTopic navigates', () => {
    component.onSearchTopic('topic-1');
    expect(router.navigate).toHaveBeenCalledWith(['home/analitica/dashboard/by-topic', 'topic-1']);
  });

  it('initSize reacts to XSmall breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.XSmall]: true } });
    expect(component.size).toBe('xSmall');
    expect(component.ecW).toBe(window.innerWidth * 0.985);
  });

  it('initSize reacts to Small breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.Small]: true } });
    expect(component.size).toBe('small');
  });

  it('initSize reacts to Medium breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.Medium]: true } });
    expect(component.size).toBe('medium');
    expect(component.ecW).toBe(window.innerWidth * 0.39);
  });

  it('initSize reacts to Large breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.Large]: true } });
    expect(component.size).toBe('large');
    expect(component.ecW).toBe(window.innerWidth * 0.295);
  });

  it('initSize reacts to XLarge breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.XLarge]: true } });
    expect(component.size).toBe('xLarge');
  });

  it('initSize ignores when nothing matches', () => {
    const previous = component.size;
    bpSubject.next({ matches: false, breakpoints: {} });
    expect(component.size).toBe(previous);
  });
});
