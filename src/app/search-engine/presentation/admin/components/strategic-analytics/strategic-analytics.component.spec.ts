import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { StrategicAnalyticsComponent } from './strategic-analytics.component';
import { DashboardAdminService } from 'src/app/search-engine/domain/services/dashboard-admin.service';
import {
  EtlStatusResponse,
  HeatmapResponse,
  SystemHealth,
  YearsResponse,
} from 'src/app/shared/interfaces/dashboard.interface';

describe('StrategicAnalyticsComponent', () => {
  let component: StrategicAnalyticsComponent;
  let serviceSpy: jasmine.SpyObj<DashboardAdminService>;

  const health: SystemHealth = {
    authors_no_updated: 2,
    total_authors: 100,
    articles_pending: 3,
    stale_collections: 1,
    stale_collection_names: ['articles'],
  };
  const etl: EtlStatusResponse = {
    status: 'idle',
    message: '',
    last_run_at: '2024-01-01T00:00:00Z',
    last_run_status: 'success',
  };
  const years: YearsResponse[] = [
    { year: 2022, author: 1, article: 10, affiliation: 2, topic: 3 },
    { year: 2023, author: 2, article: 20, affiliation: 3, topic: 4 },
  ];
  const heatmap: HeatmapResponse = {
    affiliations: [{ scopus_id: 1, name: 'U1', total_articles: 5 }],
    topics: ['AI', 'ML'],
    cells: [{ scopus_id: 1, topic_name: 'AI', total_articles: 5 }],
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('DashboardAdminService', [
      'runEtl',
      'getEtlStatus',
      'getSystemHealth',
      'getNoSqlDbCounts',
      'getNoSqlDbYears',
      'getTopAffiliationsYear',
      'getTopicsHeatmap',
      'getCountryTopics',
    ]);
    serviceSpy.getNoSqlDbYears.and.returnValue(of(years));
    serviceSpy.getNoSqlDbCounts.and.returnValue(
      of({ author: 1, article: 2, affiliation: 3, topic: 4 }),
    );
    serviceSpy.getTopAffiliationsYear.and.returnValue(of([]));
    serviceSpy.getTopicsHeatmap.and.returnValue(of(heatmap));
    serviceSpy.getCountryTopics.and.returnValue(of([{ text: 'AI', size: 5 }]));
    serviceSpy.getSystemHealth.and.returnValue(of(health));
    serviceSpy.getEtlStatus.and.returnValue(of(etl));

    TestBed.configureTestingModule({
      declarations: [StrategicAnalyticsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: DashboardAdminService, useValue: serviceSpy }],
    });
    component = TestBed.createComponent(StrategicAnalyticsComponent).componentInstance;
  });

  afterEach(() => {
    if (jasmine.clock) {
      try {
        jasmine.clock().uninstall();
      } catch {
        // clock was never installed for this test
      }
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads years/kpis/top affiliations/heatmap/treemap/system warnings', () => {
      component.ngOnInit();
      expect(component.availableYears).toEqual([2022, 2023]);
      expect(component.selectedYear).toBe(2023);
      expect(component.kpis.total_authors).toBe(1);
      expect(component.topicsChartData).toEqual([{ name: 'AI', value: 5 }]);
      expect(component.topicsColorsCharged).toBeTrue();
      expect(component.systemWarnings.length).toBe(4);
      expect(component.articlesEvolution.length).toBe(2);
    });

    it('does not select a year when none are available', () => {
      serviceSpy.getNoSqlDbYears.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.selectedYear).toBe(0);
      expect(serviceSpy.getNoSqlDbCounts).not.toHaveBeenCalled();
    });

    it('logs on a years-load failure', () => {
      spyOn(console, 'error');
      serviceSpy.getNoSqlDbYears.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(console.error).toHaveBeenCalled();
    });

    it('logs on a system-warnings load failure', () => {
      spyOn(console, 'error');
      serviceSpy.getSystemHealth.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('buildSystemWarnings (via loadSystemWarnings)', () => {
    it('flags ok/warn levels correctly for a healthy system', () => {
      serviceSpy.getSystemHealth.and.returnValue(
        of({
          authors_no_updated: 0,
          total_authors: 10,
          articles_pending: 0,
          stale_collections: 0,
          stale_collection_names: [],
        }),
      );
      component.ngOnInit();
      expect(component.systemWarnings.every((w) => w.level === 'ok')).toBeTrue();
    });

    it('flags an error level for a failed last ETL run', () => {
      serviceSpy.getEtlStatus.and.returnValue(of({ ...etl, last_run_status: 'error' }));
      component.ngOnInit();
      const lastRun = component.systemWarnings.find((w) => w.title === 'Última ejecución ETL');
      expect(lastRun?.level).toBe('error');
    });

    it('shows "Sin ejecuciones" when there is no last_run_at', () => {
      serviceSpy.getEtlStatus.and.returnValue(of({ ...etl, last_run_at: null }));
      component.ngOnInit();
      const lastRun = component.systemWarnings.find((w) => w.title === 'Última ejecución ETL');
      expect(lastRun?.value).toBe('Sin ejecuciones');
    });
  });

  describe('runEtl / ETL polling', () => {
    beforeEach(() => jasmine.clock().install());

    it('does nothing while already processing', () => {
      component.etlStatus = 'processing';
      component.runEtl();
      expect(serviceSpy.runEtl).not.toHaveBeenCalled();
    });

    it('starts processing and polls until idle, then marks completed', () => {
      serviceSpy.runEtl.and.returnValue(of({ ...etl, message: 'started' }));
      component.runEtl();
      expect(component.etlStatus).toBe('processing');
      expect(component.etlMessage).toBe('started');
      expect(component.etlLoading).toBeTrue();

      jasmine.clock().tick(15_001);

      expect(component.etlStatus).toBe('completed');
      expect(serviceSpy.getSystemHealth).toHaveBeenCalled();
    });

    it('treats a 409 as already-running and starts polling', () => {
      serviceSpy.runEtl.and.returnValue(throwError(() => ({ status: 409 })));
      component.runEtl();
      expect(component.etlStatus).toBe('processing');
      expect(component.etlMessage).toContain('ya en ejecución');
    });

    it('sets an error state and auto-clears after a non-409 failure', () => {
      serviceSpy.runEtl.and.returnValue(throwError(() => ({ status: 500 })));
      component.runEtl();
      expect(component.etlStatus).toBe('error');

      jasmine.clock().tick(5001);

      expect(component.etlStatus).toBe('idle');
      expect(component.etlMessage).toBe('');
    });

    it('stops polling and errors out after repeated poll failures', () => {
      serviceSpy.runEtl.and.returnValue(of(etl));
      serviceSpy.getEtlStatus.and.returnValue(throwError(() => new Error('boom')));
      component.runEtl();

      jasmine.clock().tick(15_000 * 4 + 1);

      expect(component.etlStatus).toBe('error');
    });
  });

  describe('ngOnDestroy', () => {
    it('stops polling', () => {
      jasmine.clock().install();
      serviceSpy.runEtl.and.returnValue(of(etl));
      component.runEtl();
      component.ngOnDestroy();
      // Advancing the clock after destroy must not trigger further polling.
      const callsBefore = serviceSpy.getEtlStatus.calls.count();
      jasmine.clock().tick(60_000);
      expect(serviceSpy.getEtlStatus.calls.count()).toBe(callsBefore);
    });
  });

  describe('onYearChange', () => {
    it('reloads kpis and top affiliations for the new year', () => {
      component.onYearChange(2020);
      expect(component.selectedYear).toBe(2020);
      expect(serviceSpy.getNoSqlDbCounts).toHaveBeenCalledWith(2020);
      expect(serviceSpy.getTopAffiliationsYear).toHaveBeenCalledWith(2020);
    });
  });

  describe('loadTop10Affiliations (via onYearChange)', () => {
    it('maps, sorts, and slices to the top 10', () => {
      const words = Array.from({ length: 12 }, (_, i) => ({ text: `U${i}`, size: i }));
      serviceSpy.getTopAffiliationsYear.and.returnValue(of(words));
      component.onYearChange(2023);
      expect(component.top10Affiliations.length).toBe(10);
      expect(component.top10Affiliations[0].total_articles).toBe(11);
      expect(component.maxAffiliationArticles).toBe(11);
    });

    it('logs on a top-affiliations load failure', () => {
      spyOn(console, 'error');
      serviceSpy.getTopAffiliationsYear.and.returnValue(throwError(() => new Error('boom')));
      component.onYearChange(2023);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onHeatmapYearChange / loadHeatmap', () => {
    it('builds sorted universities/topics and the max cell value', () => {
      component.onHeatmapYearChange(2023);
      expect(component.heatmapYear).toBe(2023);
      expect(component.sortedUniversities[0].name).toBe('U1');
      expect(component.sortedTopics).toContain('AI');
      expect(component.heatmapMaxValue).toBe(5);
    });

    it('logs on a heatmap load failure', () => {
      spyOn(console, 'error');
      serviceSpy.getTopicsHeatmap.and.returnValue(throwError(() => new Error('boom')));
      component.onHeatmapYearChange(2023);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getCellColor / getCellTextColor', () => {
    beforeEach(() => component.onHeatmapYearChange(2023));

    it('returns a neutral color for an undefined/zero value', () => {
      expect(component.getCellColor(undefined)).toBe('rgb(243,244,246)');
      expect(component.getCellTextColor(undefined)).toBe('#374151');
    });

    it('returns a computed color for a positive value', () => {
      expect(component.getCellColor(5)).toMatch(/^rgb\(/);
    });

    it('returns white text above the 0.55 intensity threshold', () => {
      expect(component.getCellTextColor(5)).toBe('#ffffff');
    });
  });

  describe('openTopicDrilldown / closeDrilldown', () => {
    beforeEach(() => component.onHeatmapYearChange(2023));

    it('opens the modal with sorted universities for the topic', () => {
      component.openTopicDrilldown('AI');
      expect(component.showDrilldownModal).toBeTrue();
      expect(component.selectedTopic).toBe('AI');
      expect(component.drilldownUniversities[0].total_articles).toBe(5);
      expect(component.drilldownMax).toBe(5);
    });

    it('closeDrilldown hides the modal and clears the topic', () => {
      component.showDrilldownModal = true;
      component.selectedTopic = 'AI';
      component.closeDrilldown();
      expect(component.showDrilldownModal).toBeFalse();
      expect(component.selectedTopic).toBe('');
    });
  });

  describe('chartWidth', () => {
    it('reserves sidebar space on wide viewports', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1400);
      expect(component.chartWidth).toBe(1400 - 320 - 80);
    });

    it('uses full width minus margin on narrow viewports, with a floor of 400', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(500);
      expect(component.chartWidth).toBe(500 - 80);
    });
  });
});
