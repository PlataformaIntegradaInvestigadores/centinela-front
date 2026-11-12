import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TeamRecommenderService } from './team-recommender.service';
import { environment } from 'src/environments/environment';
import { RecommendResponse } from '../entities/team-recommendation.interface';

describe('TeamRecommenderService', () => {
  let service: TeamRecommenderService;
  let httpMock: HttpTestingController;
  const base = environment.apiRecommender;

  const httpError = (status: number, error: unknown) =>
    new HttpErrorResponse({ status, error, url: `${base}/recommend` });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TeamRecommenderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('uses the relative /api/recommender prefix (same origin, proxied in dev)', () => {
    expect(base).toBe('/api/recommender');
  });

  it('health GETs /health', () => {
    service.health().subscribe((h) => expect(h.status).toBe('ok'));
    httpMock.expectOne(`${base}/health`).flush({ status: 'ok' });
  });

  it('searchAuthors trims the query, sends limit and unwraps results', () => {
    let results: unknown[] = [];
    service.searchAuthors('  carrion ', 5).subscribe((r) => (results = r));
    const req = httpMock.expectOne((r) => r.url === `${base}/authors`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('carrion');
    expect(req.request.params.get('limit')).toBe('5');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ query: 'carrion', count: 1, results: [{ author_id: '1' }] });
    expect(results.length).toBe(1);
  });

  it('searchAuthors defaults limit to 8 and tolerates a missing results array', () => {
    let results: unknown[] | undefined;
    service.searchAuthors('lavoie').subscribe((r) => (results = r));
    const req = httpMock.expectOne((r) => r.url === `${base}/authors`);
    expect(req.request.params.get('limit')).toBe('8');
    req.flush({ query: 'lavoie', count: 0 });
    expect(results).toEqual([]);
  });

  it('recommend POSTs the payload', () => {
    const body = { author_ids: ['1', '2'], top_k: 10, fairness: { enabled: true } };
    let response: RecommendResponse | undefined;
    service.recommend(body).subscribe((r) => (response = r));
    const req = httpMock.expectOne(`${base}/recommend`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ model: 'm', team: [], recommendations: [] });
    expect(response?.model).toBe('m');
  });

  describe('toRecommenderError', () => {
    it('maps network/proxy failures to unavailable', () => {
      for (const status of [0, 502, 503, 504]) {
        expect(service.toRecommenderError(httpError(status, null)).kind).toBe('unavailable');
      }
      const proxy = httpError(
        500,
        'Error occurred while trying to proxy: localhost:4200 ECONNREFUSED',
      );
      expect(service.toRecommenderError(proxy).kind).toBe('unavailable');
    });

    it('maps 404 with unknown ids', () => {
      const err = service.toRecommenderError(
        httpError(404, {
          detail: { message: 'Unknown author_ids', unknown_author_ids: [123, '9'] },
        }),
      );
      expect(err.kind).toBe('unknown_ids');
      expect(err.unknownIds).toEqual(['123', '9']);
      expect(err.message).toContain('123, 9');
    });

    it('maps 422 with string, list or other detail', () => {
      expect(
        service.toRecommenderError(httpError(422, { detail: 'k_candidates' })).message,
      ).toContain('k_candidates');
      const list = service.toRecommenderError(
        httpError(422, { detail: [{ msg: 'too short' }, 'raw'] }),
      );
      expect(list.kind).toBe('invalid');
      expect(list.message).toContain('too short; raw');
      expect(service.toRecommenderError(httpError(422, { detail: 5 })).message).toContain(
        'fuera de rango',
      );
    });

    it('maps other HTTP errors (including a 404 without ids and a plain 500) to unexpected', () => {
      expect(service.toRecommenderError(httpError(404, { detail: 'Not Found' })).kind).toBe(
        'unexpected',
      );
      const plain500 = service.toRecommenderError(httpError(500, 'Internal Server Error'));
      expect(plain500.kind).toBe('unexpected');
      expect(plain500.message).toContain('500');
      expect(service.toRecommenderError(httpError(500, { detail: 'x' })).kind).toBe('unexpected');
    });

    it('maps non-HTTP errors to unexpected', () => {
      expect(service.toRecommenderError(new Error('boom')).kind).toBe('unexpected');
    });
  });
});
