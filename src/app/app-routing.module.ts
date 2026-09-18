import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RedirectComponent } from './auth/presentation/redirect/redirect.component';
import { AuthRedirectGuard } from 'src/guards/auth-redirect.guard';
import { researcherOnlyGuard } from 'src/guards/researcher-only.guard';
// import { DebateChatComponent } from './consensus/presentation/components/debate-chat/debate-chat.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: RedirectComponent,
    canActivate: [AuthRedirectGuard],
  },
  {
    path: 'register',
    component: RedirectComponent,
    canActivate: [AuthRedirectGuard],
  },
  {
    path: 'home',
    loadChildren: () =>
      import('src/app/search-engine/presentation/home-page/home-page.module').then(
        (m) => m.HomePageModule,
      ),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('src/app/search-engine/presentation/admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'profile/:id',
    loadChildren: () =>
      import('src/app/profile/profile-page.module').then((m) => m.ProfilePageModule),
  },
  {
    path: 'feeds',
    loadChildren: () => import('src/app/feeds/feeds.module').then((m) => m.FeedsModule),
    canActivate: [researcherOnlyGuard],
  },
  {
    path: 'jobs/:id',
    loadChildren: () => import('src/app/jobs/jobs-page.module').then((m) => m.JobsPageModule),
  },
  {
    path: 'company/:id',
    loadChildren: () =>
      import('src/app/profile-company/profile-company.module').then(
        (m) => m.ProfileCompanyPageModule,
      ),
  },

  /* Siempre al ultimo */
  {
    path: '**', // Redirects to home when the route is not correct
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
