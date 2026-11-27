import { Component, Input } from '@angular/core';
import { ResolutionView } from 'src/app/search-engine/domain/entities/review.interface';
import { OUTCOME_LABELS } from 'src/app/search-engine/domain/entities/review-rules';

@Component({
  selector: 'app-review-resolution-view',
  templateUrl: './review-resolution-view.component.html',
})
export class ReviewResolutionViewComponent {
  @Input({ required: true }) resolution!: ResolutionView;
  readonly outcomeLabels = OUTCOME_LABELS;
}
