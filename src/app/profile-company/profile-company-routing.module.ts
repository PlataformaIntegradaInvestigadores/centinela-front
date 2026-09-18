import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyProfilePageComponent } from './presentation/pages/profile-company-page/profile-company-page.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyProfilePageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileCompanyRoutingModule {}
