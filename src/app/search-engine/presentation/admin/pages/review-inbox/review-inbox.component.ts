import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import {
  CaseStatus,
  CaseType,
  GovernanceError,
  ReviewCaseSummary,
} from 'src/app/search-engine/domain/entities/review.interface';
import {
  CASE_TYPE_LABELS,
  OUTCOME_LABELS,
  URGENT_MS,
  errorMessage,
  reasonLabel,
  timeLeft,
} from 'src/app/search-engine/domain/entities/review-rules';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';

const PAGE_SIZE = 25;

@Component({
  selector: 'app-review-inbox',
  templateUrl: './review-inbox.component.html',
})
export class ReviewInboxComponent implements OnInit, OnDestroy {
  readonly typeFilters: { value: CaseType | null; label: string }[] = [
    { value: null, label: 'Todos' },
    { value: 'qa', label: CASE_TYPE_LABELS.qa },
    { value: 'recommendation', label: CASE_TYPE_LABELS.recommendation },
    { value: 'rag', label: CASE_TYPE_LABELS.rag },
  ];
  readonly statusFilters: { value: CaseStatus; label: string }[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'expired', label: 'Vencidos' },
    { value: 'approve', label: 'Aprobados' },
    { value: 'modify', label: 'Modificados' },
    { value: 'reject', label: 'Rechazados' },
  ];
  readonly typeLabels = CASE_TYPE_LABELS;
  readonly outcomeLabels = OUTCOME_LABELS;
  readonly reasonLabel = reasonLabel;

  caseType: CaseType | null = null;
  status: CaseStatus = 'pending';
  cases: ReviewCaseSummary[] = [];
  nextCursor: string | null = null;
  loading = false;
  error: string | null = null;
  traceId: string | null = null;
  caseIdInput = '';
  now = Date.now();

  private request?: Subscription;
  private clock?: Subscription;

  constructor(
    private reviews: ReviewService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
    this.clock = interval(30000).subscribe(() => (this.now = Date.now()));
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.clock?.unsubscribe();
  }

  setType(caseType: CaseType | null): void {
    this.caseType = caseType;
    this.load();
  }

  setStatus(status: CaseStatus): void {
    this.status = status;
    this.load();
  }

  load(cursor: string | null = null): void {
    this.request?.unsubscribe();
    this.loading = true;
    this.error = null;
    this.traceId = null;
    if (!cursor) {
      this.cases = [];
      this.nextCursor = null;
    }
    this.request = this.reviews
      .listCases({
        status: this.status,
        caseType: this.caseType ?? undefined,
        cursor,
        limit: PAGE_SIZE,
      })
      .subscribe({
        next: (page) => {
          this.cases = [...this.cases, ...page.items];
          this.nextCursor = page.next_cursor;
          this.loading = false;
        },
        error: (error: GovernanceError) => {
          this.error = errorMessage(error);
          this.traceId = error.traceId;
          this.loading = false;
        },
      });
  }

  open(caseId: string): void {
    const id = caseId.trim();
    if (id) {
      this.router.navigate(['/admin/dashboard/reviews', id]);
    }
  }

  remaining(summary: ReviewCaseSummary): string | null {
    return timeLeft(summary.expires_at, this.now);
  }

  urgent(summary: ReviewCaseSummary): boolean {
    return Date.parse(summary.expires_at) - this.now < URGENT_MS;
  }
}
