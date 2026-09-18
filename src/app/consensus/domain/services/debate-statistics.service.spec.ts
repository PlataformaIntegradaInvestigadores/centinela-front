import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DebateStatisticsService } from './debate-statistics.service';
import { environment } from 'src/environments/environment';

describe('DebateStatisticsService', () => {
  let service: DebateStatisticsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSocial}/v1/debates`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DebateStatisticsService],
    });
    service = TestBed.inject(DebateStatisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStatistics GETs the debate statistics endpoint', () => {
    service.getStatistics(4).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/4/statistics/`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('sendDebateId emits on debateId$', (done) => {
    service.debateId$.subscribe((id) => {
      expect(id).toBe(9);
      done();
    });
    service.sendDebateId(9);
  });
});
