import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ModerationService } from '../../../domain/services/moderation.service';
import {
  ModerationDecision,
  ReviewCase,
  ReviewCaseDetail,
  ReviewQueueFilters,
} from '../../../domain/entities/moderation.interface';

export interface TextSegment {
  text: string;
  saliency: number;
  highlighted: boolean;
}

export interface ReasonTab {
  value: string;
  label: string;
  hint: string;
}

const REASON_LABELS: Record<string, string> = {
  hidden_by_model: 'Hidden by model',
  reported: 'Reported by users',
  deferred: 'Low confidence (τ-deferred)',
  review_band: 'Review band (0.65–0.80)',
};

const DECISION_LABELS: Record<string, string> = {
  approve: 'Approved',
  keep_hidden: 'Kept hidden',
  block: 'Blocked',
};

const VISIBILITY_LABELS: Record<string, string> = {
  visible: 'Visible',
  hidden: 'Hidden',
  blocked: 'Blocked',
};

const STATUS_LABELS: Record<string, string> = {
  none: 'Not queued',
  pending: 'Pending',
  resolved: 'Resolved',
};

@Component({
  selector: 'app-review-queue-page',
  templateUrl: './review-queue-page.component.html',
  styleUrls: ['./review-queue-page.component.css'],
})
export class ReviewQueuePageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  readonly reasonTabs: ReasonTab[] = [
    { value: '', label: 'All', hint: 'Every case in the queue' },
    {
      value: 'hidden_by_model',
      label: 'Hidden by model',
      hint: 'p(hate) ≥ threshold, hidden automatically',
    },
    { value: 'reported', label: 'Reported', hint: 'Reported by users' },
    {
      value: 'deferred',
      label: 'Low confidence',
      hint: 'Model confidence below τ, deferred to a human',
    },
    {
      value: 'review_band',
      label: 'Review band',
      hint: 'p(hate) between 0.65 and 0.80; visible, pending review',
    },
  ];

  filters: ReviewQueueFilters = {
    status: 'pending',
    reason: '',
    content_type: '',
    limit: 20,
    offset: 0,
  };
  cases: ReviewCase[] = [];
  total = 0;
  isLoading = false;
  error: string | null = null;

  selected: ReviewCaseDetail | null = null;
  isLoadingDetail = false;
  notes = '';
  isDeciding = false;
  feedback: string | null = null;

  constructor(private moderationService: ModerationService) {}

  ngOnInit(): void {
    this.loadQueue();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQueue(resetOffset = false): void {
    if (resetOffset) {
      this.filters.offset = 0;
    }
    this.isLoading = true;
    this.error = null;
    this.moderationService
      .getQueue(this.filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (page) => {
          this.cases = page.items;
          this.total = page.total;
        },
        error: (error) => {
          this.cases = [];
          this.total = 0;
          this.error = this.moderationService.errorMessage(
            error,
            'The review queue could not be loaded.',
          );
        },
      });
  }

  setReason(reason: string): void {
    if (this.filters.reason === reason) return;
    this.filters.reason = reason;
    this.loadQueue(true);
  }

  get rangeStart(): number {
    return this.total ? this.filters.offset + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.filters.offset + this.filters.limit, this.total);
  }

  get hasPrevious(): boolean {
    return this.filters.offset > 0;
  }

  get hasNext(): boolean {
    return this.filters.offset + this.filters.limit < this.total;
  }

  previousPage(): void {
    this.filters.offset = Math.max(0, this.filters.offset - this.filters.limit);
    this.loadQueue();
  }

  nextPage(): void {
    this.filters.offset += this.filters.limit;
    this.loadQueue();
  }

  openCase(item: ReviewCase, keepFeedback = false): void {
    this.isLoadingDetail = true;
    if (!keepFeedback) {
      this.feedback = null;
    }
    this.notes = '';
    this.moderationService
      .getCase(item.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingDetail = false)),
      )
      .subscribe({
        next: (detail) => (this.selected = detail),
        error: (error) =>
          (this.error = this.moderationService.errorMessage(
            error,
            'The case could not be opened.',
          )),
      });
  }

  closeCase(): void {
    this.selected = null;
  }

  decide(decision: ModerationDecision): void {
    if (!this.selected || this.isDeciding) return;
    const caseId = this.selected.id;
    this.isDeciding = true;
    this.feedback = null;
    this.moderationService
      .decide(caseId, decision, this.notes)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isDeciding = false)),
      )
      .subscribe({
        next: () => {
          this.feedback = `Decision saved: ${this.decisionLabel(decision)}.`;
          this.notes = '';
          this.loadQueue();
          this.openCase({ id: caseId } as ReviewCase, true);
        },
        error: (error) =>
          (this.feedback = this.moderationService.errorMessage(
            error,
            'The decision could not be saved.',
          )),
      });
  }

  /**
   * Splits the text into segments using the offsets of the most salient
   * tokens (XAI). Rendered with interpolation, never with innerHTML.
   */
  segments(item: ReviewCase): TextSegment[] {
    const text = item.text || '';
    const tokens = (item.explanation?.top_tokens || [])
      .filter((t) => t.start >= 0 && t.end <= text.length && t.end > t.start && t.saliency > 0)
      .sort((a, b) => a.start - b.start);
    const maxSaliency = Math.max(...tokens.map((t) => t.saliency), 0);
    const segments: TextSegment[] = [];
    let cursor = 0;
    for (const token of tokens) {
      if (token.start < cursor) continue;
      if (token.start > cursor) {
        segments.push({ text: text.slice(cursor, token.start), saliency: 0, highlighted: false });
      }
      segments.push({
        text: text.slice(token.start, token.end),
        saliency: maxSaliency ? token.saliency / maxSaliency : 0,
        highlighted: true,
      });
      cursor = token.end;
    }
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), saliency: 0, highlighted: false });
    }
    return segments;
  }

  highlightStyle(segment: TextSegment): Record<string, string> {
    // Light-to-strong amber keeps dark text readable at every intensity.
    const alpha = 0.25 + 0.55 * segment.saliency;
    return {
      'background-color': `rgba(251, 191, 36, ${alpha.toFixed(2)})`,
      'box-shadow': `inset 0 -2px 0 rgba(217, 119, 6, ${(0.4 + 0.6 * segment.saliency).toFixed(2)})`,
    };
  }

  /** Top salient tokens sorted by influence, for the legend chips. */
  topTokens(item: ReviewCase, limit = 5): { token: string; weight: number }[] {
    const tokens = [...(item.explanation?.top_tokens || [])]
      .filter((t) => t.saliency > 0)
      .sort((a, b) => b.saliency - a.saliency)
      .slice(0, limit);
    const max = tokens.length ? tokens[0].saliency : 0;
    return tokens.map((t) => ({ token: t.token, weight: max ? t.saliency / max : 0 }));
  }

  barWidth(value: number | null | undefined): string {
    return value === null || value === undefined ? '0%' : `${Math.round(value * 100)}%`;
  }

  barClass(value: number | null): string {
    if (value === null) return 'bg-gray-300';
    if (value >= 0.8) return 'bg-red-500';
    if (value >= 0.5) return 'bg-amber-500';
    return 'bg-green-500';
  }

  visibilityLabel(visibility: string): string {
    return VISIBILITY_LABELS[visibility] || visibility;
  }

  visibilityClass(visibility: string): string {
    if (visibility === 'blocked') return 'bg-red-100 text-red-700 ring-red-200';
    if (visibility === 'hidden') return 'bg-amber-100 text-amber-800 ring-amber-200';
    return 'bg-green-100 text-green-700 ring-green-200';
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  reasonClass(reason: string): string {
    if (reason === 'reported') return 'bg-purple-100 text-purple-700';
    if (reason === 'deferred') return 'bg-sky-100 text-sky-700';
    if (reason === 'review_band') return 'bg-amber-100 text-amber-800';
    if (reason === 'hidden_by_model') return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-700';
  }

  percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`;
  }

  reasonLabel(reason: string): string {
    if (REASON_LABELS[reason]) return REASON_LABELS[reason];
    // Reasons added later by hatespeech-service still render as readable text.
    const text = (reason || '').replace(/[_-]+/g, ' ').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Other';
  }

  decisionLabel(decision: string): string {
    return DECISION_LABELS[decision] || decision;
  }

  authorName(item: ReviewCase): string {
    const author = item.context?.author;
    if (!author) return item.author_id || 'Unknown';
    const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim();
    return fullName || author.username || item.author_id || 'Unknown';
  }

  pHateClass(value: number | null): string {
    if (value === null) return 'bg-gray-100 text-gray-700';
    if (value >= 0.8) return 'bg-red-100 text-red-700';
    if (value >= 0.5) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  }

  trackByCaseId(index: number, item: ReviewCase): number {
    return item.id;
  }
}
