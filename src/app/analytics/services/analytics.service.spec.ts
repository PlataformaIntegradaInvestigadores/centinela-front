import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import { environment } from 'src/environments/environment';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AnalyticsService],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAffiliations', () => {
    it('GETs the affiliations endpoint', () => {
      service.getAffiliations().subscribe((res) => {
        expect(res.affiliations).toEqual(['A', 'B']);
      });
      const req = httpMock.expectOne(`${environment.apiPredictive}/affiliations`);
      expect(req.request.method).toBe('GET');
      req.flush({ affiliations: ['A', 'B'] });
    });
  });

  describe('getProjection', () => {
    it('GETs projection without hypothetical_authors when not provided', () => {
      service.getProjection('UNAL', 3).subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiPredictive}/projection/UNAL` &&
          !r.params.has('hypothetical_authors') &&
          r.params.get('projection_years') === '3',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ affiliation_name: 'UNAL', data: [] });
    });

    it('GETs projection with hypothetical_authors when provided', () => {
      service.getProjection('UNAL', 3, 12).subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiPredictive}/projection/UNAL` &&
          r.params.get('hypothetical_authors') === '12' &&
          r.params.get('projection_years') === '3',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ affiliation_name: 'UNAL', data: [] });
    });

    it('omits hypothetical_authors when it is null', () => {
      service.getProjection('UNAL', 3, null as any).subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiPredictive}/projection/UNAL` &&
          !r.params.has('hypothetical_authors'),
      );
      expect(req.request.method).toBe('GET');
      req.flush({ affiliation_name: 'UNAL', data: [] });
    });
  });

  describe('getComparison', () => {
    it('POSTs the comparison with query param and body', () => {
      const names = ['A', 'B'];
      service.getComparison(names, 5).subscribe((res) => {
        expect(res.results.length).toBe(0);
      });
      const req = httpMock.expectOne(
        `${environment.apiPredictive}/projection/compare?projection_years=5`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ affiliation_names: names });
      req.flush({ results: [] });
    });
  });

  describe('getRanking', () => {
    it('GETs the ranking endpoint', () => {
      service.getRanking().subscribe((res) => {
        expect(res.ranking).toEqual([]);
      });
      const req = httpMock.expectOne(`${environment.apiPredictive}/ranking`);
      expect(req.request.method).toBe('GET');
      req.flush({ ranking: [] });
    });
  });

  describe('getModelDetails', () => {
    it('GETs the model-details endpoint', () => {
      service.getModelDetails().subscribe((res) => {
        expect(res.model_type).toBe('lightgbm');
      });
      const req = httpMock.expectOne(`${environment.apiPredictive}/model-details`);
      expect(req.request.method).toBe('GET');
      req.flush({
        model_type: 'lightgbm',
        training_data_range: '2020-2024',
        target_variable: 'publications',
        total_affiliations: 10,
        performance_metrics: { mae: 1, rmse: 2 },
        feature_importances: {},
      });
    });
  });
});
