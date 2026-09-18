import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SummaryService } from './summary.service';
import { environment } from 'src/environments/environment';

describe('SummaryService', () => {
  let service: SummaryService;
  let httpMock: HttpTestingController;
  const rootURL = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SummaryService],
    });
    service = TestBed.inject(SummaryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSummary GETs the summary endpoint', () => {
    service.getSummary().subscribe((res) => {
      expect(res).toEqual({ total_articles: 5 } as any);
    });
    httpMock.expectOne(`${rootURL}/v1/summary/`).flush({ total_articles: 5 });
  });
});
