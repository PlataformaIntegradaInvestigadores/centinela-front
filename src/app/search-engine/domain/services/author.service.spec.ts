import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthorService } from './author.service';
import { environment } from 'src/environments/environment';
import { AuthorResult } from 'src/app/shared/interfaces/author.interface';

describe('AuthorService', () => {
  let service: AuthorService;
  let httpMock: HttpTestingController;
  const rootURL = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthorService],
    });
    service = TestBed.inject(AuthorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuthorProfile caching', () => {
    it('hits the network once and caches subsequent calls for the same id', () => {
      let first: any;
      let second: any;
      service.getAuthorProfile('42').subscribe((p) => (first = p));
      const req = httpMock.expectOne(`${rootURL}/v2/authors/42/profile`);
      req.flush({ topics: [{ text: 'AI', size: 3 }] });

      service.getAuthorProfile('42').subscribe((p) => (second = p));
      httpMock.expectNone(`${rootURL}/v2/authors/42/profile`);

      expect(first).toBe(second);
    });

    it('issues a separate request for a different id', () => {
      service.getAuthorProfile('1').subscribe((p) => expect(p).toBeTruthy());
      httpMock.expectOne(`${rootURL}/v2/authors/1/profile`).flush({});

      service.getAuthorProfile('2').subscribe((p) => expect(p).toBeTruthy());
      httpMock.expectOne(`${rootURL}/v2/authors/2/profile`).flush({});
    });
  });

  it('getAuthorsByQuery defaults page/page_size and maps topics', (done) => {
    service.getAuthorsByQuery('ai').subscribe((res) => {
      expect(res.data[0].topics.length).toBe(11); // 10 kept + '...'
      expect(res.total).toBe(1);
      done();
    });

    const req = httpMock.expectOne(`${rootURL}/v2/authors/search`);
    expect(req.request.body).toEqual({ query: 'ai', page: 1, page_size: 10 });
    req.flush({
      data: [{ topics: Array.from({ length: 15 }, (_, i) => `t${i}`) } as unknown as AuthorResult],
      total: 1,
    });
  });

  it('getAuthorsByQuery uses the given page/page_size when provided', () => {
    service.getAuthorsByQuery('ai', 3, 25).subscribe();
    const req = httpMock.expectOne(`${rootURL}/v2/authors/search`);
    expect(req.request.body).toEqual({ query: 'ai', page: 3, page_size: 25 });
    req.flush({ data: [], total: 0 });
  });

  it('getAuthorById GETs the author endpoint', () => {
    service.getAuthorById('a-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v2/authors/a-1`).flush({});
  });

  it('getCoauthorsById derives coauthors from the composed profile', (done) => {
    service.getCoauthorsById('5').subscribe((coauthors) => {
      expect(coauthors).toEqual({ items: [] } as any);
      done();
    });
    httpMock
      .expectOne(`${rootURL}/v2/authors/5/profile`)
      .flush({ coauthors: { items: [] } });
  });

  describe('getMostRelevantAuthors', () => {
    it('omits filters when neither typeFilter nor affiliations are given', () => {
      service.getMostRelevantAuthors('ai', 5).subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/authors/relevant`);
      expect(req.request.body.filters).toBeUndefined();
      req.flush({});
    });

    it('includes filters when typeFilter or affiliations are given', () => {
      service.getMostRelevantAuthors('ai', 5, 'strict', ['espol']).subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/authors/relevant`);
      expect(req.request.body.filters).toEqual({ mode: 'strict', affiliations: ['espol'] });
      req.flush({});
    });

    it('omits filters when affiliations is given but empty', () => {
      service.getMostRelevantAuthors('ai', 5, undefined, []).subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/authors/relevant`);
      expect(req.request.body.filters).toBeUndefined();
      req.flush({});
    });

    it('defaults affiliations to [] when only typeFilter is given', () => {
      service.getMostRelevantAuthors('ai', 5, 'strict').subscribe();
      const req = httpMock.expectOne(`${rootURL}/v2/authors/relevant`);
      expect(req.request.body.filters).toEqual({ mode: 'strict', affiliations: [] });
      req.flush({});
    });
  });

  describe('mapAuthorTopics', () => {
    it('truncates to 10 topics and appends an ellipsis marker when over 10', () => {
      const author = { topics: Array.from({ length: 15 }, (_, i) => `t${i}`) } as unknown as AuthorResult;
      const result = service.mapAuthorTopics(author);
      expect(result.topics.length).toBe(11);
      expect(result.topics[10]).toBe('...');
    });

    it('leaves topics untouched when 10 or fewer', () => {
      const author = { topics: ['a', 'b'] } as unknown as AuthorResult;
      const result = service.mapAuthorTopics(author);
      expect(result.topics).toEqual(['a', 'b']);
    });
  });

  it('getRandomTopics GETs the random-topics endpoint', () => {
    service.getRandomTopics().subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${rootURL}random-topics`).flush([]);
  });

  it('getTopicsById maps profile topics to name/value', (done) => {
    service.getTopicsById(9).subscribe((topics) => {
      expect(topics).toEqual([{ name: 'AI', value: 3 }]);
      done();
    });
    httpMock
      .expectOne(`${rootURL}/v2/authors/9/profile`)
      .flush({ topics: [{ text: 'AI', size: 3 }] });
  });

  it('getTopicsById defaults to [] when the profile has no topics', (done) => {
    service.getTopicsById(9).subscribe((topics) => {
      expect(topics).toEqual([]);
      done();
    });
    httpMock.expectOne(`${rootURL}/v2/authors/9/profile`).flush({});
  });

  it('getYears derives years from the composed profile', (done) => {
    service.getYears('9').subscribe((years) => {
      expect(years).toEqual([{ year: 2020, total_articles: 3 } as any]);
      done();
    });
    httpMock
      .expectOne(`${rootURL}/v2/authors/9/profile`)
      .flush({ years: [{ year: 2020, total_articles: 3 }] });
  });

  it('getYears defaults to [] when the profile has no years', (done) => {
    service.getYears('9').subscribe((years) => {
      expect(years).toEqual([]);
      done();
    });
    httpMock.expectOne(`${rootURL}/v2/authors/9/profile`).flush({});
  });

  it('getLineChartInfo wraps years into a named series', (done) => {
    service.getLineChartInfo('9', 'Ada Lovelace').subscribe((chart) => {
      expect(chart).toEqual([
        { name: 'Ada Lovelace', series: [{ name: '2020', value: 3 }] },
      ]);
      done();
    });
    httpMock
      .expectOne(`${rootURL}/v2/authors/9/profile`)
      .flush({ years: [{ year: 2020, total_articles: 3 }] });
  });

  it('getArticles GETs with the author_id param', () => {
    service.getArticles('9').subscribe();
    const req = httpMock.expectOne(`${rootURL}/v2/articles/by-author?author_id=9`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
