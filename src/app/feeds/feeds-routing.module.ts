import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedPageComponent } from './presentation/pages/feed-page.component';
import { researcherOnlyGuard } from 'src/guards/researcher-only.guard';

const routes: Routes = [
  {
    path: '',
    component: FeedPageComponent,
    canActivate: [researcherOnlyGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeedsRoutingModule {}
