import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ProfileDataComponent } from './profile-data.component';
import { AuthorService } from '../../../../search-engine/domain/services/author.service';

describe('ProfileDataComponent', () => {
  let component: ProfileDataComponent;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  function build(routeId: string | null) {
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getAuthorById', 'getLineChartInfo']);
    routerSpy = jasmine.createSpyObj('Router', ['serializeUrl', 'createUrlTree']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    TestBed.configureTestingModule({
      declarations: [ProfileDataComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorService, useValue: authorServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { paramMap: of(convertToParamMap(routeId ? { id: routeId } : {})) },
          },
        },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy },
      ],
    });
    component = TestBed.createComponent(ProfileDataComponent).componentInstance;
  }

  afterEach(() => localStorage.clear());

  it('should create', () => {
    build(null);
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('skips author lookup for a non-numeric or missing route id', () => {
      build(null);
      component.ngOnInit();
      expect(component.isLoading).toBeFalse();
      expect(component.isAuthor).toBeFalse();
      expect(authorServiceSpy.getAuthorById).not.toHaveBeenCalled();
    });

    it('loads author name and chart data for a numeric id', () => {
      build('123');
      authorServiceSpy.getAuthorById.and.returnValue(of({ auth_name: 'Ana Perez' } as any));
      authorServiceSpy.getLineChartInfo.and.returnValue(of([{ year: 2024, count: 1 } as any]));

      component.ngOnInit();

      expect(component.idRoute).toBe('123');
      expect(component.isAuthor).toBeTrue();
      expect(component.name).toBe('Ana Perez');
      expect(component.years?.length).toBe(1);
      expect(component.charged).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('flags a chart error when chart data fails to load', () => {
      build('123');
      authorServiceSpy.getAuthorById.and.returnValue(of({ auth_name: 'Ana' } as any));
      authorServiceSpy.getLineChartInfo.and.returnValue(throwError(() => new Error('boom')));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(component.chartError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('flags a chart error when the author lookup itself fails', () => {
      build('123');
      authorServiceSpy.getAuthorById.and.returnValue(throwError(() => new Error('boom')));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(component.chartError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('ngOnChanges', () => {
    it('checks login status when the user input changes', () => {
      build(null);
      localStorage.setItem('accessToken', 't');
      localStorage.setItem('userId', 'u-1');
      component.user = { scopus_id: undefined } as any;
      component.ngOnChanges({ user: {} as any });
      expect(component.isLoggedIn).toBeTrue();
    });

    it('fetches scopus data when the user has a scopus_id', () => {
      build(null);
      authorServiceSpy.getAuthorById.and.returnValue(
        of({ citation_count: 10, articles: 3 } as any),
      );
      component.user = { scopus_id: '123' } as any;
      component.ngOnChanges({ user: {} as any });
      expect(component.scopusData).toEqual({ citations: 10, articles: 3 });
      expect(component.isLoading).toBeFalse();
    });

    it('falls back to a timed loading-false when there is no scopus_id', (done) => {
      build(null);
      component.user = { scopus_id: undefined } as any;
      component.ngOnChanges({ user: {} as any });
      setTimeout(() => {
        expect(component.isLoading).toBeFalse();
        done();
      }, 600);
    });
  });

  describe('isNumeric', () => {
    it('returns true for a numeric string', () => {
      build(null);
      expect(component.isNumeric('123')).toBeTrue();
    });

    it('returns false for a non-numeric string', () => {
      build(null);
      expect(component.isNumeric('abc')).toBeFalse();
    });
  });

  it('toggleForm flips showForm', () => {
    build(null);
    component.toggleForm();
    expect(component.showForm).toBeTrue();
  });

  describe('visibility getters', () => {
    it('shouldShowLoggedInMessage true when logged in, own profile, no details', () => {
      build(null);
      component.isLoggedIn = true;
      component.isOwnProfile = true;
      component.user = {} as any;
      expect(component.shouldShowLoggedInMessage).toBeTrue();
    });

    it('shouldShowLoggedOutMessage true when logged out and no details', () => {
      build(null);
      component.isLoggedIn = false;
      component.user = {} as any;
      expect(component.shouldShowLoggedOutMessage).toBeTrue();
    });

    it('hasUserDetails true when any detail field is set', () => {
      build(null);
      component.user = { institution: 'MIT' } as any;
      expect(component.hasUserDetails).toBeTrue();
    });

    it('hasUserDetails false without a user', () => {
      build(null);
      component.user = undefined;
      expect(component.hasUserDetails).toBeFalse();
    });
  });

  it('goToScopus opens the scopus author profile', () => {
    build(null);
    spyOn(window, 'open');
    component.goToScopus('123');
    expect(window.open).toHaveBeenCalledWith(
      'https://www.scopus.com/authid/detail.uri?authorId=123',
      '_blank',
    );
  });

  it('goBack delegates to Location', () => {
    build(null);
    component.goBack();
    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('goToArticle serializes the url and opens it', () => {
    build(null);
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('/article/123');
    spyOn(window, 'open');
    component.goToArticle('123');
    expect(window.open).toHaveBeenCalledWith('/article/123', '_blank');
  });
});
