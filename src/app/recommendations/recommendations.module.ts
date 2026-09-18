import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';

import { RecommendationsRoutingModule } from './recommendations-routing.module';
import { RecommendationsPageComponent } from './presentation/pages/recommendations-page/recommendations-page.component';

@NgModule({
  declarations: [RecommendationsPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    FontAwesomeModule,
    NgxPaginationModule,
    RecommendationsRoutingModule,
  ],
})
export class RecommendationsModule {}
