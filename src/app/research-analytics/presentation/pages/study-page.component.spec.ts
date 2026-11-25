// Controlled contract fixture for UI behavior, not empirical research evidence.
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { StudyPageComponent } from './study-page.component';
import { StudyService } from '../../domain/services/study.service';
import { ResearchStudy, ExplainedForecast } from '../../domain/entities/study';

function forecast(): ExplainedForecast {
  return {
    topic_id: 'topic-0',
    year: 2022,
    prediction: 12,
    observed: null,
    observed_through: 2021,
    baseline_last_value: 10,
    model_id: 'model-test',
    explanation: {
      method: 'linear_exact',
      features: ['log1p_lag_1'],
      feature_values: [2],
      reference_values: [1],
      contributions: [1],
      base_value: 1,
      output_value: 2,
      additivity_residual: 0,
      output_scale: 'log1p_snapshot_article_count',
    },
  };
}
function study(): ResearchStudy {
  const error = { n: 2, mae: 3, rmse: 4 };
  const paired = {
    ridge: error,
    last_value: { ...error, mae: 1 },
    mae_difference: 2,
    rmse_difference: 0,
  };
  return {
    run_id: 'unit-run',
    status: 'empirical_preliminary_study',
    source_articles: 100,
    source_unchanged: true,
    temporal_mode: 'publication_year_reconstruction_not_historical_index_replay',
    preparation: {
      included: 90,
      input_articles: 100,
      workset_id: 'unit-workset',
      decisions: { included: 90 },
    },
    protocol: {
      start_year: 2000,
      topic_fit_end: 2015,
      validation_end: 2018,
      test_end: 2021,
      rationale: 'Unit test fixture',
    },
    topic_model_id: 'unit-model',
    topics: [{ topic_id: 'topic-0', terms: ['graph', 'networks'], npmi: 0.2 }],
    topic_quality_train: { mean_npmi: 0.2, term_diversity: 0.8 },
    topic_quality_test: { mean_npmi: 0.1, term_diversity: 0.8 },
    series: {
      'topic-0': [
        { year: 2020, count: 8, denominator: 20, share: 0.4, unassigned_documents: 0 },
        { year: 2021, count: 10, denominator: 25, share: 0.4, unassigned_documents: 0 },
      ],
    },
    forecast_comparison: {
      validation: {
        start_year: 2016,
        end_year: 2018,
        overall: paired,
        by_topic: { 'topic-0': paired },
        by_year: { '2018': paired },
      },
      diagnostic: {
        start_year: 2019,
        end_year: 2021,
        overall: paired,
        by_topic: { 'topic-0': paired },
        by_year: { '2021': paired },
      },
      last_observed_year: 2021,
      horizon_years: 1,
      unit: 'articles_per_topic_year',
      diagnostic_scope: 'previously_observed_exploratory',
    },
    prediction: {
      method: 'pooled_ridge_log1p',
      selected_alpha: 1,
      test: { ridge: error, last_value: { ...error, mae: 1 } },
      validation: { ridge: error, last_value: error },
      forecasts: [forecast()],
      test_records: [{ ...forecast(), year: 2021, observed: 10 }],
      global_explanation: {
        features: [{ feature: 'log1p_lag_1', mean_absolute_attribution: 0.5 }],
      },
      fidelity: { value: 0, scope: 'exact' },
      stability: { value: 0.1, n: 2, interpretation: 'Real prefix refits' },
    },
    limitations: ['No human results'],
  };
}

