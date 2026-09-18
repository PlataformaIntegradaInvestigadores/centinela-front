import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecommendationService } from './recommendation.service';
import { environment } from 'src/environments/environment';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiPredictive}/recommendations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecommendationService],
    });
    service = TestBed.inject(RecommendationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getHealth GETs the health endpoint', () => {
    service.getHealth().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}/health`).flush({});
  });

  it('getGroups defaults k and limit', () => {
    service.getGroups().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/groups`);
    expect(req.request.params.get('k')).toBe('10');
    expect(req.request.params.get('limit')).toBe('50');
    req.flush({});
  });

  it('getGroups respects custom k/limit', () => {
    service.getGroups(3, 5).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/groups`);
    expect(req.request.params.get('k')).toBe('3');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({});
  });

  it('getGroupRecommendations GETs a specific group with a k param', () => {
    service.getGroupRecommendations(7, 2).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/group/7`);
    expect(req.request.params.get('k')).toBe('2');
    req.flush({});
  });

  it('getMetrics defaults k to 10', () => {
    service.getMetrics().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/metrics`);
    expect(req.request.params.get('k')).toBe('10');
    req.flush({});
  });
});
