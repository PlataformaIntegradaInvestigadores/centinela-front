import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { CompanyProfilePageComponent } from './presentation/pages/profile-company-page/profile-company-page.component';
import { ProfileCompanyRoutingModule } from './profile-company-routing.module';
import { CreateJobModalComponent } from './presentation/components/create-job-modal/create-job-modal.component';
import { EditCompanyProfileModalComponent } from './presentation/components/edit-company-profile-modal/edit-company-profile-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    ProfileCompanyRoutingModule,
    SharedModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [],
  declarations: [
    CompanyProfilePageComponent,
    CreateJobModalComponent,
    EditCompanyProfileModalComponent,
  ],
  providers: [],
})
export class ProfileCompanyPageModule {}
