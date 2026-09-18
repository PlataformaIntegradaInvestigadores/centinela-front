import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RecommendationsPageComponent } from './presentation/pages/recommendations-page/recommendations-page.component';

const routes: Routes = [
  {
    path: '',
    component: RecommendationsPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecommendationsRoutingModule {}
