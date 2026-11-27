import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';
import { ReviewResolutionFormComponent } from './review-resolution-form.component';
import { ReviewPanelComponent } from '../review-panel/review-panel.component';
import { ReviewErrorComponent } from '../review-error/review-error.component';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';
import {
  CaseType,
  ResolutionResponse,
  ReviewCase,
} from 'src/app/search-engine/domain/entities/review.interface';

const base: ReviewCase = {
  case_id: 'c-1',
  assessment_id: 'a-1',
  created_at: '2026-12-01T10:00:00Z',
  expires_at: '2026-12-02T10:00:00Z',
  status: 'pending',
  policy: { policy_id: 'p', version: '1' },
  reason_codes: ['HUMAN_REVIEW_REQUIRED'],
  resolution: null,
};

const qa: ReviewCase = {
  ...base,
  qa_pairs: [
    { question: 'P1', answer: 'R1' },
    { question: 'P2', answer: 'R2' },
  ],
  source_article_ids: ['SYN-A02'],
};

const reco: ReviewCase = {
  ...base,
  reason_codes: ['PROTECTED_ATTRIBUTE_UNKNOWN'],
  recommendation: {
    recommendations: [
      { rank: 1, institution: 'A' },
      { rank: 2, institution: 'B' },
      { rank: 3, institution: 'UNKNOWN' },
    ],
  },
  review_plan: { outcome: 'modify', retained_ranks: [1, 2] },
};

const rag: ReviewCase = {
  ...base,
  rag: {
    query: 'q',
    answer_text: 'Uno [1]. Dos [2].',
    blocks: [{ cite_id: 'b1', text: 't' }],
    cited_positions: [1, 2],
  },
};

const saved = { case_id: 'c-1', outcome: 'approve' } as ResolutionResponse;

