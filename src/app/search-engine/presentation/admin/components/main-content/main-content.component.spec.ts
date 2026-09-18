import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MainContentComponent } from './main-content.component';
import { DashboardAdminService } from 'src/app/search-engine/domain/services/dashboard-admin.service';
import { UpdateCentinelaService } from 'src/app/search-engine/domain/services/update-centinela.service';

describe('MainContentComponent', () => {
  let component: MainContentComponent;
  let dashboardAdminServiceSpy: jasmine.SpyObj<DashboardAdminService>;
  let updateCentinelaSpy: jasmine.SpyObj<UpdateCentinelaService>;

  beforeEach(() => {
    dashboardAdminServiceSpy = jasmine.createSpyObj('DashboardAdminService', [
      'getAuthorComparator',
      'getArticlesComparator',
      'getmodelCorpusObserver',
      'generateCorpus',
      'generateModel',
      'getNoSqlDbYears',
      'getNoSqlDbCounts',
      'populateNoSqlDb',
    ]);
    updateCentinelaSpy = jasmine.createSpyObj('UpdateCentinelaService', [
      'updateAuthorsCentinela',
      'searchArticlesCentinela',
    ]);

    dashboardAdminServiceSpy.getAuthorComparator.and.returnValue(
      of({ authors_no_updated: 0, total_authors: 0 }),
    );
    dashboardAdminServiceSpy.getArticlesComparator.and.returnValue(
      of({ total_centinela: 0, total_scopus: 0 }),
    );
    dashboardAdminServiceSpy.getmodelCorpusObserver.and.returnValue(of({ model: true, corpus: true }));
    dashboardAdminServiceSpy.getNoSqlDbYears.and.returnValue(of([]));
    dashboardAdminServiceSpy.getNoSqlDbCounts.and.returnValue(
      of({ author: 0, article: 0, affiliation: 0, topic: 0 }),
    );

    TestBed.configureTestingModule({
      declarations: [MainContentComponent],
      providers: [
        { provide: DashboardAdminService, useValue: dashboardAdminServiceSpy },
        { provide: UpdateCentinelaService, useValue: updateCentinelaSpy },
      ],
    });
    component = TestBed.createComponent(MainContentComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit fires all four loaders', () => {
    component.ngOnInit();
    expect(dashboardAdminServiceSpy.getAuthorComparator).toHaveBeenCalled();
    expect(dashboardAdminServiceSpy.getArticlesComparator).toHaveBeenCalled();
    expect(dashboardAdminServiceSpy.getmodelCorpusObserver).toHaveBeenCalled();
    expect(dashboardAdminServiceSpy.getNoSqlDbYears).toHaveBeenCalled();
  });

  describe('getAuthorComparator', () => {
    it('sets the comparator and computed percentage on success', () => {
      dashboardAdminServiceSpy.getAuthorComparator.and.returnValue(
        of({ authors_no_updated: 25, total_authors: 100 }),
      );
      component.getAuthorComparator();
      expect(component.authorPercentage).toBe(25);
      expect(component.loadingAuthorsComparator).toBeFalse();
    });

    it('sets a connection error message for status 0', () => {
      dashboardAdminServiceSpy.getAuthorComparator.and.returnValue(
        throwError(() => ({ status: 0 })),
      );
      component.getAuthorComparator();
      expect(component.generalStatus?.message).toContain('Unable to connect');
      expect(component.authorComparator).toEqual({ authors_no_updated: 0, total_authors: 0 });
    });

    it('uses the server error message for status 400 with a message', () => {
      dashboardAdminServiceSpy.getAuthorComparator.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad request' } })),
      );
      component.getAuthorComparator();
      expect(component.generalStatus?.message).toBe('bad request');
    });

    it('uses a default message for status 400 without a message', () => {
      dashboardAdminServiceSpy.getAuthorComparator.and.returnValue(
        throwError(() => ({ status: 400, error: {} })),
      );
      component.getAuthorComparator();
      expect(component.generalStatus?.message).toBe('Error getting author comparator');
    });

    it('uses a default message for any other status', () => {
      dashboardAdminServiceSpy.getAuthorComparator.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      component.getAuthorComparator();
      expect(component.generalStatus?.message).toBe('Error getting author comparator');
    });
  });

  describe('getArticlesComparator', () => {
    it('sets the comparator and computed percentage on success', () => {
      dashboardAdminServiceSpy.getArticlesComparator.and.returnValue(
        of({ total_centinela: 40, total_scopus: 200 }),
      );
      component.getArticlesComparator();
      expect(component.articlePercentage).toBe(20);
    });

    it('sets a connection error message for status 0', () => {
      dashboardAdminServiceSpy.getArticlesComparator.and.returnValue(
        throwError(() => ({ status: 0 })),
      );
      component.getArticlesComparator();
      expect(component.generalStatus?.message).toContain('Unable to connect');
    });

    it('uses the server error message for status 400 with a message', () => {
      dashboardAdminServiceSpy.getArticlesComparator.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad' } })),
      );
      component.getArticlesComparator();
      expect(component.generalStatus?.message).toBe('bad');
    });

    it('uses a default message for status 400 without a message', () => {
      dashboardAdminServiceSpy.getArticlesComparator.and.returnValue(
        throwError(() => ({ status: 400, error: {} })),
      );
      component.getArticlesComparator();
      expect(component.generalStatus?.message).toBe('Error getting article comparator');
    });

    it('uses a default message for any other status', () => {
      dashboardAdminServiceSpy.getArticlesComparator.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      component.getArticlesComparator();
      expect(component.generalStatus?.message).toBe('Error getting article comparator');
    });
  });

  describe('calculateAuthorPercentage', () => {
    it('is 0 without a comparator', () => {
      component.authorComparator = undefined;
      component.calculateAuthorPercentage();
      expect(component.authorPercentage).toBe(0);
    });

    it('is 0 when total_authors is 0', () => {
      component.authorComparator = { authors_no_updated: 5, total_authors: 0 };
      component.calculateAuthorPercentage();
      expect(component.authorPercentage).toBe(0);
    });
  });

  describe('calculateArticlePercentage', () => {
    it('is 0 without a comparator', () => {
      component.articleComparator = undefined;
      component.calculateArticlePercentage();
      expect(component.articlePercentage).toBe(0);
    });

    it('is 0 when total_scopus is 0', () => {
      component.articleComparator = { total_centinela: 5, total_scopus: 0 };
      component.calculateArticlePercentage();
      expect(component.articlePercentage).toBe(0);
    });
  });

  describe('getModelCorpusObserver', () => {
    it('sets existsModel/existsCorpus on success', () => {
      dashboardAdminServiceSpy.getmodelCorpusObserver.and.returnValue(
        of({ model: false, corpus: true }),
      );
      component.getModelCorpusObserver();
      expect(component.existsModel).toBeFalse();
      expect(component.existsCorpus).toBeTrue();
    });

    it('sets a connection error message for status 0', () => {
      dashboardAdminServiceSpy.getmodelCorpusObserver.and.returnValue(
        throwError(() => ({ status: 0 })),
      );
      component.getModelCorpusObserver();
      expect(component.generalStatus?.message).toContain('Unable to connect');
    });

    it('uses the server error message for status 400 with a message', () => {
      dashboardAdminServiceSpy.getmodelCorpusObserver.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad' } })),
      );
      component.getModelCorpusObserver();
      expect(component.generalStatus?.message).toBe('bad');
    });

    it('uses a default message for status 400 without a message', () => {
      dashboardAdminServiceSpy.getmodelCorpusObserver.and.returnValue(
        throwError(() => ({ status: 400, error: {} })),
      );
      component.getModelCorpusObserver();
      expect(component.generalStatus?.message).toBe('Error getting model corpus observer');
    });

    it('uses a default message for any other status', () => {
      dashboardAdminServiceSpy.getmodelCorpusObserver.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      component.getModelCorpusObserver();
      expect(component.generalStatus?.message).toBe('Error getting model corpus observer');
    });
  });

  describe('generateCorpus', () => {
    it('sets a success message and refreshes the observer', () => {
      spyOn(component, 'getModelCorpusObserver');
      dashboardAdminServiceSpy.generateCorpus.and.returnValue(of({ success: true, message: '' }));
      component.generateCorpus();
      expect(component.corpusStatus?.message).toBe('Corpus generated successfully');
      expect(component.getModelCorpusObserver).toHaveBeenCalled();
      expect(component.loadingCorpus).toBeFalse();
    });

    it('sets a connection error message for status 0', () => {
      dashboardAdminServiceSpy.generateCorpus.and.returnValue(throwError(() => ({ status: 0 })));
      component.generateCorpus();
      expect(component.corpusStatus?.message).toContain('Unable to connect');
      expect(component.loadingCorpus).toBeFalse();
    });

    it('sets generalStatus for status 400 with a message', () => {
      dashboardAdminServiceSpy.generateCorpus.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad' } })),
      );
      component.generateCorpus();
      expect(component.generalStatus?.message).toBe('bad');
    });

    it('sets corpusStatus default message for status 400 without a message', () => {
      dashboardAdminServiceSpy.generateCorpus.and.returnValue(
        throwError(() => ({ status: 400, error: {} })),
      );
      component.generateCorpus();
      expect(component.corpusStatus?.message).toBe('Error generating corpus');
    });

    it('uses error.error.detail for any other status', () => {
      dashboardAdminServiceSpy.generateCorpus.and.returnValue(
        throwError(() => ({ status: 500, error: { detail: 'server exploded' } })),
      );
      component.generateCorpus();
      expect(component.corpusStatus?.message).toBe('server exploded');
    });
  });

  describe('generateModel', () => {
    it('sets a success message and refreshes the observer', () => {
      spyOn(component, 'getModelCorpusObserver');
      dashboardAdminServiceSpy.generateModel.and.returnValue(of({ success: true, message: '' }));
      component.generateModel();
      expect(component.modelStatus?.message).toBe('Model generated successfully');
      expect(component.getModelCorpusObserver).toHaveBeenCalled();
      expect(component.loadingModel).toBeFalse();
    });

    it('sets a connection error message for status 0', () => {
      dashboardAdminServiceSpy.generateModel.and.returnValue(throwError(() => ({ status: 0 })));
      component.generateModel();
      expect(component.modelStatus?.message).toContain('Unable to connect');
    });

    it('uses the server error message for status 400 with a message', () => {
      dashboardAdminServiceSpy.generateModel.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad' } })),
      );
      component.generateModel();
      expect(component.modelStatus?.message).toBe('bad');
    });

    it('uses a default message for status 400 without a message', () => {
      dashboardAdminServiceSpy.generateModel.and.returnValue(
        throwError(() => ({ status: 400, error: {} })),
      );
      component.generateModel();
      expect(component.modelStatus?.message).toBe('Error generating model');
    });

    it('uses error.error.detail for any other status', () => {
      dashboardAdminServiceSpy.generateModel.and.returnValue(
        throwError(() => ({ status: 500, error: { detail: 'boom' } })),
      );
      component.generateModel();
      expect(component.modelStatus?.message).toBe('boom');
    });
  });

  describe('updateAuthors', () => {
    it('sets the status on success', () => {
      updateCentinelaSpy.updateAuthorsCentinela.and.returnValue(of({ success: true, message: 'ok' }));
      component.updateAuthors();
      expect(component.updateAuthorStatus?.message).toBe('ok');
      expect(component.loadingAuthors).toBeFalse();
    });

    it('sets a connection error message for status 0', () => {
      updateCentinelaSpy.updateAuthorsCentinela.and.returnValue(throwError(() => ({ status: 0 })));
      component.updateAuthors();
      expect(component.updateAuthorStatus?.message).toContain('Unable to connect');
    });

    it('uses the server error message for status 400 with a message', () => {
      updateCentinelaSpy.updateAuthorsCentinela.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad' } })),
      );
      component.updateAuthors();
      expect(component.updateAuthorStatus?.message).toBe('bad');
    });

    it('uses a default message for status 400 without a message', () => {
      updateCentinelaSpy.updateAuthorsCentinela.and.returnValue(
        throwError(() => ({ status: 400, error: {} })),
      );
      component.updateAuthors();
      expect(component.updateAuthorStatus?.message).toBe('Error getting article comparator');
    });

    it('uses statusText for status 405', () => {
      updateCentinelaSpy.updateAuthorsCentinela.and.returnValue(
        throwError(() => ({ status: 405, statusText: 'Method Not Allowed' })),
      );
      component.updateAuthors();
      expect(component.updateAuthorStatus?.message).toBe('Method Not Allowed');
    });

    it('uses error.error.message for any other status', () => {
      updateCentinelaSpy.updateAuthorsCentinela.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'server error' } })),
      );
      component.updateAuthors();
      expect(component.updateAuthorStatus?.message).toBe('server error');
    });
  });

  describe('updateArticlesCentinela', () => {
    it('sets the status on success', () => {
      updateCentinelaSpy.searchArticlesCentinela.and.returnValue(of({ success: true, message: 'ok' }));
      component.updateArticlesCentinela();
      expect(component.updateArticleStatus?.message).toBe('ok');
      expect(component.loadingArticles).toBeFalse();
    });

    it('sets a connection error message for status 0', () => {
      updateCentinelaSpy.searchArticlesCentinela.and.returnValue(throwError(() => ({ status: 0 })));
      component.updateArticlesCentinela();
      expect(component.updateArticleStatus?.message).toContain('Unable to connect');
    });

    it('uses the server error message for status 400 with a message', () => {
      updateCentinelaSpy.searchArticlesCentinela.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'bad' } })),
      );
      component.updateArticlesCentinela();
      expect(component.updateArticleStatus?.message).toBe('bad');
    });

    it('uses error.error.message for status 400 without a top-level message', () => {
      updateCentinelaSpy.searchArticlesCentinela.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'inner' } })),
      );
      component.updateArticlesCentinela();
      expect(component.updateArticleStatus?.message).toBe('inner');
    });

    it('logs and uses statusText for status 405', () => {
      spyOn(console, 'log');
      updateCentinelaSpy.searchArticlesCentinela.and.returnValue(
        throwError(() => ({ status: 405, statusText: 'Method Not Allowed' })),
      );
      component.updateArticlesCentinela();
      expect(component.updateArticleStatus?.message).toBe('Method Not Allowed');
    });

    it('uses error.error.message for any other status', () => {
      updateCentinelaSpy.searchArticlesCentinela.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'server error' } })),
      );
      component.updateArticlesCentinela();
      expect(component.updateArticleStatus?.message).toBe('server error');
    });
  });

  describe('getNoSqlDbYears / getNoSqlInfo', () => {
    it('picks the last year and loads its counts', () => {
      dashboardAdminServiceSpy.getNoSqlDbYears.and.returnValue(
        of([
          { year: 2022, author: 1, article: 1, affiliation: 1, topic: 1 },
          { year: 2023, author: 2, article: 2, affiliation: 2, topic: 2 },
        ]),
      );
      dashboardAdminServiceSpy.getNoSqlDbCounts.and.returnValue(
        of({ author: 99, article: 0, affiliation: 0, topic: 0 }),
      );
      component.getNoSqlDbYears();
      expect(component.lastYearInfoNoSqlDB).toBe(2023);
      expect(dashboardAdminServiceSpy.getNoSqlDbCounts).toHaveBeenCalledWith(2023);
      expect(component.authorsNumberNoSqlDb).toBe(99);
    });
  });

  describe('populateNoSqlDb', () => {
    it('sets the message and clears the error flag on success', () => {
      dashboardAdminServiceSpy.populateNoSqlDb.and.returnValue(
        of({ success: true, message: 'populated' } as any),
      );
      component.populateNoSqlDb();
      expect(component.messageNoSqlDb).toBe('populated');
      expect(component.isErrorUpdatingNoSqlDb).toBeFalse();
      expect(component.populating).toBeFalse();
    });

    it('sets the error message and flag on failure', () => {
      dashboardAdminServiceSpy.populateNoSqlDb.and.returnValue(
        throwError(() => ({ error: { error: 'boom' } })),
      );
      component.populateNoSqlDb();
      expect(component.messageNoSqlDb).toBe('boom');
      expect(component.isErrorUpdatingNoSqlDb).toBeTrue();
    });
  });
});
