import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AffiliationComponent } from './affiliation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { DashboardService } from '../../../domain/services/dashboard.service';
import { AffiliationService } from '../../../domain/services/affiliation.service';

describe('AffiliationComponent', () => {
  let component: AffiliationComponent;
  let fixture: ComponentFixture<AffiliationComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let affiliationService: jasmine.SpyObj<AffiliationService>;
  let router: jasmine.SpyObj<Router>;
  let bpObserver: jasmine.SpyObj<BreakpointObserver>;
  let bpSubject: Subject<any>;

  beforeEach(() => {
    bpSubject = new Subject<any>();
    dashboardService = jasmine.createSpyObj('DashboardService', ['getBarInfo']);
    affiliationService = jasmine.createSpyObj('AffiliationService', ['getId']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    bpObserver = jasmine.createSpyObj('BreakpointObserver', ['observe']);

    dashboardService.getBarInfo.and.returnValue(
      of([
        { name: 'a', value: 1 },
        { name: 'b', value: 2 },
      ]),
    );
    affiliationService.getId.and.returnValue(of({ scopus_id: 'x' }));
    router.navigate.and.returnValue(Promise.resolve(true));
    bpObserver.observe.and.returnValue(bpSubject);

    TestBed.configureTestingModule({
      declarations: [AffiliationComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: AffiliationService, useValue: affiliationService },
        { provide: Router, useValue: router },
        { provide: BreakpointObserver, useValue: bpObserver },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    });
    fixture = TestBed.createComponent(AffiliationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads summary', () => {
    fixture.detectChanges();
    expect(dashboardService.getBarInfo).toHaveBeenCalled();
    expect(component.affiliations.length).toBe(2);
    expect(component.isCharged()).toBeTruthy();
  });

  it('isCharged false when no affiliations', () => {
    component.affiliations = undefined as any;
    expect(component.isCharged()).toBeFalsy();
  });

  it('onSearchEntity navigates by affiliation', () => {
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

  it('navigateGeneral and navigateTopic', () => {
    component.navigateGeneral();
    component.navigateTopic();
    expect(router.navigate).toHaveBeenCalledTimes(2);
  });

  it('initSize reacts to XSmall breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.XSmall]: true } });
    expect(component.size).toBe('xSmall');
  });

  it('initSize reacts to Small breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.Small]: true } });
    expect(component.size).toBe('small');
  });

  it('initSize reacts to Medium breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.Medium]: true } });
    expect(component.size).toBe('medium');
  });

  it('initSize reacts to Large breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.Large]: true } });
    expect(component.size).toBe('large');
  });

  it('initSize reacts to XLarge breakpoint', () => {
    bpSubject.next({ matches: true, breakpoints: { [Breakpoints.XLarge]: true } });
    expect(component.size).toBe('xLarge');
  });
});
