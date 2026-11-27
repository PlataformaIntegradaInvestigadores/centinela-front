import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import {
  CaseType,
  GovernanceError,
  RagSection,
  ResolutionResponse,
  ReviewCase,
  caseTypeOf,
} from 'src/app/search-engine/domain/entities/review.interface';
import {
  CASE_TYPE_LABELS,
  OUTCOME_LABELS,
  URGENT_MS,
  errorMessage,
  metricLabel,
  reasonLabel,
  selectionLabel,
  timeLeft,
} from 'src/app/search-engine/domain/entities/review-rules';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';
import { ReviewResolutionFormComponent } from '../../components/review-resolution-form/review-resolution-form.component';
import { HasUnsavedDecision } from './unsaved-decision.guard';

export type AnswerSegment = { text: string } | { position: number; known: boolean };

/** Splits a RAG paragraph into text and `[n]` citations, so nothing is rendered as HTML. */
export function answerSegments(paragraph: string, blockCount: number): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  let last = 0;
  for (const match of paragraph.matchAll(/\[(\d+)\]/g)) {
    const start = match.index as number;
    if (start > last) {
      segments.push({ text: paragraph.slice(last, start) });
    }
    const position = Number(match[1]);
    segments.push({ position, known: position >= 1 && position <= blockCount });
    last = start + match[0].length;
  }
  if (last < paragraph.length) {
    segments.push({ text: paragraph.slice(last) });
  }
  return segments;
}

@Component({
  selector: 'app-review-case',
  templateUrl: './review-case.component.html',
})
export class ReviewCaseComponent implements OnInit, OnDestroy, HasUnsavedDecision {
  readonly typeLabels = CASE_TYPE_LABELS;
  readonly outcomeLabels = OUTCOME_LABELS;
  readonly reasonLabel = reasonLabel;
  readonly selectionLabel = selectionLabel;

  @ViewChild(ReviewResolutionFormComponent) form?: ReviewResolutionFormComponent;

  /** The decision editor needs the wide column to sit beside the original text. */
  editing = false;
  /** After a resolution: whether the queue still has another pending case. */
  nextState: 'idle' | 'loading' | 'none' | 'error' = 'idle';

  caseId = '';
  reviewCase: ReviewCase | null = null;
  caseType: CaseType = 'qa';
  loading = false;
  error: string | null = null;
  traceId: string | null = null;
  now = Date.now();

  private request?: Subscription;
  private routeChanges?: Subscription;
  private clock?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviews: ReviewService,
  ) {}

  hasUnsavedDecision(): boolean {
    return !!this.form?.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedDecision()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /** Opens the pending case closest to its deadline, so a queue can be cleared in one pass. */
  nextPending(): void {
    this.nextState = 'loading';
    this.reviews.listCases({ status: 'pending', limit: 2 }).subscribe({
      next: (page) => {
        const next = page.items.find((item) => item.case_id !== this.caseId);
        this.nextState = next ? 'idle' : 'none';
        if (next) {
          this.router.navigate(['/admin/dashboard/reviews', next.case_id]);
        }
      },
      error: () => (this.nextState = 'error'),
    });
  }

  ngOnInit(): void {
    this.routeChanges = this.route.paramMap.subscribe((params) => {
      this.caseId = params.get('caseId') ?? '';
      this.load();
    });
    this.clock = interval(15000).subscribe(() => (this.now = Date.now()));
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.routeChanges?.unsubscribe();
    this.clock?.unsubscribe();
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading = true;
    this.error = null;
    this.traceId = null;
    this.reviewCase = null;
    this.editing = false;
    this.nextState = 'idle';
    this.request = this.reviews.getCase(this.caseId).subscribe({
      next: (reviewCase) => {
        this.reviewCase = reviewCase;
        this.caseType = caseTypeOf(reviewCase);
        this.loading = false;
      },
      error: (error: GovernanceError) => {
        this.error = errorMessage(error);
        this.traceId = error.traceId;
        this.loading = false;
      },
    });
  }

  /** The window closed on screen before the service recorded it. */
  get overdue(): boolean {
    const reviewCase = this.reviewCase;
    return !!reviewCase && reviewCase.status === 'pending' && this.remaining === null;
  }

  get remaining(): string | null {
    return this.reviewCase ? timeLeft(this.reviewCase.expires_at, this.now) : null;
  }

  get urgent(): boolean {
    return !!this.reviewCase && Date.parse(this.reviewCase.expires_at) - this.now < URGENT_MS;
  }

  get open(): boolean {
    return this.reviewCase?.status === 'pending' && !this.overdue;
  }

  onResolved(resolution: ResolutionResponse): void {
    if (!this.reviewCase) {
      return;
    }
    this.reviewCase = { ...this.reviewCase, status: resolution.outcome, resolution };
    this.editing = false;
  }

  /** The case changed on the server (expired or resolved elsewhere): show its real state. */
  onStale(): void {
    this.load();
  }

  paragraphs(rag: RagSection): AnswerSegment[][] {
    return rag.answer_text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => answerSegments(p, rag.blocks.length));
  }

  isText(segment: AnswerSegment): segment is { text: string } {
    return 'text' in segment;
  }

  asCitation(segment: AnswerSegment): { position: number; known: boolean } {
    return segment as { position: number; known: boolean };
  }

  inPlan(rank: number): boolean {
    const plan = this.reviewCase?.review_plan;
    return !!plan && plan.retained_ranks.includes(rank);
  }

  /** Labelled metric rows; numbers stay numbers so the template formats them for the locale. */
  entries(record: Record<string, unknown> | undefined): { key: string; value: unknown }[] {
    return Object.entries(record ?? {}).map(([key, value]) => ({
      key: metricLabel(key),
      value: typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
    }));
  }
}
