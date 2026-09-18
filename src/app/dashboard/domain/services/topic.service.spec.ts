import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TopicService } from './topic.service';
import { environment } from 'src/environments/environment';
import { TopicResponse, Word } from 'src/app/shared/interfaces/dashboard.interface';

describe('TopicService (dashboard)', () => {
  let service: TopicService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiSearch + '/v1/dashboard';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TopicService],
    });
    service = TestBed.inject(TopicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOptionYears GETs with the topic param', () => {
    service.getOptionYears('ai').subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}/country/get_topics_years/?topic=ai`).flush([]);
  });

  it('getSummary GETs the topic summary', () => {
    service.getSummary('ai').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/country/get_topics_summary/?topic=ai`).flush({});
  });

  it('getSummaryYear GETs the yearly topic summary', () => {
    service.getSummaryYear('ai', 2020).subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/country/get_topics_summary_year/?topic=ai&year=2020`).flush({});
  });

  it('getSummaryAcumulated GETs the accumulated topic summary', () => {
    service.getSummaryAcumulated('ai', 2020).subscribe((res) => expect(res).toBeTruthy());
    httpMock
      .expectOne(`${apiUrl}/country/get_topics_summary_acumulated/?topic=ai&year=2020`)
      .flush({});
  });

  const responses: TopicResponse[] = [
    { id: '1', topic_name: 'AI', year: 2020, total_articles: 3 },
    { id: '2', topic_name: 'AI', year: 2021, total_articles: 8 },
  ];

  it('getLineChartTopicInfo maps years into a named series', (done) => {
    service.getLineChartTopicInfo('ai').subscribe((chart) => {
      expect(chart).toEqual([
        {
          name: 'AI',
          series: [
            { name: '2020', value: 3 },
            { name: '2021', value: 8 },
          ],
        },
      ]);
      done();
    });
    httpMock.expectOne(`${apiUrl}/country/get_topics_year_info/?topic=ai`).flush(responses);
  });

  it('getLineChartAffiliationYear maps a single-year series', (done) => {
    service.getLineChartAffiliationYear('ai', 2020).subscribe((chart) => {
      expect(chart[0].name).toBe('AI');
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/country/get_topics_year/?topic=ai&year=2020`)
      .flush([responses[0]]);
  });

  it('getLineChartAffiliationRange maps a range series', (done) => {
    service.getLineChartAffiliationRange('ai', 2020).subscribe((chart) => {
      expect(chart[0].series.length).toBe(2);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/country/get_topics_range_year/?topic=ai&year=2020`)
      .flush(responses);
  });

  const words: Word[] = [{ text: 'ESPOL', size: 4 }];

  it('getBarMapInfo maps topic affiliations to name/value', (done) => {
    service.getBarMapInfo('ai').subscribe((info) => {
      expect(info).toEqual([{ name: 'ESPOL', value: 4 }]);
      done();
    });
    httpMock.expectOne(`${apiUrl}/country/get_topics_affiliations/?topic=ai`).flush(words);
  });

  it('getBarMapAcumulated maps accumulated affiliations', (done) => {
    service.getBarMapAcumulated('ai', 2020).subscribe((info) => {
      expect(info).toEqual([{ name: 'ESPOL', value: 4 }]);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/country/get_topics_affiliations_acumulated/?topic=ai&year=2020`)
      .flush(words);
  });

  it('getBarMapYear maps yearly affiliations', (done) => {
    service.getBarMapYear('ai', 2020).subscribe((info) => {
      expect(info).toEqual([{ name: 'ESPOL', value: 4 }]);
      done();
    });
    httpMock
      .expectOne(`${apiUrl}/country/get_topics_affiliations_year/?topic=ai&year=2020`)
      .flush(words);
  });
});
