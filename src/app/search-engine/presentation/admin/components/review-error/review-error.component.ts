import { Component, EventEmitter, Input, Output } from '@angular/core';

/** A failed request: what happened, its trace for support, and how to try again. */
@Component({
  selector: 'app-review-error',
  template: `<div class="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
    <p>{{ message }}</p>
    <p *ngIf="traceId" class="mt-1 text-red-700">
      Traza para soporte: <span translate="no" class="break-all">{{ traceId }}</span>
    </p>
    <button
      *ngIf="actionLabel"
      type="button"
      (click)="action.emit()"
      class="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium text-red-800 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
    >
      {{ actionLabel }}
    </button>
  </div>`,
})
export class ReviewErrorComponent {
  @Input({ required: true }) message!: string;
  @Input() traceId: string | null = null;
  @Input() actionLabel: string | null = null;
  @Output() action = new EventEmitter<void>();
}
