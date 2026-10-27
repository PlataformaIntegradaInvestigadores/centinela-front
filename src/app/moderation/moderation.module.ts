import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModerationRoutingModule } from './moderation-routing.module';
import { ReviewQueuePageComponent } from './presentation/pages/review-queue/review-queue-page.component';

/**
 * Hate-speech review queue, lazy-loaded inside the admin dashboard
 * (/admin/dashboard/moderation). It does not import SharedModule on purpose:
 * SharedModule re-exports the home routes and its catch-all would shadow ours.
 */
@NgModule({
  declarations: [ReviewQueuePageComponent],
  imports: [CommonModule, FormsModule, ModerationRoutingModule],
})
export class ModerationModule {}
