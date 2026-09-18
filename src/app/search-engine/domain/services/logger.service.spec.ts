import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LogService } from './logger.service';
import { environment } from 'src/environments/environment';

describe('LogService', () => {
  let service: LogService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiSearch + '/v1/admin/logs/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LogService],
    });
    service = TestBed.inject(LogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sends only page and lines_per_page when no optional filters are given', () => {
    service.getLogs(1, 50).subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('lines_per_page')).toBe('50');
    expect(req.request.params.has('level')).toBeFalse();
    req.flush({});
  });

  it('applies every optional filter when provided', () => {
    service.getLogs(2, 20, 'ERROR', '2024-01-01', '2024-01-31', 'timeout').subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.params.get('level')).toBe('ERROR');
    expect(req.request.params.get('start_date')).toBe('2024-01-01');
    expect(req.request.params.get('end_date')).toBe('2024-01-31');
    expect(req.request.params.get('keyword')).toBe('timeout');
    req.flush({});
  });
});
