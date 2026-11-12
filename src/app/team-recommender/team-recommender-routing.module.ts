import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TeamBuilderPageComponent } from './presentation/pages/team-builder-page/team-builder-page.component';

const routes: Routes = [
  {
    path: '',
    component: TeamBuilderPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRecommenderRoutingModule {}
