/* Modules */
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { VisualsService } from '../shared/domain/services/visuals.service';
import { GeneralComponent } from './presentation/pages/general/general.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LowerCasePipe,
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  TitleCasePipe,
} from '@angular/common';
import { SearchBarComponent } from './presentation/components/shared/search-bar/search-bar.component';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AffiliationComponent } from './presentation/pages/affiliation/affiliation.component';
import { MatIconModule } from '@angular/material/icon';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TopicComponent } from './presentation/pages/topic/topic.component';
import { RouterModule } from '@angular/router';
import { DashboardPageComponent } from './presentation/pages/dashboard-page/dashboard-page.component';
import { CountUpModule } from 'ngx-countup';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AffiliationDashboardComponent } from './presentation/pages/affiliation-dashboard/affiliation-dashboard.component';
import { TopicDashboardComponent } from './presentation/pages/topic-dashboard/topic-dashboard.component';

@NgModule({
  declarations: [
    GeneralComponent,
    SearchBarComponent,
    AffiliationComponent,
    TopicComponent,
    DashboardPageComponent,
    AffiliationDashboardComponent,
    TopicDashboardComponent,
  ],
  exports: [
    GeneralComponent,
    SearchBarComponent,
    AffiliationComponent,
    AffiliationDashboardComponent,
  ],
  imports: [
    DashboardRoutingModule,
    RouterModule,
    FormsModule,
    NgForOf,
    NgIf,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatIconModule,
    SharedModule,
    CountUpModule,
    NgSwitch,
    NgSwitchCase,
    MatProgressSpinnerModule,
    LowerCasePipe,
    TitleCasePipe,
  ],
  providers: [VisualsService],
})
export class DashboardModule {}
