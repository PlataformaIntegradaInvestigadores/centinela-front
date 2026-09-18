import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { GettingStartedComponent } from './getting-started.component';

describe('GettingStartedComponent', () => {
  let component: GettingStartedComponent;
  let viewportScrollerSpy: jasmine.SpyObj<ViewportScroller>;
  let routerEvents$: Subject<any>;
  let currentUrl: string;

  beforeEach(() => {
    viewportScrollerSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);
    routerEvents$ = new Subject<any>();
    currentUrl = '/home/about-us/getting-started';

    TestBed.configureTestingModule({
      declarations: [GettingStartedComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ViewportScroller, useValue: viewportScrollerSpy },
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
            get url() {
              return currentUrl;
            },
          },
        },
      ],
    });
    component = TestBed.createComponent(GettingStartedComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the collaborators list', () => {
    expect(component.collaborators.length).toBeGreaterThan(0);
    expect(component.collaborators[0].name).toContain('Suntaxi');
  });

  describe('ngOnInit', () => {
    it('scrolls to the collaborators anchor on navigation to a /collaborators url', () => {
      component.ngOnInit();
      currentUrl = '/home/about-us/collaborators';
      routerEvents$.next(new NavigationEnd(1, currentUrl, currentUrl));
      expect(viewportScrollerSpy.scrollToAnchor).toHaveBeenCalledWith('collaborators');
    });

    it('does not scroll for a navigation to an unrelated url', () => {
      component.ngOnInit();
      currentUrl = '/home/about-us/getting-started';
      routerEvents$.next(new NavigationEnd(1, currentUrl, currentUrl));
      expect(viewportScrollerSpy.scrollToAnchor).not.toHaveBeenCalled();
    });

    it('ignores non-NavigationEnd router events', () => {
      component.ngOnInit();
      routerEvents$.next({ type: 'other' });
      expect(viewportScrollerSpy.scrollToAnchor).not.toHaveBeenCalled();
    });
  });
});
