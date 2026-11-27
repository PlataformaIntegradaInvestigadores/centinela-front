import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ReviewCaseComponent, answerSegments } from './review-case.component';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';
import { ReviewCase } from 'src/app/search-engine/domain/entities/review.interface';
import { ReviewDatePipe, ReviewNumberPipe } from '../../pipes/review-format.pipes';
import { Router } from '@angular/router';

const later = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString();

function qaCase(overrides: Partial<ReviewCase> = {}): ReviewCase {
  return {
    case_id: 'qa-1',
    assessment_id: 'a-1',
    created_at: '2026-12-01T10:00:00Z',
    expires_at: later(),
    status: 'pending',
    policy: { policy_id: 'search-qa-review', version: 'draft-1' },
    reason_codes: ['HUMAN_REVIEW_REQUIRED'],
    qa_pairs: [{ question: '¿Cuántos?', answer: 'Ciento ochenta.' }],
    source_article_ids: ['SYN-A02'],
    resolution: null,
    ...overrides,
  };
}

const recoCase = (): ReviewCase =>
  qaCase({
    case_id: 'reco-1',
    qa_pairs: undefined,
    source_article_ids: undefined,
    recommendation: {
      recommendations: [
        { rank: 1, institution: 'Inst. Norte', low_visibility: false, final_score: 0.9 },
        { rank: 2, institution: 'UNKNOWN' },
      ],
      fairness_metrics: { quota_picks: 1, nested: { a: 1 } },
      parameters: { rerank: { lambda_: 0.8 } },
    },
    review_plan: { outcome: 'modify', retained_ranks: [1] },
  });

const ragCase = (): ReviewCase =>
  qaCase({
    case_id: 'rag-1',
    qa_pairs: undefined,
    source_article_ids: undefined,
    rag: {
      query: '¿Visibilidad?',
      answer_text: 'Más descargas [1].\n\nEn todo el país [3].',
      blocks: [{ cite_id: 'SYN-A03', title: 'Tesis', text: 'Texto del bloque.' }],
      cited_positions: [1, 3],
    },
  });

