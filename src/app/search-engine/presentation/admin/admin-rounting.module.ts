import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './pages/login/admin.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UpdateCentinelaComponent } from './components/update-centinela/update-centinela.component';
import { MainContentComponent } from './components/main-content/main-content.component';
import { loginGuard } from 'src/guards/login.guard';
import { LoggerComponent } from './components/logger/logger.component';
import { FairnessDashboardComponent } from './pages/fairness-dashboard/fairness-dashboard.component';
import { StrategicAnalyticsComponent } from './components/strategic-analytics/strategic-analytics.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
  },
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    canActivate: [loginGuard],
    children: [
      {
        path: 'main-content',
        component: MainContentComponent,
      },
      {
        path: 'update-centinela',
        component: UpdateCentinelaComponent,
      },
      {
        path: 'logger',
        component: LoggerComponent,
      },
      {
        path: 'fairness',
        component: FairnessDashboardComponent,
      },
      {
        path: 'analytics',
        component: StrategicAnalyticsComponent,
      },
      {
        path: '',
        redirectTo: 'main-content',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'admin',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
  providers: [],
})
export class AdminRoutingModule {}
