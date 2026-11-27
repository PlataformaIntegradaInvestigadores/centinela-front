import { Component, Input } from '@angular/core';
import { reasonLabel } from 'src/app/search-engine/domain/entities/review-rules';

/** Why the governance held an output: the plain reason first, the policy code beside it. */
@Component({
  selector: 'app-review-reasons',
  template: `<ul class="flex flex-col gap-0.5">
    <li *ngFor="let code of codes">
      {{ label(code) }}
      <span *ngIf="showCodes" class="text-xs text-gray-500" translate="no">{{ code }}</span>
    </li>
  </ul>`,
})
export class ReviewReasonsComponent {
  @Input({ required: true }) codes: string[] = [];
  @Input() showCodes = false;
  readonly label = reasonLabel;
}