describe('ReviewResolutionFormComponent', () => {
  let fixture: ComponentFixture<ReviewResolutionFormComponent>;
  let form: ReviewResolutionFormComponent;
  let reviews: jasmine.SpyObj<ReviewService>;

  function setup(reviewCase: ReviewCase, caseType: CaseType): void {
    form.reviewCase = reviewCase;
    form.caseType = caseType;
    form.ngOnChanges();
    fixture.detectChanges();
  }

  beforeEach(() => {
    reviews = jasmine.createSpyObj('ReviewService', ['resolve']);
    reviews.resolve.and.returnValue(of(saved));
    TestBed.configureTestingModule({
      declarations: [ReviewResolutionFormComponent, ReviewPanelComponent, ReviewErrorComponent],
      imports: [FormsModule],
      providers: [{ provide: ReviewService, useValue: reviews }],
    });
    fixture = TestBed.createComponent(ReviewResolutionFormComponent);
    form = fixture.componentInstance;
  });

  it('asks for a decision first', () => {
    setup(qa, 'qa');
    expect(form.blocker).toBe('Elige una decisión.');
    form.review();
    expect(form.confirming).toBeFalse();
  });

  it('approves plain Q&A without a justification after confirming', () => {
    setup(qa, 'qa');
    const emitted: ResolutionResponse[] = [];
    form.resolved.subscribe((r) => emitted.push(r));
    form.choose('approve');
    expect(form.needsJustification).toBeFalse();
    form.review();
    expect(form.confirming).toBeTrue();
    form.submit();
    expect(reviews.resolve).toHaveBeenCalledWith('c-1', { outcome: 'approve' });
    expect(emitted).toEqual([saved]);
  });

  it('requires a justification to reject (D6) and trims it', () => {
    setup(qa, 'qa');
    form.choose('reject');
    expect(form.blocker).toContain('justificación');
    form.justification = '  G1: fuente inexistente  ';
    expect(form.blocker).toBeNull();
    expect(form.request()).toEqual({ outcome: 'reject', justification: 'G1: fuente inexistente' });
  });

  it('rejects a justification over the limit', () => {
    setup(qa, 'qa');
    form.choose('reject');
    form.justification = 'x'.repeat(2001);
    expect(form.blocker).toContain('2000');
  });

  it('requires a justification to approve flagged output', () => {
    setup({ ...qa, reason_codes: ['PARTIAL_GENERATION'] }, 'qa');
    form.choose('approve');
    expect(form.needsJustification).toBeTrue();
  });

  describe('Q&A modification', () => {
    beforeEach(() => {
      setup(qa, 'qa');
      form.choose('modify');
      form.justification = 'N en el par 2';
    });

    it('needs an actual change', () => {
      expect(form.blocker).toContain('al menos un par');
    });

    it('sends the remaining edited pairs', () => {
      form.removePair(1);
      form.pairs[0].answer = ' R1 corregida ';
      expect(form.blocker).toBeNull();
      expect(form.request()).toEqual({
        outcome: 'modify',
        justification: 'N en el par 2',
        qa_pairs: [{ question: 'P1', answer: 'R1 corregida' }],
      });
      expect(qa.qa_pairs?.[0].answer).toBe('R1');
    });

    it('keeps at least one pair and needs both fields', () => {
      form.removePair(1);
      form.removePair(0);
      expect(form.pairs.length).toBe(1);
      form.pairs[0].question = ' ';
      expect(form.blocker).toContain('pregunta y respuesta');
    });
  });

  describe('recommender (ADR 0007)', () => {
    beforeEach(() => setup(reco, 'recommendation'));

    it('starts from the proposed ranks and always needs a justification', () => {
      expect(form.ranks).toEqual([1, 2]);
      form.choose('approve');
      expect(form.needsJustification).toBeTrue();
    });

    it('follows the plan without departing', () => {
      form.choose('modify');
      expect(form.departs).toBeFalse();
      form.justification = 'PROTECTED_ATTRIBUTE_UNKNOWN en el rango 3';
      expect(form.request()).toEqual({
        outcome: 'modify',
        justification: 'PROTECTED_ATTRIBUTE_UNKNOWN en el rango 3',
        retained_ranks: [1, 2],
      });
    });

    it('lets the reviewer depart from the plan in original order', () => {
      form.choose('modify');
      form.toggleRank(2);
      form.toggleRank(3);
      expect(form.ranks).toEqual([1, 3]);
      expect(form.departs).toBeTrue();
      form.choose('reject');
      expect(form.departs).toBeTrue();
    });

    it('needs at least one profile', () => {
      form.choose('modify');
      form.justification = 'x';
      form.toggleRank(1);
      form.toggleRank(2);
      expect(form.blocker).toContain('al menos un perfil');
    });

    it('starts from every rank when the plan does not modify', () => {
      setup({ ...reco, review_plan: { outcome: 'reject', retained_ranks: [] } }, 'recommendation');
      expect(form.ranks).toEqual([1, 2, 3]);
    });
  });

  describe('RAG modification', () => {
    beforeEach(() => {
      setup(rag, 'rag');
      form.choose('modify');
      form.justification = 'G1 en el párrafo 2';
    });

    it('warns about citations without a block and sends the corrected answer', () => {
      expect(form.uncitedPositions).toEqual([2]);
      form.answerText = ' Uno [1]. ';
      expect(form.uncitedPositions).toEqual([]);
      expect(form.request()).toEqual({
        outcome: 'modify',
        justification: 'G1 en el párrafo 2',
        answer_text: 'Uno [1].',
      });
    });

    it('does not accept an empty answer', () => {
      form.answerText = ' ';
      expect(form.blocker).toContain('vacía');
    });
  });

  it('has no ranks or citations for other case types', () => {
    setup(qa, 'qa');
    expect(form.allRanks).toEqual([]);
    expect(form.uncitedPositions).toEqual([]);
    expect(form.departs).toBeFalse();
  });

  it('goes back from confirmation', () => {
    setup(qa, 'qa');
    form.choose('approve');
    form.review();
    form.back();
    expect(form.confirming).toBeFalse();
  });

  it('does not send twice or while blocked', () => {
    setup(qa, 'qa');
    form.submit();
    expect(reviews.resolve).not.toHaveBeenCalled();
    const pending = new Subject<ResolutionResponse>();
    reviews.resolve.and.returnValue(pending);
    form.choose('approve');
    form.submit();
    form.submit();
    expect(reviews.resolve).toHaveBeenCalledTimes(1);
  });

  it('offers the current state after an expiry or a conflicting resolution', () => {
    setup(qa, 'qa');
    let staleEvents = 0;
    form.stale.subscribe(() => staleEvents++);
    reviews.resolve.and.returnValue(
      throwError(() => ({ status: 409, code: 'CASE_EXPIRED', traceId: 't-7' })),
    );
    form.choose('approve');
    form.submit();
    fixture.detectChanges();
    expect(form.error).toContain('venció');
    expect(form.staleError).toBeTrue();
    const button: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('estado actual')) as HTMLButtonElement;
    button.click();
    expect(staleEvents).toBe(1);
  });

  it('keeps the form after a validation error from the service', () => {
    setup(qa, 'qa');
    reviews.resolve.and.returnValue(
      throwError(() => ({ status: 422, code: 'JUSTIFICATION_REQUIRED', traceId: null })),
    );
    form.choose('approve');
    form.submit();
    expect(form.staleError).toBeFalse();
    expect(form.submitting).toBeFalse();
    expect(form.outcome).toBe('approve');
  });

  it('says when the justification is required before a choice is made', () => {
    setup(qa, 'qa');
    expect(form.justificationState).toBe('obligatoria para modificar o rechazar');
    form.choose('approve');
    expect(form.justificationState).toBe('opcional');
    setup(reco, 'recommendation');
    expect(form.justificationState).toBe('obligatoria');
  });

  it('names the consequence, the proposal and a fitting example', () => {
    setup(reco, 'recommendation');
    expect(form.proposed).toBe('modify');
    expect(form.consequences.reject).toContain('no recibe');
    expect(form.placeholder).toContain('rango');
    setup(rag, 'rag');
    expect(form.proposed).toBeNull();
    expect(form.placeholder).toContain('párrafo');
    setup(qa, 'qa');
    expect(form.placeholder).toContain('par 2');
  });

  it('asks for the wide layout only for text editors', () => {
    const editing: boolean[] = [];
    form.editing.subscribe((v) => editing.push(v));
    setup(rag, 'rag');
    form.choose('modify');
    setup(reco, 'recommendation');
    form.choose('modify');
    form.choose('reject');
    expect(editing).toEqual([true, false, false]);
  });

  it('is dirty while a decision is unsent and clean after it is saved', () => {
    setup(qa, 'qa');
    expect(form.dirty).toBeFalse();
    form.justification = 'nota';
    expect(form.dirty).toBeTrue();
    form.justification = '';
    form.choose('approve');
    expect(form.dirty).toBeTrue();
    form.submit();
    expect(form.dirty).toBeFalse();
  });

  it('moves focus to the confirmation and back', fakeAsync(() => {
    setup(qa, 'qa');
    form.choose('approve');
    fixture.detectChanges();
    form.review();
    fixture.detectChanges();
    tick();
    expect(document.activeElement?.getAttribute('role')).toBe('group');
    form.back();
    fixture.detectChanges();
    tick();
    expect(document.activeElement?.textContent).toContain('Revisar y confirmar');
  }));

  it('renders every editor without errors', () => {
    setup(qa, 'qa');
    form.choose('modify');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Retirar este par');
    setup(reco, 'recommendation');
    form.choose('modify');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Rango 3');
    setup(rag, 'rag');
    form.choose('modify');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sigue citando');
  });
});
