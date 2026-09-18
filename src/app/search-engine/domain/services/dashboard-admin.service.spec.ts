import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardAdminService } from './dashboard-admin.service';
import { environment } from 'src/environments/environment';

describe('DashboardAdminService', () => {
  let service: DashboardAdminService;
  let httpMock: HttpTestingController;
  const rootURL = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardAdminService],
    });
    service = TestBed.inject(DashboardAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAuthorComparator GETs the authors-comparator endpoint', () => {
    service.getAuthorComparator().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/information/get_authors_comparator/`).flush({});
  });

  it('getArticlesComparator GETs the articles-comparator endpoint', () => {
    service.getArticlesComparator().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/information/get_articles_comparator/`).flush({});
  });

  it('getmodelCorpusObserver GETs the tfidf corpus endpoint', () => {
    service.getmodelCorpusObserver().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/information/tfidf_model_corpus/`).flush({});
  });

  it('generateCorpus POSTs an empty body', () => {
    service.generateCorpus().subscribe((res) => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${rootURL}/v1/generate-corpus/`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });
  });

  it('generateModel POSTs an empty body', () => {
    service.generateModel().subscribe((res) => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${rootURL}/v1/generate-model/`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });
  });

  it('getNoSqlDbYears GETs the last-years endpoint', () => {
    service.getNoSqlDbYears().subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${rootURL}/v1/dashboard/country/get_last_years/`).flush([]);
  });

  it('getNoSqlDbCounts GETs with a year param', () => {
    service.getNoSqlDbCounts(2020).subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/country/get_acumulated/?year=2020`).flush({});
  });

  it('populateNoSqlDb POSTs an empty body', () => {
    service.populateNoSqlDb().subscribe((res) => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${rootURL}/v1/dashboard/populate`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });
  });

  it('runEtl POSTs to the etl run endpoint', () => {
    service.runEtl().subscribe((res) => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${rootURL}/v1/admin/etl/run/`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });
  });

  it('getEtlStatus GETs the etl run endpoint', () => {
    service.getEtlStatus().subscribe((res) => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${rootURL}/v1/admin/etl/run/`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok' });
  });

  it('getSystemHealth GETs the system-health endpoint', () => {
    service.getSystemHealth().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/information/get_system_health/`).flush({});
  });

  it('getTopAffiliationsYear GETs with a year param', () => {
    service.getTopAffiliationsYear(2020).subscribe((res) => expect(res).toEqual([]));
    httpMock
      .expectOne(`${rootURL}/v1/dashboard/affiliation/get_top_affiliations_year/?year=2020`)
      .flush([]);
  });

  it('getTopicsHeatmap GETs with a year param', () => {
    service.getTopicsHeatmap(2020).subscribe((res) => expect(res).toBeTruthy());
    httpMock
      .expectOne(`${rootURL}/v1/dashboard/affiliation/get_topics_heatmap/?year=2020`)
      .flush({});
  });

  it('getCountryTopics GETs with a number_top param', () => {
    service.getCountryTopics(5).subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${rootURL}/v1/dashboard/country/get_topics/?number_top=5`).flush([]);
  });
});
