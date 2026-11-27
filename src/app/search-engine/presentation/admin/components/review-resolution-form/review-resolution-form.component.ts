import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import {
  CaseType,
  GovernanceError,
  QaPair,
  ResolutionRequest,
  ResolutionResponse,
  ReviewCase,
  ReviewOutcome,
} from 'src/app/search-engine/domain/entities/review.interface';
import {
  CONSEQUENCES,
  MAX_JUSTIFICATION_LENGTH,
  OUTCOME_LABELS,
  OUTCOME_VERBS,
  citedPositions,
  departsFromPlan,
  errorMessage,
  justificationHint,
  justificationRequired,
} from 'src/app/search-engine/domain/entities/review-rules';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';

/** Errors after which the case on screen no longer matches the server. */
const STALE_CODES = new Set(['CASE_EXPIRED', 'CASE_ALREADY_RESOLVED', 'CASE_NOT_FOUND']);

@Component({
  selector: 'app-review-resolution-form',
  templateUrl: './review-resolution-form.component.html',
})
export class ReviewResolutionFormComponent implements OnChanges {
  @Input({ required: true }) reviewCase!: ReviewCase;
  @Input({ required: true }) caseType!: CaseType;
  @Output() resolved = new EventEmitter<ResolutionResponse>();
  @Output() stale = new EventEmitter<void>();
  /** Emits whether the chosen outcome needs room for an editor beside the original. */
  @Output() editing = new EventEmitter<boolean>();
  @ViewChild('confirmation') confirmation?: ElementRef<HTMLElement>;
  @ViewChild('reviewButton') reviewButton?: ElementRef<HTMLButtonElement>;

  readonly outcomes: ReviewOutcome[] = ['approve', 'modify', 'reject'];
  readonly outcomeLabels = OUTCOME_LABELS;
  readonly verbs = OUTCOME_VERBS;
  readonly maxLength = MAX_JUSTIFICATION_LENGTH;

  outcome: ReviewOutcome | null = null;
  justification = '';
  pairs: QaPair[] = [];
  answerText = '';
  selectedRanks = new Set<number>();
  confirming = false;
  submitting = false;
  error: string | null = null;
  traceId: string | null = null;
  staleError = false;

  constructor(private reviews: ReviewService) {}

  ngOnChanges(): void {
    const rc = this.reviewCase;
    this.outcome = null;
    this.justification = '';
    this.confirming = false;
    this.error = null;
    this.staleError = false;
    this.pairs = (rc.qa_pairs ?? []).map((pair) => ({ ...pair }));
    this.answerText = rc.rag?.answer_text ?? '';
    const plan = rc.review_plan;
    this.selectedRanks = new Set(plan?.outcome === 'modify' ? plan.retained_ranks : this.allRanks);
  }

  get allRanks(): number[] {
    return (this.reviewCase.recommendation?.recommendations ?? []).map((p) => p.rank);
  }

  /** Selected ranks in their original order. */
  get ranks(): number[] {
    return this.allRanks.filter((rank) => this.selectedRanks.has(rank));
  }

  get needsJustification(): boolean {
    return (
      !!this.outcome &&
      justificationRequired(this.caseType, this.outcome, this.reviewCase.reason_codes)
    );
  }

  get departs(): boolean {
    const plan = this.reviewCase.review_plan;
    return !!plan && !!this.outcome && departsFromPlan(plan, this.outcome, this.ranks);
  }

  get uncitedPositions(): number[] {
    const blocks = this.reviewCase.rag?.blocks.length ?? 0;
    return citedPositions(this.answerText).filter((n) => n < 1 || n > blocks);
  }

  /** Why the form cannot be sent yet, or `null` when it can. */
  get blocker(): string | null {
    if (!this.outcome) {
      return 'Elige una decisión.';
    }
    if (this.needsJustification && !this.justification.trim()) {
      return 'Esta decisión exige una justificación.';
    }
    if (this.justification.length > this.maxLength) {
      return `La justificación admite hasta ${this.maxLength} caracteres.`;
    }
    if (this.outcome === 'modify') {
      return this.modificationBlocker();
    }
    return null;
  }

