import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UpdateCentinelaService } from './update-centinela.service';
import { environment } from 'src/environments/environment';

describe('UpdateCentinelaService', () => {
  let service: UpdateCentinelaService;
  let httpMock: HttpTestingController;
  const rootURL = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UpdateCentinelaService],
    });
    service = TestBed.inject(UpdateCentinelaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updateAuthorsCentinela POSTs an empty body', () => {
    service.updateAuthorsCentinela().subscribe((res) => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${rootURL}/v1/information/update/author-information/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ status: 'ok' });
  });

  it('searchArticlesCentinela GETs the scopus-integration endpoint', () => {
    service.searchArticlesCentinela().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/scopus-integration/`).flush({ status: 'ok' });
  });
});
