import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { JobsComponent } from './presentation/pages/jobs/jobs.component';
import { JobListComponent } from './presentation/components/job-list/job-list.component';
import { JobDetailComponent } from './presentation/components/job-detail/job-detail.component';
import { JobsPageRoutingModule } from './jobs-page-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [JobsPageRoutingModule, SharedModule, CommonModule, FormsModule],
  exports: [],
  declarations: [JobsComponent, JobListComponent, JobDetailComponent],
  providers: [],
})
export class JobsPageModule {}