describe('StudyPageComponent', () => {
  let service: jasmine.SpyObj<StudyService>;
  let fixture: ComponentFixture<StudyPageComponent>;
  let query: Record<string, string>;
  beforeEach(async () => {
    query = {};
    service = jasmine.createSpyObj<StudyService>('StudyService', ['load']);
    service.load.and.returnValue(of(study()));
    await TestBed.configureTestingModule({
      declarations: [StudyPageComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: StudyService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            get snapshot() {
              return { queryParamMap: convertToParamMap(query) };
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StudyPageComponent);
  });
  it('renders data, exact explanation scale and a worse-than-reference warning', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.state).toBe('ready');
    expect(fixture.nativeElement.textContent).toContain('Ridge no supera la referencia');
    expect(fixture.nativeElement.textContent).toContain('No es SHAP');
    expect(fixture.nativeElement.textContent).toContain('Tema en diagnóstico');
    expect(fixture.nativeElement.textContent).toContain('Validación 2018');
    expect(fixture.nativeElement.querySelector('svg polyline').getAttribute('points')).toContain(
      ',',
    );
    expect(fixture.componentInstance.forecastLine).toContain(' ');
    expect(fixture.componentInstance.referenceLine).toContain(' ');
    expect(fixture.componentInstance.explained?.year).toBe(2022);
  });
  it('pins the map release and filters displayed years without requesting or moving the forecast', () => {
    query = { release: 'map-release', topic: 'topic-0' };
    fixture.detectChanges();
    expect(service.load).toHaveBeenCalledOnceWith('map-release');
    const page = fixture.componentInstance;
    page.fromYear = 2020;
    page.toYear = 2020;
    page.applyRange();
    expect(page.points.map((p) => p.year)).toEqual([2020]);
    expect(page.visibleForecast).toBeUndefined();
    expect(page.forecast?.observed_through).toBe(2021);
    page.fromYear = 2090;
    page.toYear = 2100;
    page.applyRange();
    fixture.detectChanges();
    expect(page.points).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('no tiene años cubiertos');
    page.toYear = 2000;
    page.applyRange();
    expect(page.rangeError).toBeTruthy();
    page.resetRange();
    expect(page.visibleForecast?.year).toBe(2022);
    expect(service.load.calls.count()).toBe(1);
  });
  it('distinguishes session, permission and unavailable release errors', () => {
    for (const [status, state] of [
      [401, 'unauthorized'],
      [403, 'forbidden'],
      [404, 'unavailable'],
    ] as const) {
      service.load.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      fixture.detectChanges();
      fixture.componentInstance.reload();
      expect(fixture.componentInstance.state).toBe(state);
      expect(fixture.componentInstance.data).toBeNull();
    }
  });
  it('clears old results on failure and recovers by retry', () => {
    fixture.detectChanges();
    service.load.and.returnValue(throwError(() => new Error('unavailable')));
    fixture.componentInstance.reload();
    fixture.detectChanges();
    expect(fixture.componentInstance.data).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    service.load.and.returnValue(of(study()));
    fixture.componentInstance.reload();
    fixture.detectChanges();
    expect(fixture.componentInstance.state).toBe('ready');
  });
  it('cancels stale responses and stops updates when destroyed', () => {
    const first = new Subject<ResearchStudy>();
    const second = new Subject<ResearchStudy>();
    service.load.and.returnValues(first, second);
    fixture.detectChanges();
    fixture.componentInstance.reload();
    first.next(study());
    expect(fixture.componentInstance.data).toBeNull();
    second.next(study());
    expect(fixture.componentInstance.data?.run_id).toBe('unit-run');
    fixture.destroy();
    second.next({ ...study(), run_id: 'late' });
    expect(fixture.componentInstance.data?.run_id).toBe('unit-run');
  });
  it('selects held-out explanations and handles empty topic selection', () => {
    fixture.detectChanges();
    fixture.componentInstance.explanationYear = 2021;
    expect(fixture.componentInstance.explained?.observed).toBe(10);
    fixture.componentInstance.topic = 'absent';
    fixture.componentInstance.changeTopic();
    expect(fixture.componentInstance.points).toEqual([]);
    expect(fixture.componentInstance.forecastLine).toBe('');
    expect(fixture.componentInstance.selectedTerms).toBe('');
  });
});
