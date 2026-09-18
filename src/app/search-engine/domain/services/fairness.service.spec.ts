import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FairnessService } from './fairness.service';
import { environment } from 'src/environments/environment';

describe('FairnessService', () => {
  let service: FairnessService;
  let httpMock: HttpTestingController;
  const rootURL = environment.apiSearch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FairnessService],
    });
    service = TestBed.inject(FairnessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSummary GETs the summary endpoint', () => {
    service.getSummary().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/fairness/summary/`).flush({});
  });

  it('getBaseline GETs the baseline endpoint', () => {
    service.getBaseline().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/fairness/baseline/`).flush({});
  });

  it('getMitigation GETs the mitigation endpoint', () => {
    service.getMitigation().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/fairness/mitigation/`).flush({});
  });

  it('getSensitivity GETs the sensitivity endpoint', () => {
    service.getSensitivity().subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${rootURL}/v1/dashboard/fairness/sensitivity/`).flush({});
  });
});