  private modificationBlocker(): string | null {
    if (this.caseType === 'recommendation') {
      return this.ranks.length > 0 ? null : 'Conserva al menos un perfil.';
    }
    if (this.caseType === 'rag') {
      return this.ragBlocker();
    }
    if (this.pairs.some((pair) => !pair.question.trim() || !pair.answer.trim())) {
      return 'Cada par conservado necesita pregunta y respuesta.';
    }
    const original = this.reviewCase.qa_pairs ?? [];
    const unchanged =
      this.pairs.length === original.length &&
      this.pairs.every(
        (pair, i) => pair.question === original[i].question && pair.answer === original[i].answer,
      );
    return unchanged ? 'Modifica o retira al menos un par.' : null;
  }

  get placeholder(): string {
    return {
      qa: 'Ej.: N en el par 2: la fuente informa 92 y 95 días, sin reducción…',
      recommendation: 'Ej.: PROTECTED_ATTRIBUTE_UNKNOWN en el rango 5: sin metadatos; se retira…',
      rag: 'Ej.: G1 en el párrafo 2: la cita [3] no tiene bloque…',
    }[this.caseType];
  }

  get consequences(): Record<ReviewOutcome, string> {
    return CONSEQUENCES[this.caseType];
  }

  get proposed(): ReviewOutcome | null {
    return this.reviewCase.review_plan?.outcome ?? null;
  }

  /** Requirement said before and after choosing, so the label never reads "optional" wrongly. */
  get justificationState(): string {
    if (!this.outcome) {
      return justificationHint(this.caseType, this.reviewCase.reason_codes);
    }
    return this.needsJustification ? 'obligatoria' : 'opcional';
  }

  /** Anything typed or chosen that has not reached the service yet. */
  get dirty(): boolean {
    return !this.submitting && (!!this.outcome || !!this.justification.trim());
  }

  /** rag-ask v1: a correction cites at least one block and every citation resolves. */
  private ragBlocker(): string | null {
    if (!this.answerText.trim()) {
      return 'La respuesta corregida no puede quedar vacía.';
    }
    if (citedPositions(this.answerText).length === 0) {
      return 'La respuesta corregida debe citar al menos una fuente.';
    }
    return this.uncitedPositions.length ? 'Corrige o quita las citas sin bloque.' : null;
  }

  choose(outcome: ReviewOutcome): void {
    this.outcome = outcome;
    this.confirming = false;
    this.editing.emit(outcome === 'modify' && this.caseType !== 'recommendation');
  }

  toggleRank(rank: number): void {
    if (this.selectedRanks.has(rank)) {
      this.selectedRanks.delete(rank);
    } else {
      this.selectedRanks.add(rank);
    }
  }

  removePair(index: number): void {
    if (this.pairs.length > 1) {
      this.pairs.splice(index, 1);
    }
  }

  review(): void {
    if (!this.blocker) {
      this.confirming = true;
      setTimeout(() => this.confirmation?.nativeElement.focus());
    }
  }

  back(): void {
    this.confirming = false;
    setTimeout(() => this.reviewButton?.nativeElement.focus());
  }

  request(): ResolutionRequest {
    const outcome = this.outcome as ReviewOutcome;
    const body: ResolutionRequest = { outcome };
    const justification = this.justification.trim();
    if (justification) {
      body.justification = justification;
    }
    if (outcome === 'modify') {
      if (this.caseType === 'recommendation') {
        body.retained_ranks = this.ranks;
      } else if (this.caseType === 'rag') {
        body.answer_text = this.answerText.trim();
      } else {
        body.qa_pairs = this.pairs.map((p) => ({
          question: p.question.trim(),
          answer: p.answer.trim(),
        }));
      }
    }
    return body;
  }

  submit(): void {
    if (this.submitting || this.blocker) {
      return;
    }
    this.submitting = true;
    this.error = null;
    this.traceId = null;
    this.reviews.resolve(this.reviewCase.case_id, this.request()).subscribe({
      next: (resolution) => {
        this.submitting = false;
        this.outcome = null;
        this.justification = '';
        this.resolved.emit(resolution);
      },
      error: (error: GovernanceError) => {
        this.submitting = false;
        this.confirming = false;
        this.error = errorMessage(error);
        this.traceId = error.traceId;
        this.staleError = STALE_CODES.has(error.code);
      },
    });
  }
}
