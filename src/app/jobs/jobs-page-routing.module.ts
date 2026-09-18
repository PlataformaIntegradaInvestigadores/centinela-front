import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobsComponent } from './presentation/pages/jobs/jobs.component';

const routes: Routes = [
  {
    path: '',
    component: JobsComponent,
    /* children: [
      { path: 'recomendaciones', component: AboutMeComponent },
      { path: 'nombre-trabajo/:id', component: AboutMeComponent },
    ] */
  },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JobsPageRoutingModule {}
