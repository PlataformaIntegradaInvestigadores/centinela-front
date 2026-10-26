import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ModerationRoutingModule } from './moderation-routing.module';
import { ReviewQueuePageComponent } from './presentation/pages/review-queue/review-queue-page.component';

@NgModule({
  declarations: [ReviewQueuePageComponent],
  imports: [CommonModule, FormsModule, SharedModule, ModerationRoutingModule],
})
export class ModerationModule {}
