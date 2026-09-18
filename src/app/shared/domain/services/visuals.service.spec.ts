import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VisualsService } from './visuals.service';
import { environment } from 'src/environments/environment';

describe('VisualsService', () => {
  let service: VisualsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSearch}/v1/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VisualsService],
    });
    service = TestBed.inject(VisualsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getCounts includes a year param when provided', () => {
    service.getCounts(2022).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${apiUrl}/country/get_acumulated/`,
    );
    expect(req.request.params.get('year')).toBe('2022');
    req.flush({});
  });

  it('getCounts omits the year param when not provided', () => {
    service.getCounts().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/country/get_acumulated/`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('getTopics GETs with the number_top param', () => {
    service.getTopics(5).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/country/get_topics/`);
    expect(req.request.params.get('number_top')).toBe('5');
    req.flush([]);
  });

  it('getProvinces GETs the provinces endpoint', () => {
    service.getProvinces().subscribe();
    httpMock.expectOne(`${apiUrl}/province/get_provinces/`).flush([]);
  });

  it('createColorScheme builds a color per item', () => {
    const scheme = service.createColorScheme(3);
    expect(scheme.domain.length).toBe(3);
    expect(scheme.name).toBe('custom');
  });

  it('createColorScheme handles zero items', () => {
    const scheme = service.createColorScheme(0);
    expect(scheme.domain).toEqual([]);
  });
});
