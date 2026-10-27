import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './pages/login/admin.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UpdateCentinelaComponent } from './components/update-centinela/update-centinela.component';
import { MainContentComponent } from './components/main-content/main-content.component';
import { adminAreaGuard, adminSessionGuard } from 'src/guards/admin-area.guard';
import { moderatorGuard } from 'src/guards/moderator.guard';
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
    canActivate: [adminAreaGuard],
    children: [
      {
        path: 'main-content',
        component: MainContentComponent,
        canActivate: [adminSessionGuard],
      },
      {
        path: 'update-centinela',
        component: UpdateCentinelaComponent,
        canActivate: [adminSessionGuard],
      },
      {
        path: 'logger',
        component: LoggerComponent,
        canActivate: [adminSessionGuard],
      },
      {
        path: 'fairness',
        component: FairnessDashboardComponent,
        canActivate: [adminSessionGuard],
      },
      {
        path: 'analytics',
        component: StrategicAnalyticsComponent,
        canActivate: [adminSessionGuard],
      },
      {
        // Hate-speech moderation (review queue). Requires a Centinela account
        // listed as moderator in social-service (MODERATOR_USER_IDS / staff).
        path: 'moderation',
        loadChildren: () =>
          import('src/app/moderation/moderation.module').then((m) => m.ModerationModule),
        canActivate: [moderatorGuard],
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
