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

const REASON_LABELS: Record<string, string> = {
  hidden_by_model: 'Ocultado por el modelo',
  reported: 'Reportado por usuarios',
  deferred: 'Baja confianza del modelo',
};

const DECISION_LABELS: Record<string, string> = {
  approve: 'Aprobado',
  keep_hidden: 'Mantener oculto',
  block: 'Bloqueado',
};

@Component({
  selector: 'app-review-queue-page',
  templateUrl: './review-queue-page.component.html',
  styleUrls: ['./review-queue-page.component.css'],
})
export class ReviewQueuePageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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
          this.error = this.moderationService.errorMessage(error, 'No se pudo cargar la cola.');
        },
      });
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
          (this.error = this.moderationService.errorMessage(error, 'No se pudo abrir el caso.')),
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
          this.feedback = `Decisión registrada: ${this.decisionLabel(decision)}.`;
          this.notes = '';
          this.loadQueue();
          this.openCase({ id: caseId } as ReviewCase, true);
        },
        error: (error) =>
          (this.feedback = this.moderationService.errorMessage(
            error,
            'No se pudo registrar la decisión.',
          )),
      });
  }

  /**
   * Parte el texto en segmentos usando los offsets de los tokens más
   * salientes (XAI). Se renderiza con interpolación, nunca con innerHTML.
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
    const alpha = 0.2 + 0.6 * segment.saliency;
    return { 'background-color': `rgba(239, 68, 68, ${alpha.toFixed(2)})` };
  }

  percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`;
  }

  reasonLabel(reason: string): string {
    return REASON_LABELS[reason] || reason;
  }

  decisionLabel(decision: string): string {
    return DECISION_LABELS[decision] || decision;
  }

  authorName(item: ReviewCase): string {
    const author = item.context?.author;
    if (!author) return item.author_id || 'Desconocido';
    const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim();
    return fullName || author.username || item.author_id || 'Desconocido';
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
