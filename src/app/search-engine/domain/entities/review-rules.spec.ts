import {
  citedPositions,
  departsFromPlan,
  errorMessage,
  justificationRequired,
  reasonLabel,
  timeLeft,
} from './review-rules';
import { ReviewCase, caseTypeOf } from './review.interface';

describe('review rules', () => {
  describe('justificationRequired (D6, ADR 0003 and 0007)', () => {
    it('always requires one for the recommender', () => {
      expect(justificationRequired('recommendation', 'approve', [])).toBeTrue();
    });

    it('requires one to modify or reject Q&A and RAG', () => {
      expect(justificationRequired('qa', 'modify', [])).toBeTrue();
      expect(justificationRequired('qa', 'reject', [])).toBeTrue();
      expect(justificationRequired('rag', 'reject', [])).toBeTrue();
    });

    it('requires one to approve only output flagged with a defect', () => {
      expect(justificationRequired('qa', 'approve', ['HUMAN_REVIEW_REQUIRED'])).toBeFalse();
      expect(justificationRequired('qa', 'approve', ['PARTIAL_GENERATION'])).toBeTrue();
      expect(justificationRequired('qa', 'approve', ['SOURCE_EVIDENCE_INCOMPLETE'])).toBeTrue();
      expect(justificationRequired('rag', 'approve', ['RAG_CITATION_WITHOUT_BLOCK'])).toBeTrue();
    });
  });

  describe('departsFromPlan', () => {
    const plan = { outcome: 'modify' as const, retained_ranks: [1, 2, 4] };

    it('is false when the plan is followed', () => {
      expect(departsFromPlan(plan, 'modify', [1, 2, 4])).toBeFalse();
      expect(
        departsFromPlan({ outcome: 'reject', retained_ranks: [] }, 'reject', null),
      ).toBeFalse();
    });

    it('is true for another outcome or another subset', () => {
      expect(departsFromPlan(plan, 'reject', null)).toBeTrue();
      expect(departsFromPlan(plan, 'modify', [1, 2])).toBeTrue();
      expect(departsFromPlan(plan, 'modify', [1, 3, 4])).toBeTrue();
      expect(departsFromPlan(plan, 'modify', null)).toBeTrue();
    });
  });

  it('lists cited positions once, in order', () => {
    expect(citedPositions('a [2] b [1] c [2] [10]')).toEqual([2, 1, 10]);
    expect(citedPositions('sin citas')).toEqual([]);
  });

  it('labels known reason codes and keeps unknown ones', () => {
    expect(reasonLabel('PARTIAL_GENERATION')).toContain('parcial');
    expect(reasonLabel('NEW_CODE')).toBe('NEW_CODE');
  });

  it('explains known errors and reports the status of unknown ones', () => {
    expect(errorMessage({ status: 409, code: 'CASE_EXPIRED', traceId: null })).toContain('venció');
    expect(errorMessage({ status: 500, code: 'UNEXPECTED', traceId: null })).toContain('500');
  });

  describe('timeLeft', () => {
    const at = Date.parse('2026-12-01T12:00:00Z');

    it('counts minutes, hours and days', () => {
      expect(timeLeft('2026-12-01T12:30:00Z', at)).toBe('30 min');
      expect(timeLeft('2026-12-01T15:05:00Z', at)).toBe('3 h 5 min');
      expect(timeLeft('2026-12-05T12:00:00Z', at)).toBe('4 días');
    });

    it('is null once the deadline passed', () => {
      expect(timeLeft('2026-12-01T11:59:00Z', at)).toBeNull();
    });
  });

  it('infers the case type from its protected section', () => {
    const base = { case_id: 'c' } as ReviewCase;
    expect(caseTypeOf(base)).toBe('qa');
    expect(caseTypeOf({ ...base, rag: {} as ReviewCase['rag'] })).toBe('rag');
    expect(caseTypeOf({ ...base, recommendation: {} as ReviewCase['recommendation'] })).toBe(
      'recommendation',
    );
  });
});
