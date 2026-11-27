import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import {
  CaseStatus,
  CaseType,
  GovernanceError,
  ReviewCaseSummary,
} from 'src/app/search-engine/domain/entities/review.interface';
import { CASE_TYPE_LABELS, errorMessage } from 'src/app/search-engine/domain/entities/review-rules';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';

const PAGE_SIZE = 25;
const CASE_TYPES: CaseType[] = ['qa', 'recommendation', 'rag'];
const STATUSES: CaseStatus[] = ['pending', 'expired', 'approve', 'modify', 'reject'];

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
  private queryChanges?: Subscription;

  constructor(
    private reviews: ReviewService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Filters live in the URL so a view can be bookmarked, shared and restored with Back.
    this.queryChanges = this.route.queryParamMap.subscribe((params) => {
      const type = params.get('tipo') as CaseType | null;
      const status = params.get('estado') as CaseStatus | null;
      this.caseType = type && CASE_TYPES.includes(type) ? type : null;
      this.status = status && STATUSES.includes(status) ? status : 'pending';
      this.load();
    });
    this.clock = interval(30000).subscribe(() => (this.now = Date.now()));
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.clock?.unsubscribe();
    this.queryChanges?.unsubscribe();
  }

  setType(caseType: CaseType | null): void {
    this.navigate({ tipo: caseType });
  }

  setStatus(status: CaseStatus): void {
    this.navigate({ estado: status === 'pending' ? null : status });
  }

  private navigate(queryParams: Record<string, string | null>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  get statusLabel(): string {
    return (this.statusFilters.find((f) => f.value === this.status) as { label: string }).label;
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
}
