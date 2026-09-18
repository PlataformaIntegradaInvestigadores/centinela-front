import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SuggestionService } from './suggestion.service';
import { environment } from 'src/environments/environment';

describe('SuggestionService', () => {
  let service: SuggestionService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiSearch + '/v1/dashboard/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SuggestionService],
    });
    service = TestBed.inject(SuggestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('searchAffiliations GETs with the query param', () => {
    service.searchAffiliations('espol').subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}affiliation/search/?query=espol`).flush([]);
  });

  it('searchTopics GETs with the query param', () => {
    service.searchTopics('ai').subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}country/search/?query=ai`).flush([]);
  });
});
