import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TopicMapService } from './topic-map.service';

describe('TopicMapService', () => {
  let service: TopicMapService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TopicMapService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends the selected years and threshold without a training request', () => {
    service.map('2016', '2018', 0.3).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/topic-map'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('start_year')).toBe('2016');
    expect(request.request.params.get('end_year')).toBe('2018');
    expect(request.request.params.get('threshold')).toBe('0.3');
    request.flush({});
  });
  it('pins document requests to the release and bounds the page size', () => {
    service.documents({ release_id: 'frozen' } as never, 'topic-1', '', '', 20).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/topic-map/documents'));
    expect(request.request.params.get('release_id')).toBe('frozen');
    expect(request.request.params.get('topic_id')).toBe('topic-1');
    expect(request.request.params.get('offset')).toBe('20');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.has('start_year')).toBeFalse();
    request.flush({ total: 0, items: [] });
  });
});
