import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CorpusService } from './corpus.service';
import { environment } from 'src/environments/environment';

describe('CorpusService: local analytical contracts', () => {
  let service: CorpusService;
  let http: HttpTestingController;
  const base = environment.apiAnalytics;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CorpusService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the relative gateway prefix for summary and descriptors', () => {
    expect(base).toBe('/api/analytics');
    service.summary().subscribe();
    http.expectOne(`${base}/corpus/summary`).flush({});
    service.descriptors().subscribe();
    const descriptors = http.expectOne((request) => request.url === `${base}/corpus/descriptors`);
    expect(descriptors.request.params.get('limit')).toBe('10');
    descriptors.flush({});
  });

  it('preserves false and zero and encodes filter values', () => {
    service
      .articles({
        limit: 20,
        offset: 0,
        has_abstract: false,
        year: 2024,
        author: 'author & another',
        descriptor: 'AI / NLP',
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === `${base}/corpus/articles`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('offset')).toBe('0');
    expect(request.request.params.get('has_abstract')).toBe('false');
    expect(request.request.params.get('year')).toBe('2024');
    expect(request.request.params.get('author')).toBe('author & another');
    expect(request.request.params.get('descriptor')).toBe('AI / NLP');
    request.flush({ items: [], total: 0 });
  });

  it('omits absent or empty optional filters', () => {
    service.articles({ limit: 20, offset: 0, author: '' }).subscribe();
    const request = http.expectOne((r) => r.url === `${base}/corpus/articles`);
    expect(request.request.params.keys()).toEqual(['limit', 'offset']);
    request.flush({});
  });

  it('encodes document identifiers and propagates HTTP failure', () => {
    let status = 0;
    service.article('synthetic/id').subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne(`${base}/corpus/articles/synthetic%2Fid`)
      .flush({}, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});
