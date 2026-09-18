import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SearchResultComponent } from './search-result.component';
import { VisualsService } from 'src/app/shared/domain/services/visuals.service';

describe('SearchResultComponent', () => {
  let component: SearchResultComponent;
  let routerSpy: jasmine.SpyObj<Router>;
  let visualsServiceSpy: jasmine.SpyObj<VisualsService>;
  let snapshotQueryParams: any;
  let snapshotQueryParamMap: Map<string, string>;

  function build() {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    visualsServiceSpy = jasmine.createSpyObj('VisualsService', ['getCounts', 'getTopics']);
    visualsServiceSpy.getCounts.and.returnValue(of({ author: 1 } as any));
    visualsServiceSpy.getTopics.and.returnValue(of([{ text: 'AI', size: 1 }] as any));

    TestBed.configureTestingModule({
      declarations: [SearchResultComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Title, useValue: jasmine.createSpyObj('Title', ['setTitle']) },
        { provide: VisualsService, useValue: visualsServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: snapshotQueryParams,
              queryParamMap: convertToParamMap(Object.fromEntries(snapshotQueryParamMap)),
            },
          },
        },
      ],
    });
    component = TestBed.createComponent(SearchResultComponent).componentInstance;
  }

  beforeEach(() => {
    snapshotQueryParams = {};
    snapshotQueryParamMap = new Map();
  });

  it('should create with default searchValue when there is no restored query', () => {
    build();
    expect(component.searchValue).toEqual({ option: 'au', query: '' });
    expect(component.setSearch).toBeUndefined();
  });

  it('restores setSearch from query params when both option and query are present', () => {
    snapshotQueryParams = { option: 'mrar', query: 'ai' };
    build();
    expect(component.setSearch).toEqual({ option: 'mrar', query: 'ai' });
  });

  it('ngOnInit sets the title and loads counts/topics', () => {
    build();
    component.ngOnInit();
    expect(component.counts).toEqual({ author: 1 } as any);
    expect(component.countsLoaded).toBeTrue();
    expect(component.words).toEqual([{ text: 'AI', size: 1 }] as any);
    expect(component.topicsLoaded).toBeTrue();
  });

  it('ngAfterContentChecked delegates to the change detector', () => {
    build();
    const detectChangesSpy = spyOn((component as any).changeDetector, 'detectChanges');
    component.ngAfterContentChecked();
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  describe('onSearch', () => {
    it('normalizes whitespace and navigates, clearing paging params for a new search', fakeAsync(() => {
      build();
      component.onSearch({ option: 'au', query: '  machine   learning  ' });

      expect(component.searchValue).toEqual({ option: 'au', query: 'machine learning' });
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({
            option: 'au',
            query: 'machine learning',
            page: null,
            size: null,
          }),
        }),
      );
      tick(100);
    }));

    it('preserves paging params when the search matches the restored one', fakeAsync(() => {
      snapshotQueryParams = { option: 'au', query: 'ai' };
      snapshotQueryParamMap = new Map([
        ['option', 'au'],
        ['query', 'ai'],
        ['page', '2'],
        ['size', '20'],
      ]);
      build();

      component.onSearch({ option: 'au', query: 'ai' });

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({ page: '2', size: '20' }),
        }),
      );
      tick(100);
    }));
  });

  it('topicClcked sets setSearch from the clicked topic', () => {
    build();
    component.topicClcked({ option: 'mrar', query: 'ai' });
    expect(component.setSearch).toEqual({ option: 'mrar', query: 'ai' });
  });

  describe('isAuthorSearch', () => {
    it('is true for the author option', () => {
      build();
      component.searchValue = { option: 'au', query: '' };
      expect(component.isAuthorSearch()).toBeTrue();
    });

    it('is false for any other option', () => {
      build();
      component.searchValue = { option: 'mrar', query: '' };
      expect(component.isAuthorSearch()).toBeFalse();
    });
  });
});
