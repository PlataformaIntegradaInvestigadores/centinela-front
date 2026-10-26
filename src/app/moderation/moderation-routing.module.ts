import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReviewQueuePageComponent } from './presentation/pages/review-queue/review-queue-page.component';

const routes: Routes = [{ path: '', component: ReviewQueuePageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModerationRoutingModule {}
