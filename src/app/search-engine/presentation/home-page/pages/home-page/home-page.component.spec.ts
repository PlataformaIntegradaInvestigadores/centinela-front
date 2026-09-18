import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let titleSpy: jasmine.SpyObj<Title>;
  let routerEvents$: Subject<any>;
  let currentUrl: string;

  beforeEach(() => {
    titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    routerEvents$ = new Subject<any>();
    currentUrl = '/home';

    TestBed.configureTestingModule({
      declarations: [HomePageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Title, useValue: titleSpy },
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
    component = TestBed.createComponent(HomePageComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit sets the page title and listens for navigation', () => {
    component.ngOnInit();
    expect(titleSpy.setTitle).toHaveBeenCalledWith('Welcome');
  });

  it('ngAfterViewInit shows the search box after a tick, for a non-excluded route', fakeAsync(() => {
    currentUrl = '/home';
    component.ngAfterViewInit();
    tick();
    expect(component.showSearchBox).toBeTrue();
  }));

  it('hides the search box on the analytics route', fakeAsync(() => {
    currentUrl = '/home/analitica';
    component.ngAfterViewInit();
    tick();
    expect(component.showSearchBox).toBeFalse();
  }));

  it('hides the search box on a route ending in "list"', fakeAsync(() => {
    currentUrl = '/jobs/list';
    component.ngAfterViewInit();
    tick();
    expect(component.showSearchBox).toBeFalse();
  }));

  it('re-evaluates search box visibility on NavigationEnd', () => {
    component.ngOnInit();
    currentUrl = '/home/analitica';
    routerEvents$.next(new NavigationEnd(1, '/home/analitica', '/home/analitica'));
    expect(component.showSearchBox).toBeFalse();
  });

  it('ignores non-NavigationEnd router events', () => {
    component.ngOnInit();
    component.showSearchBox = true;
    routerEvents$.next({ type: 'other' });
    expect(component.showSearchBox).toBeTrue();
  });
});
