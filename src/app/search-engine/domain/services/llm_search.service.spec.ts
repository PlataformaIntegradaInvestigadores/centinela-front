import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LLMSearchService } from './llm_search.service';
import { environment } from 'src/environments/environment';

describe('LLMSearchService', () => {
  let service: LLMSearchService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LLMSearchService],
    });
    service = TestBed.inject(LLMSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('semanticSearch defaults topK to 10', () => {
    service.semanticSearch('ai').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v2/search`);
    expect(req.request.body).toEqual({ query: 'ai', page: 1, page_size: 10, filters: {} });
    req.flush({});
  });

  it('semanticSearch respects a custom topK', () => {
    service.semanticSearch('ai', 5).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v2/search`);
    expect(req.request.body.page_size).toBe(5);
    req.flush({});
  });
});
