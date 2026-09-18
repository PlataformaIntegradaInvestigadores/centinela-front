import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { GeneralComponent } from './presentation/pages/general/general.component';
import { AffiliationComponent } from './presentation/pages/affiliation/affiliation.component';
import { TopicComponent } from './presentation/pages/topic/topic.component';
import { DashboardPageComponent } from './presentation/pages/dashboard-page/dashboard-page.component';
import { AffiliationDashboardComponent } from './presentation/pages/affiliation-dashboard/affiliation-dashboard.component';
import { TopicDashboardComponent } from './presentation/pages/topic-dashboard/topic-dashboard.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    children: [
      {
        path: '',
        component: GeneralComponent,
      },
      {
        path: 'affiliations',
        component: AffiliationComponent,
      },
      {
        path: 'by-affiliation/:id',
        component: AffiliationDashboardComponent,
      },
      {
        path: 'topic',
        component: TopicComponent,
      },
      {
        path: 'by-topic/:name',
        component: TopicDashboardComponent,
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
