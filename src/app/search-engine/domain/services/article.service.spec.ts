import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ArticleService } from './article.service';
import { environment } from 'src/environments/environment';

describe('ArticleService', () => {
  let service: ArticleService;
  let httpMock: HttpTestingController;
  const rootURL = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ArticleService],
    });
    service = TestBed.inject(ArticleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getArticleById GETs the article endpoint', () => {
    service.getArticleById('a-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v2/articles/a-1`).flush({});
  });

  it('getSearchFilters GETs the filters endpoint', () => {
    service.getSearchFilters().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v2/search/filters`).flush({});
  });

  describe('getMostRelevantArticlesByQuery', () => {
    it('omits filters when no years are given', () => {
      service.getMostRelevantArticlesByQuery('ai', 1, 10).subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/articles/relevant`);
      expect(req.request.body).toEqual({ query: 'ai', page: 1, page_size: 10 });
      req.flush({});
    });

    it('includes a years filter when provided', () => {
      service.getMostRelevantArticlesByQuery('ai', 1, 10, [2020, 2021]).subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/articles/relevant`);
      expect(req.request.body.filters).toEqual({ years: [2020, 2021] });
      req.flush({});
    });

    it('omits filters when years is an empty array', () => {
      service.getMostRelevantArticlesByQuery('ai', 1, 10, []).subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/articles/relevant`);
      expect(req.request.body.filters).toBeUndefined();
      req.flush({});
    });
  });

  it('getArticlesByAuthor GETs with the author_id query param', () => {
    service.getArticlesByAuthor('a-1').subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${rootURL}/v2/articles/by-author?author_id=a-1`).flush([]);
  });
});