describe('ReviewCaseComponent', () => {
  let fixture: ComponentFixture<ReviewCaseComponent>;
  let component: ReviewCaseComponent;
  let reviews: jasmine.SpyObj<ReviewService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function render(reviewCase: ReviewCase): void {
    reviews.getCase.and.returnValue(of(reviewCase));
    fixture.detectChanges();
  }

  beforeEach(() => {
    reviews = jasmine.createSpyObj('ReviewService', ['getCase', 'listCases']);
    params = new BehaviorSubject(convertToParamMap({ caseId: 'qa-1' }));
    TestBed.configureTestingModule({
      declarations: [ReviewCaseComponent, ReviewDatePipe, ReviewNumberPipe],
      imports: [RouterTestingModule],
      providers: [
        { provide: ReviewService, useValue: reviews },
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReviewCaseComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('loads the case from the route and shows the retained pairs', () => {
    render(qaCase());
    expect(reviews.getCase).toHaveBeenCalledWith('qa-1');
    expect(component.caseType).toBe('qa');
    expect(component.open).toBeTrue();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ciento ochenta.');
    expect(text).toContain('Por qué se retuvo');
  });

  it('reloads when the route changes', () => {
    render(qaCase());
    params.next(convertToParamMap({ caseId: 'qa-2' }));
    expect(reviews.getCase).toHaveBeenCalledWith('qa-2');
  });

  it('shows a load error with its trace', () => {
    reviews.getCase.and.returnValue(
      throwError(() => ({ status: 404, code: 'CASE_NOT_FOUND', traceId: 't-4' })),
    );
    fixture.detectChanges();
    expect(component.error).toContain('No existe');
    expect(component.traceId).toBe('t-4');
  });

  it('closes the form once the deadline passes on screen', () => {
    render(qaCase({ expires_at: '2020-01-01T00:00:00Z' }));
    expect(component.overdue).toBeTrue();
    expect(component.open).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Plazo de revisión cumplido');
  });

  it('flags urgency only near the deadline', () => {
    render(qaCase({ expires_at: new Date(Date.now() + 30 * 60000).toISOString() }));
    expect(component.urgent).toBeTrue();
    expect(component.remaining).toContain('min');
  });

  it('shows the recorded state of a resolved case', () => {
    render(
      qaCase({
        status: 'reject',
        resolution: {
          resolution_id: 'r-1',
          outcome: 'reject',
          resolved_at: '2026-12-01T11:00:00Z',
          supervisor: { identity_id: 'admin', display_name: 'Administrador' },
          justification: 'G1',
        },
      }),
    );
    expect(component.open).toBeFalse();
    expect(component.overdue).toBeFalse();
  });

  it('shows the recommender list against the plan', () => {
    render(recoCase());
    expect(component.caseType).toBe('recommendation');
    expect(component.inPlan(1)).toBeTrue();
    expect(component.inPlan(2)).toBeFalse();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Inst. Norte');
    expect(text).toContain('Retirar');
    expect(component.entries(recoCase().recommendation?.fairness_metrics)).toContain({
      key: 'nested',
      value: '{"a":1}',
    });
    expect(component.entries(undefined)).toEqual([]);
  });

  it('ties RAG citations to blocks and marks citations without a block', () => {
    render(ragCase());
    expect(component.caseType).toBe('rag');
    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('a[href="#block-1"]')).not.toBeNull();
    expect(html.querySelector('mark')?.textContent).toContain('[3] sin bloque');
    expect(html.textContent).toContain('Texto del bloque.');
  });

  it('applies a new resolution without reloading', () => {
    render(qaCase());
    component.onResolved({
      case_id: 'qa-1',
      resolution_id: 'r-2',
      outcome: 'approve',
      resolved_at: '2026-12-01T11:00:00Z',
      supervisor: { identity_id: 'admin', display_name: 'Administrador' },
      justification: null,
    });
    expect(component.reviewCase?.status).toBe('approve');
    expect(component.reviewCase?.resolution?.resolution_id).toBe('r-2');
    expect(reviews.getCase).toHaveBeenCalledTimes(1);
  });

  it('ignores a resolution when no case is loaded and reloads a stale case', () => {
    component.onResolved({} as never);
    expect(component.reviewCase).toBeNull();
    reviews.getCase.and.returnValue(of(qaCase()));
    component.onStale();
    expect(component.reviewCase?.case_id).toBe('qa-1');
  });

  describe('after a resolution', () => {
    let router: Router;
    beforeEach(() => {
      router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
      render(qaCase());
    });

    it('opens the next pending case that is not this one', () => {
      reviews.listCases.and.returnValue(
        of({
          items: [{ case_id: 'qa-1' } as never, { case_id: 'reco-9' } as never],
          next_cursor: null,
        }),
      );
      component.nextPending();
      expect(reviews.listCases).toHaveBeenCalledWith({ status: 'pending', limit: 2 });
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard/reviews', 'reco-9']);
      expect(component.nextState).toBe('idle');
    });

    it('says when the queue is empty', () => {
      reviews.listCases.and.returnValue(
        of({ items: [{ case_id: 'qa-1' } as never], next_cursor: null }),
      );
      component.nextPending();
      expect(component.nextState).toBe('none');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('reports a failed lookup', () => {
      reviews.listCases.and.returnValue(throwError(() => ({ code: 'NETWORK_ERROR' })));
      component.nextPending();
      expect(component.nextState).toBe('error');
    });
  });

  it('knows about an unsent decision and warns before unloading', () => {
    render(qaCase());
    expect(component.hasUnsavedDecision()).toBeFalse();
    component.form = { dirty: true } as never;
    expect(component.hasUnsavedDecision()).toBeTrue();
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as BeforeUnloadEvent;
    component.warnBeforeUnload(event);
    expect(event.preventDefault).toHaveBeenCalled();
    component.form = { dirty: false } as never;
    const quiet = {
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as BeforeUnloadEvent;
    component.warnBeforeUnload(quiet);
    expect(quiet.preventDefault).not.toHaveBeenCalled();
  });

  it('labels metrics and keeps numbers as numbers', () => {
    expect(component.entries({ quota_picks: 1, mode: 'prefix' })).toEqual([
      { key: 'Perfiles elegidos por cuota', value: 1 },
      { key: 'Modo de reordenamiento', value: 'prefix' },
    ]);
  });

  it('has no deadline state without a case', () => {
    expect(component.remaining).toBeNull();
    expect(component.urgent).toBeFalse();
    expect(component.inPlan(1)).toBeFalse();
  });

  it('ticks its clock until destroyed', fakeAsync(() => {
    render(qaCase());
    tick(15000);
    expect(component.now).toBeGreaterThan(0);
    fixture.destroy();
    discardPeriodicTasks();
  }));
});

describe('answerSegments', () => {
  it('splits text and citations and checks each position', () => {
    expect(answerSegments('a [1] b [2]', 1)).toEqual([
      { text: 'a ' },
      { position: 1, known: true },
      { text: ' b ' },
      { position: 2, known: false },
    ]);
  });

  it('treats position zero as unknown and keeps plain text whole', () => {
    expect(answerSegments('[0]', 3)).toEqual([{ position: 0, known: false }]);
    expect(answerSegments('sin citas', 3)).toEqual([{ text: 'sin citas' }]);
  });
});
