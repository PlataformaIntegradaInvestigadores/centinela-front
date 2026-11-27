import { Component, Input } from '@angular/core';

let nextId = 0;

/** A titled block of the review screens; the heading names the region for assistive tech. */
@Component({
  selector: 'app-review-panel',
  template: `<section
    class="rounded-xl border border-gray-200 bg-white p-6"
    [attr.aria-labelledby]="headingId"
  >
    <h2 [id]="headingId" class="text-base font-semibold text-gray-900 [text-wrap:balance]">
      {{ heading }}
    </h2>
    <p *ngIf="description" class="mt-1 max-w-prose text-sm text-gray-600">{{ description }}</p>
    <div class="mt-4"><ng-content></ng-content></div>
  </section>`,
})
export class ReviewPanelComponent {
  @Input({ required: true }) heading!: string;
  @Input() description: string | null = null;
  readonly headingId = `review-panel-${++nextId}`;
}
