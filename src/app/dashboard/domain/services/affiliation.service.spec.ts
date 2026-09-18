import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AffiliationService } from './affiliation.service';
import { environment } from 'src/environments/environment';
import { Affiliation, Word } from 'src/app/shared/interfaces/dashboard.interface';

describe('AffiliationService', () => {
  let service: AffiliationService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiSearch + '/v1/dashboard';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AffiliationService],
    });
    service = TestBed.inject(AffiliationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOptionYears GETs with the scopus_id param', () => {
    service.getOptionYears('sc-1').subscribe((years) => {
      expect(years).toEqual([]);
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_years/?scopus_id=sc-1`).flush([]);
  });

  it('getSummary GETs the articles/topics summary', () => {
    service.getSummary('sc-1').subscribe((summary) => {
      expect(summary).toEqual({ articles: 1, topics: 2 } as any);
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_articles_topics/?scopus_id=sc-1`)
      .flush({ articles: 1, topics: 2 });
  });

  it('getSummaryYear GETs the yearly summary', () => {
    service.getSummaryYear('sc-1', 2020).subscribe((summary) => {
      expect(summary).toEqual({ articles: 1, topics: 2 } as any);
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_articles_topics_year/?scopus_id=sc-1&year=2020`)
      .flush({ articles: 1, topics: 2 });
  });

  it('getSummaryAcumulated GETs the accumulated summary', () => {
    service.getSummaryAcumulated('sc-1', 2020).subscribe((summary) => {
      expect(summary).toEqual({ articles: 1, topics: 2 } as any);
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_articles_topics_acumulated/?scopus_id=sc-1&year=2020`)
      .flush({ articles: 1, topics: 2 });
  });

  const affiliations: Affiliation[] = [
    { id: '1', scopus_id: 1, name: 'ESPOL', year: 2020, total_articles: 5 },
    { id: '2', scopus_id: 1, name: 'ESPOL', year: 2021, total_articles: 9 },
  ];

  it('getLineChartAffiliationInfo maps years into a named series', (done) => {
    service.getLineChartAffiliationInfo('sc-1').subscribe((chart) => {
      expect(chart).toEqual([
        {
          name: 'ESPOL',
          series: [
            { name: '2020', value: 5 },
            { name: '2021', value: 9 },
          ],
        },
      ]);
      done();
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_affiliation_years/?scopus_id=sc-1`).flush(affiliations);
  });

  it('getLineChartAffiliationYear maps a single-year series', (done) => {
    service.getLineChartAffiliationYear('sc-1', 2020).subscribe((chart) => {
      expect(chart[0].name).toBe('ESPOL');
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_year/?scopus_id=sc-1&year=2020`)
      .flush([affiliations[0]]);
  });

  it('getLineChartAffiliationRange maps a range series', (done) => {
    service.getLineChartAffiliationRange('sc-1', 2020).subscribe((chart) => {
      expect(chart[0].series.length).toBe(2);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_year_range/?scopus_id=sc-1&year=2020`)
      .flush(affiliations);
  });

  const words: Word[] = [{ text: 'AI', size: 3 }];

  it('getTreeMapInfo maps affiliation topics to name/value', (done) => {
    service.getTreeMapInfo('sc-1').subscribe((info) => {
      expect(info).toEqual([{ name: 'AI', value: 3 }]);
      done();
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_affiliation_topics/?scopus_id=sc-1`).flush(words);
  });

  it('getTreeMapAcumulated maps accumulated topics', (done) => {
    service.getTreeMapAcumulated('sc-1', 2020).subscribe((info) => {
      expect(info).toEqual([{ name: 'AI', value: 3 }]);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_topics_acumulated/?scopus_id=sc-1&year=2020`)
      .flush(words);
  });

  it('getTreeMapYear maps yearly topics', (done) => {
    service.getTreeMapYear('sc-1', 2020).subscribe((info) => {
      expect(info).toEqual([{ name: 'AI', value: 3 }]);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/affiliation/get_topics_year/?scopus_id=sc-1&year=2020`)
      .flush(words);
  });

  it('getId GETs the affiliation lookup-by-name endpoint', () => {
    service.getId('ESPOL').subscribe((res) => {
      expect(res).toEqual({ scopus_id: 'sc-1' } as any);
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_by_name/?name=ESPOL`).flush({ scopus_id: 'sc-1' });
  });
});
