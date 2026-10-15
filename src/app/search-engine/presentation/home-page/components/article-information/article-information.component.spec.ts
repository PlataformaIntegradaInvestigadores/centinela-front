import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError, NEVER } from 'rxjs';
import { ArticleInformationComponent } from './article-information.component';
import { ArticleService } from '../../../../domain/services/article.service';
import { LLMSearchService } from '../../../../domain/services/llm_search.service';
import { PaginationArticleResult } from '../../../../../shared/interfaces/article.interface';

describe('ArticleInformationComponent', () => {
  let component: ArticleInformationComponent;
  let articleServiceSpy: jasmine.SpyObj<ArticleService>;
  let llmSearchServiceSpy: jasmine.SpyObj<LLMSearchService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const page1: PaginationArticleResult = {
    data: [{ title: 'A', abstract: 'abs', scopus_id: 's1' }],
    total: 1,
    total_results: 1,
    years: [2020, 2021],
  };

  const buildRoute = (queryParams: Record<string, string> = {}) => ({
    snapshot: { queryParamMap: convertToParamMap(queryParams) },
  });

  const build = (queryParams: Record<string, string> = {}) => {
    TestBed.resetTestingModule();
    articleServiceSpy = jasmine.createSpyObj('ArticleService', [
      'getMostRelevantArticlesByQuery',
      'getSearchFilters',
    ]);
    articleServiceSpy.getMostRelevantArticlesByQuery.and.returnValue(of(page1));
    articleServiceSpy.getSearchFilters.and.returnValue(of({ years: [] }));
    llmSearchServiceSpy = jasmine.createSpyObj('LLMSearchService', [
      'generateQa',
      'documentsFromArticles',
    ]);
    llmSearchServiceSpy.documentsFromArticles.and.callFake((articles: any[], limit = 3) =>
      (articles || []).slice(0, limit).map((a) => ({
        scopus_id: a.scopus_id,
        title: a.title,
        abstract: a.abstract || '',
      })),
    );
    llmSearchServiceSpy.generateQa.and.returnValue(
      of({
        query: 'ai',
        status: 'success',
        qa_pairs: [{ question: 'Q1', answer: 'A1' }],
      }),
    );
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [ArticleInformationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ArticleService, useValue: articleServiceSpy },
        { provide: LLMSearchService, useValue: llmSearchServiceSpy },
        { provide: ActivatedRoute, useValue: buildRoute(queryParams) },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(ArticleInformationComponent).componentInstance;
    component.query = 'ai';
  };

  beforeEach(() => build());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('restores state from url, loads filters, and wires the articles stream', (done) => {
      component.ngOnInit();
      expect(articleServiceSpy.getSearchFilters).toHaveBeenCalled();

      component.articles$.subscribe((result) => {
        expect(result.total).toBe(1);
        expect(component.total).toBe(1);
        expect(component.isFirstLoad).toBeFalse();
        expect(component.years).toEqual([2021, 2020]);
        expect(llmSearchServiceSpy.generateQa).toHaveBeenCalled();
        expect(component.qaPairs.length).toBe(1);
        expect(component.showQaCard).toBeTrue();
        done();
      });
    });

    it('hides the QA card completely when generation fails', (done) => {
      llmSearchServiceSpy.generateQa.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      component.articles$.subscribe(() => {
        expect(component.qaLoading).toBeFalse();
        expect(component.qaPairs).toEqual([]);
        expect(component.showQaCard).toBeFalse();
        done();
      });
    });

    it('hides the QA card silently when the assistant never responds (timeout)', fakeAsync(() => {
      llmSearchServiceSpy.generateQa.and.returnValue(NEVER);
      component.ngOnInit();
      component.articles$.subscribe();
      expect(component.qaLoading).toBeTrue();
      expect(component.showQaCard).toBeTrue();
      tick(90_000);
      expect(component.qaLoading).toBeFalse();
      expect(component.showQaCard).toBeFalse();
    }));

    it('hides the QA card when generation returns no pairs', (done) => {
      llmSearchServiceSpy.generateQa.and.returnValue(
        of({ query: 'ai', status: 'error: empty', qa_pairs: [] }),
      );
      component.ngOnInit();
      component.articles$.subscribe(() => {
        expect(component.showQaCard).toBeFalse();
        expect(component.qaPairs).toEqual([]);
        done();
      });
    });

    it('treats missing qa_pairs/status as empty and hides the card', (done) => {
      llmSearchServiceSpy.generateQa.and.returnValue(
        of({ query: 'ai' } as any),
      );
      component.ngOnInit();
      component.articles$.subscribe(() => {
        expect(component.qaStatus).toBe('');
        expect(component.qaPairs).toEqual([]);
        expect(component.showQaCard).toBeFalse();
        done();
      });
    });

    it('skips generateQa when the query is empty', (done) => {
      component.query = '';
      component.ngOnInit();
      component.articles$.subscribe(() => {
        expect(llmSearchServiceSpy.generateQa).not.toHaveBeenCalled();
        expect(component.showQaCard).toBeFalse();
        done();
      });
    });

    it('falls back to total when total_results is absent', (done) => {
      articleServiceSpy.getMostRelevantArticlesByQuery.and.returnValue(
        of({ data: [], total: 7 } as PaginationArticleResult),
      );
      component.ngOnInit();
      component.articles$.subscribe(() => {
        expect(component.total).toBe(7);
        expect(llmSearchServiceSpy.generateQa).not.toHaveBeenCalled();
        done();
      });
    });

    it('keeps isServerOnline true and surfaces an empty error result on a non-zero-status failure', (done) => {
      articleServiceSpy.getMostRelevantArticlesByQuery.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      component.ngOnInit();
      component.articles$.subscribe((result) => {
        expect(component.isServerOnline).toBeTrue();
        expect(component.total).toBe(0);
        expect(result.data).toEqual([]);
        done();
      });
    });

    it('sets isServerOnline false for a status-0 (offline) error', (done) => {
      articleServiceSpy.getMostRelevantArticlesByQuery.and.returnValue(
        throwError(() => ({ status: 0 })),
      );
      component.ngOnInit();
      component.articles$.subscribe(() => {
        expect(component.isServerOnline).toBeFalse();
        done();
      });
    });
  });

  describe('ngOnChanges', () => {
    it('resets pagination/filter state and requeries on a non-first query change', () => {
      component.ngOnInit();
      component.page = 3;
      component.ngOnChanges({
        query: { currentValue: 'new', previousValue: 'ai', firstChange: false, isFirstChange: () => false },
      } as any);
      expect(component.page).toBe(1);
      expect(component.selectedYears).toEqual([]);
      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('does nothing on the first change', () => {
      component.ngOnInit();
      component.page = 3;
      component.ngOnChanges({
        query: { currentValue: 'ai', previousValue: undefined, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(component.page).toBe(3);
    });
  });

  describe('onChangePagination', () => {
    it('updates page/size and pushes to refreshTable$', () => {
      component.ngOnInit();
      component.selectedYears = [2020];
      component.onChangePagination({ pageIndex: 2, pageSize: 25 } as any);
      expect(component.page).toBe(3);
      expect(component.size).toBe(25);
      expect(component.isPaginating).toBeTrue();
    });
  });

  describe('applyScholarFilter', () => {
    it('sets custom mode and shows the custom range', () => {
      component.applyScholarFilter('custom');
      expect(component.showCustomRange).toBeTrue();
    });

    it('clears years for "any"', () => {
      component.ngOnInit();
      component.applyScholarFilter('any');
      expect(component.selectedYears).toEqual([]);
      expect(component.showCustomRange).toBeFalse();
    });

    it('computes a year range for year0/year1/year2', () => {
      component.ngOnInit();
      component.applyScholarFilter('year1');
      expect(component.selectedYears).toEqual([component.currentYear - 1, component.currentYear]);
    });
  });

  describe('applyCustomRange', () => {
    it('applies a valid start/end range', () => {
      component.ngOnInit();
      component.startYear = 2018;
      component.endYear = 2020;
      component.applyCustomRange();
      expect(component.selectedYears).toEqual([2018, 2019, 2020]);
      expect(component.appliedStartYear).toBe(2018);
    });

    it('does nothing for an invalid range (start > end)', () => {
      component.ngOnInit();
      component.startYear = 2022;
      component.endYear = 2018;
      component.appliedStartYear = null;
      component.applyCustomRange();
      expect(component.appliedStartYear).toBeNull();
    });
  });

  describe('restoreStateFromUrl', () => {
    it('applies page/size/filter/years from query params', () => {
      build({ page: '2', size: '20', activeFilter: 'any', years: '2019,2020' });
      component.ngOnInit();
      expect(component.page).toBe(2);
      expect(component.size).toBe(20);
      expect(component.activeFilter).toBe('any');
      expect(component.selectedYears).toEqual([2019, 2020]);
    });

    it('ignores an invalid activeFilter value', () => {
      build({ activeFilter: 'bogus' });
      component.ngOnInit();
      expect(component.activeFilter).toBe('custom');
    });
  });

  describe('loadSearchFilters', () => {
    it('updates available years from the filters response', () => {
      articleServiceSpy.getSearchFilters.and.returnValue(of({ years: [2015, 2016] }));
      component.ngOnInit();
      expect(component.years).toEqual([2016, 2015]);
    });

    it('logs on filter-load failure', () => {
      spyOn(console, 'error');
      articleServiceSpy.getSearchFilters.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('seeMoreInformation navigates to the article route', () => {
    component.seeMoreInformation('s99');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['home/article', 's99']);
  });

  it('clickedRows delegates to seeMoreInformation', () => {
    spyOn(component, 'seeMoreInformation');
    component.clickedRows({ scopus_id: 's5' } as any);
    expect(component.seeMoreInformation).toHaveBeenCalledWith('s5');
  });
});
