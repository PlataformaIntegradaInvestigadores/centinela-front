import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService, toGovernanceError } from './review.service';
import { GovernanceError } from '../entities/review.interface';

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;
  const root = '/api/governance/review-cases';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists cases with every filter as a query parameter', () => {
    service
      .listCases({ status: 'pending', caseType: 'rag', cursor: 'c-2', limit: 25 })
      .subscribe((page) => expect(page.items.length).toBe(0));
    const req = http.expectOne((r) => r.url === `${root}/`);
    expect(req.request.params.get('status')).toBe('pending');
    expect(req.request.params.get('case_type')).toBe('rag');
    expect(req.request.params.get('cursor')).toBe('c-2');
    expect(req.request.params.get('limit')).toBe('25');
    req.flush({ items: [], next_cursor: null });
  });

  it('lists cases without parameters when no filter is set', () => {
    service.listCases().subscribe();
    const req = http.expectOne(`${root}/`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ items: [], next_cursor: null });
  });

  it('reports a missing list route as an unavailable list', (done) => {
    service.listCases().subscribe({
      error: (error: GovernanceError) => {
        expect(error.code).toBe('CASE_LIST_UNAVAILABLE');
        done();
      },
    });
    http.expectOne(`${root}/`).flush({ detail: 'Not Found' }, { status: 404, statusText: 'NF' });
  });

  it('gets one case with its ID escaped', () => {
    service.getCase('a/b').subscribe((c) => expect(c.case_id).toBe('a/b'));
    http.expectOne(`${root}/a%2Fb`).flush({ case_id: 'a/b' });
  });

  it('keeps the service code and trace of a failed case read', (done) => {
    service.getCase('x').subscribe({
      error: (error: GovernanceError) => {
        expect(error).toEqual({ status: 404, code: 'CASE_NOT_FOUND', traceId: 't-9' });
        done();
      },
    });
    http
      .expectOne(`${root}/x`)
      .flush({ code: 'CASE_NOT_FOUND', trace_id: 't-9' }, { status: 404, statusText: 'NF' });
  });

  it('posts a resolution', () => {
    service
      .resolve('c-1', { outcome: 'reject', justification: 'G1' })
      .subscribe((r) => expect(r.outcome).toBe('reject'));
    const req = http.expectOne(`${root}/c-1/resolution`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ outcome: 'reject', justification: 'G1' });
    req.flush({ case_id: 'c-1', outcome: 'reject' });
  });

  it('turns a rejected resolution into a governance error', (done) => {
    service.resolve('c-1', { outcome: 'approve' }).subscribe({
      error: (error: GovernanceError) => {
        expect(error.code).toBe('CASE_EXPIRED');
        done();
      },
    });
    http
      .expectOne(`${root}/c-1/resolution`)
      .flush({ code: 'CASE_EXPIRED', trace_id: 't' }, { status: 409, statusText: 'C' });
  });

  describe('toGovernanceError', () => {
    it('maps a network failure', () => {
      expect(toGovernanceError(new HttpErrorResponse({ status: 0 })).code).toBe('NETWORK_ERROR');
    });

    it('maps an unknown body to an unexpected error', () => {
      const error = toGovernanceError(new HttpErrorResponse({ status: 500, error: 'boom' }));
      expect(error).toEqual({ status: 500, code: 'UNEXPECTED', traceId: null });
    });

    it('treats 405 on the list as unavailable but not on a case', () => {
      const e405 = new HttpErrorResponse({ status: 405 });
      expect(toGovernanceError(e405, true).code).toBe('CASE_LIST_UNAVAILABLE');
      expect(toGovernanceError(e405).code).toBe('UNEXPECTED');
    });
  });
});
