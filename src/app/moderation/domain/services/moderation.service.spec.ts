import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ModerationService, REPORT_ERROR_MESSAGES } from './moderation.service';

describe('ModerationService', () => {
  let service: ModerationService;
  let http: HttpTestingController;
  const base = '/api/social/v1';

  beforeEach(() => {
    localStorage.setItem('accessToken', 'tok-1');
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ModerationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('accessToken');
  });

  describe('isModerator', () => {
    it('returns false without a token and makes no request', () => {
      localStorage.removeItem('accessToken');
      let result: boolean | undefined;
      service.isModerator().subscribe((value) => (result = value));
      expect(result).toBeFalse();
    });

    it('asks social-service once per token and caches the answer', () => {
      const results: boolean[] = [];
      service.isModerator().subscribe((value) => results.push(value));
      const req = http.expectOne(`${base}/moderation/me/`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
      req.flush({ is_moderator: true });
      service.isModerator().subscribe((value) => results.push(value));
      http.expectNone(`${base}/moderation/me/`);
      expect(results).toEqual([true, true]);
    });

    it('re-checks when the token changes and treats errors as non-moderator', () => {
      service.isModerator().subscribe();
      http.expectOne(`${base}/moderation/me/`).flush({ is_moderator: true });
      localStorage.setItem('accessToken', 'tok-2');
      let result: boolean | undefined;
      service.isModerator().subscribe((value) => (result = value));
      http
        .expectOne(`${base}/moderation/me/`)
        .flush({ detail: 'x' }, { status: 500, statusText: 'Server Error' });
      expect(result).toBeFalse();
    });
  });

  describe('report', () => {
    it('posts a trimmed reason for a post', () => {
      service.report('post', 'p1', '  insulto  ').subscribe();
      const req = http.expectOne(`${base}/posts/p1/report/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: 'insulto' });
      req.flush({});
    });

    it('posts an empty body for a comment without reason', () => {
      service.report('comment', 'c1').subscribe();
      const req = http.expectOne(`${base}/comments/c1/report/`);
      expect(req.request.body).toEqual({});
      req.flush({});
    });
  });

  describe('review queue', () => {
    it('sends filters as query params', () => {
      service
        .getQueue({
          status: 'pending',
          reason: 'reported',
          content_type: 'comment',
          limit: 20,
          offset: 40,
        })
        .subscribe();
      const req = http.expectOne((r) => r.url === `${base}/moderation/review-queue/`);
      expect(req.request.params.get('status')).toBe('pending');
      expect(req.request.params.get('reason')).toBe('reported');
      expect(req.request.params.get('content_type')).toBe('comment');
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.get('offset')).toBe('40');
      req.flush({ total: 0, limit: 20, offset: 40, items: [] });
    });

    it('omits empty optional filters', () => {
      service
        .getQueue({ status: 'all', reason: '', content_type: '', limit: 10, offset: 0 })
        .subscribe();
      const req = http.expectOne((r) => r.url === `${base}/moderation/review-queue/`);
      expect(req.request.params.has('reason')).toBeFalse();
      expect(req.request.params.has('content_type')).toBeFalse();
      req.flush({ total: 0, limit: 10, offset: 0, items: [] });
    });

    it('fetches a case detail', () => {
      service.getCase(7).subscribe();
      http.expectOne(`${base}/moderation/review-queue/7/`).flush({});
    });

    it('posts a decision with trimmed notes', () => {
      service.decide(7, 'approve', '  ok  ').subscribe();
      const req = http.expectOne(`${base}/moderation/review-queue/7/decision/`);
      expect(req.request.body).toEqual({ decision: 'approve', notes: 'ok' });
      req.flush({});
    });

    it('posts a decision without notes', () => {
      service.decide(7, 'block').subscribe();
      const req = http.expectOne(`${base}/moderation/review-queue/7/decision/`);
      expect(req.request.body).toEqual({ decision: 'block' });
      req.flush({});
    });
  });

  describe('errorMessage', () => {
    it('falls back for non-HTTP errors', () => {
      expect(service.errorMessage(new Error('x'), 'fallback')).toBe('fallback');
    });

    it('explains a 503 from the moderation backend', () => {
      const error = new HttpErrorResponse({ status: 503 });
      expect(service.errorMessage(error, 'fallback')).toContain('unavailable');
    });

    it('maps known statuses to English instead of the backend detail', () => {
      const forbidden = new HttpErrorResponse({
        status: 403,
        error: { detail: 'Solo moderadores' },
      });
      expect(service.errorMessage(forbidden, 'fallback')).toBe(
        'You do not have permission to do this.',
      );
      expect(service.errorMessage(new HttpErrorResponse({ status: 404 }), 'fallback')).toBe(
        'This content no longer exists.',
      );
    });

    it('uses caller overrides, e.g. self-reports', () => {
      const error = new HttpErrorResponse({ status: 400, error: { detail: 'No puedes…' } });
      expect(service.errorMessage(error, 'fallback', REPORT_ERROR_MESSAGES)).toBe(
        "You can't report your own content.",
      );
    });

    it('falls back for unmapped statuses', () => {
      const error = new HttpErrorResponse({ status: 400, error: { detail: 'Ya reportado' } });
      expect(service.errorMessage(error, 'fallback')).toBe('fallback');
    });
  });
});
