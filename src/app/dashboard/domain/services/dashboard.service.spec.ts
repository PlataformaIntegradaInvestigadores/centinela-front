import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from 'src/environments/environment';
import { Word, YearsResponse } from 'src/app/shared/interfaces/dashboard.interface';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiSearch + '/v1/dashboard';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const words: Word[] = [
    { text: 'AI', size: 10 },
    { text: 'ML', size: 5 },
  ];
  const years: YearsResponse[] = [
    { year: 2020, author: 1, article: 2, affiliation: 3, topic: 4 },
    { year: 2021, author: 5, article: 6, affiliation: 7, topic: 8 },
  ];

  it('getTopicsYear GETs with the year param and getTreeMapInfo maps text/size to name/value', (done) => {
    service.getTreeMapInfo(2020).subscribe((info) => {
      expect(info).toEqual([
        { name: 'AI', value: 10 },
        { name: 'ML', value: 5 },
      ]);
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/country/get_top_topics_year/?year=2020`);
    req.flush(words);
  });

  it('getTreeMapInfoAcumulated maps the accumulated topics', (done) => {
    service.getTreeMapInfoAcumulated(2020).subscribe((info) => {
      expect(info[0]).toEqual({ name: 'AI', value: 10 });
      done();
    });
    httpMock.expectOne(`${apiUrl}/country/get_top_topics?year=2020`).flush(words);
  });

  it('getLineChartInfo wraps years into a single Ecuador series', (done) => {
    service.getLineChartInfo().subscribe((chart) => {
      expect(chart).toEqual([
        {
          name: 'Ecuador',
          series: [
            { name: '2020', value: 2 },
            { name: '2021', value: 6 },
          ],
        },
      ]);
      done();
    });
    httpMock.expectOne(`${apiUrl}/country/get_last_years/`).flush(years);
  });

  it('getCounts GETs the accumulated country counts with the year param', () => {
    service.getCounts(2020).subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/country/get_acumulated/?year=2020`).flush({});
  });

  it('getCountsYear GETs the yearly country counts', () => {
    service.getCountsYear(2020).subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/country/get_year/?year=2020`).flush({});
  });

  it('getYears GETs the last-years endpoint', () => {
    service.getYears().subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}/country/get_last_years/`).flush([]);
  });

  it('getAffiliationInfoAcumulated / getBarInfoAcumulated map affiliation words', (done) => {
    service.getBarInfoAcumulated(2020).subscribe((info) => {
      expect(info).toEqual([
        { name: 'AI', value: 10 },
        { name: 'ML', value: 5 },
      ]);
      done();
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_top_affiliations/?year=2020`).flush(words);
  });

  it('getTopAffiliationsYear / getBarInfoYear map yearly affiliation words', (done) => {
    service.getBarInfoYear(2020).subscribe((info) => {
      expect(info[0]).toEqual({ name: 'AI', value: 10 });
      done();
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_top_affiliations_year/?year=2020`).flush(words);
  });

  it('getTreeMap fetches top-10 topics and maps them', (done) => {
    service.getTreeMap().subscribe((info) => {
      expect(info[0]).toEqual({ name: 'AI', value: 10 });
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/country/get_topics/?number_top=10`);
    req.flush(words);
  });

  it('getBarInfo / getTopAffiliations map global affiliation words', (done) => {
    service.getBarInfo().subscribe((info) => {
      expect(info[0]).toEqual({ name: 'AI', value: 10 });
      done();
    });
    httpMock.expectOne(`${apiUrl}/affiliation/get_affiliations/`).flush(words);
  });

  it('getLineChartInfoYear / getYear map a single-year series', (done) => {
    service.getLineChartInfoYear(2020).subscribe((chart) => {
      expect(chart[0].series).toEqual([{ name: '2020', value: 2 }]);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/country/get_year_info/?year=2020`)
      .flush([years[0]]);
  });

  it('getLineChartInfoRange / getYearsRange map a range series', (done) => {
    service.getLineChartInfoRange(2020).subscribe((chart) => {
      expect(chart[0].series.length).toBe(2);
      done();
    });
    httpMock.expectOne(`${apiUrl}/country/get_range_info/?year=2020`).flush(years);
  });

  it('getProvinces/getProvincesYear/getProvincesAcumulated build plain URL strings', () => {
    expect(service.getProvinces()).toBe(`${apiUrl}/province/get_provinces/`);
    expect(service.getProvincesYear(2020)).toBe(
      `${apiUrl}/province/get_provinces_year/?year=2020`,
    );
    expect(service.getProvincesAcumulated(2020)).toBe(
      `${apiUrl}/province/get_provinces_acumulated/?year=2020`,
    );
  });
});
