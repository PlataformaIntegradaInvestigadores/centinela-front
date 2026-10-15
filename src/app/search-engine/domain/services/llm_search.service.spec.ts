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

  it('generateQa posts to v1 llm-search endpoint', () => {
    const docs = [{ scopus_id: '1', title: 'T', abstract: 'A' }];
    service.generateQa('ai', docs).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/llm-search/generate-qa/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      query: 'ai',
      documents: docs,
      use_compression: false,
      use_iterative: true,
    });
    req.flush({ query: 'ai', status: 'success', qa_pairs: [] });
  });

  it('generateQa respects explicit compression and iterative flags', () => {
    service.generateQa('ai', [], { use_compression: true, use_iterative: false }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/v1/llm-search/generate-qa/`);
    expect(req.request.body.use_compression).toBeTrue();
    expect(req.request.body.use_iterative).toBeFalse();
    req.flush({ query: 'ai', status: 'success', qa_pairs: [] });
  });

  it('documentsFromArticles takes top N hits', () => {
    const docs = service.documentsFromArticles(
      [
        { title: 'A', abstract: 'a1', scopus_id: '1' },
        { title: 'B', abstract: 'a2', scopus_id: '2' },
        { title: 'C', abstract: 'a3', scopus_id: '3' },
        { title: 'D', abstract: 'a4', scopus_id: '4' },
      ],
      3,
    );
    expect(docs.length).toBe(3);
    expect(docs[0]).toEqual({ scopus_id: '1', title: 'A', abstract: 'a1' });
  });

  it('documentsFromArticles defaults missing abstracts and tolerates null input', () => {
    expect(service.documentsFromArticles(null as any)).toEqual([]);
    const docs = service.documentsFromArticles(
      [{ title: 'A', scopus_id: '1' } as any],
      1,
    );
    expect(docs[0]).toEqual({ scopus_id: '1', title: 'A', abstract: '' });
  });
});
