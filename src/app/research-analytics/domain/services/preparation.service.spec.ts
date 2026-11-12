import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreparationService } from './preparation.service';
import { PreparationConfiguration } from '../entities/preparation';

describe('PreparationService: relative corpus contracts', () => {
  let service: PreparationService;
  let http: HttpTestingController;
  const configuration: PreparationConfiguration = {
    missing_abstract: 'exclude',
    duplicates: 'keep',
    min_tokens: 5,
    start_year: 2020,
    end_year: 2025,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PreparationService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads aggregate quality and encodes lookup identifiers', () => {
    service.quality().subscribe();
    http.expectOne('/api/analytics/corpus/quality').flush({});
    service.workset('a/b').subscribe();
    http.expectOne('/api/analytics/corpus/worksets/a%2Fb').flush({});
  });

  it('sends only preparation configuration and propagates unavailable storage', () => {
    service.preview(configuration).subscribe();
    const preview = http.expectOne('/api/analytics/corpus/preparation/preview');
    expect(preview.request.method).toBe('POST');
    expect(preview.request.body).toEqual(configuration);
    preview.flush({});
    let status = 0;
    service
      .create(configuration, 'a'.repeat(64))
      .subscribe({ error: (error) => (status = error.status) });
    const create = http.expectOne('/api/analytics/corpus/worksets');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ configuration, expected_workset_id: 'a'.repeat(64) });
    create.flush({}, { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
  });
});
