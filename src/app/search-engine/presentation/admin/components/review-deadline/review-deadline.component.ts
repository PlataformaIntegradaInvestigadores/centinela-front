import { Component, Input } from '@angular/core';
import { CaseStatus } from 'src/app/search-engine/domain/entities/review.interface';
import {
  OUTCOME_LABELS,
  URGENT_MS,
  timeLeft,
} from 'src/app/search-engine/domain/entities/review-rules';

/**
 * How much time a case has left, or its final state. One vocabulary for the inbox and the case:
 * neutral while there is time, amber under two hours, red once due.
 */
@Component({
  selector: 'app-review-deadline',
  template: `<span
    class="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums"
    [ngClass]="tone"
    ><span class="h-1.5 w-1.5 rounded-full" [ngClass]="dot" aria-hidden="true"></span
    >{{ label }}</span
  >`,
})
export class ReviewDeadlineComponent {
  @Input({ required: true }) status!: CaseStatus;
  @Input({ required: true }) expiresAt!: string;
  @Input() now = Date.now();

  get pending(): boolean {
    return this.status === 'pending';
  }

  get due(): boolean {
    return this.pending && timeLeft(this.expiresAt, this.now) === null;
  }

  get urgent(): boolean {
    return this.pending && !this.due && Date.parse(this.expiresAt) - this.now < URGENT_MS;
  }

  get label(): string {
    if (!this.pending) {
      return OUTCOME_LABELS[this.status];
    }
    const left = timeLeft(this.expiresAt, this.now);
    return left === null ? 'Plazo cumplido' : `Vence en ${left}`;
  }

  get tone(): string {
    if (this.due) {
      return 'text-red-700 font-medium';
    }
    return this.urgent ? 'text-amber-800 font-medium' : 'text-gray-700';
  }

  get dot(): string {
    if (!this.pending) {
      return 'bg-gray-400';
    }
    if (this.due) {
      return 'bg-red-600';
    }
    return this.urgent ? 'bg-amber-500' : 'bg-emerald-600';
  }
}
