import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminComponent } from '../admin/pages/login/admin.component';
import { AdminRoutingModule } from './admin-rounting.module';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { SidebarDashboardComponent } from './components/sidebar/sidebar.component';
import { FooterDashboardComponent } from './components/footer/footer.component';
import { HeaderDashboardComponent } from './components/header/header.component';
import { MainContentComponent } from './components/main-content/main-content.component';
import { UpdateCentinelaComponent } from './components/update-centinela/update-centinela.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoggerComponent } from './components/logger/logger.component';
import { FairnessDashboardComponent } from './pages/fairness-dashboard/fairness-dashboard.component';
import { StrategicAnalyticsComponent } from './components/strategic-analytics/strategic-analytics.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  imports: [
    HttpClientModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    AdminRoutingModule,
    CommonModule,
    MatProgressSpinnerModule,
    FormsModule,
    NgxChartsModule,
  ],
  exports: [],
  declarations: [
    AdminComponent,
    AdminDashboardComponent,
    FooterDashboardComponent,
    HeaderDashboardComponent,
    SidebarDashboardComponent,
    MainContentComponent,
    UpdateCentinelaComponent,
    LoggerComponent,
    FairnessDashboardComponent,
    StrategicAnalyticsComponent,
  ],
  providers: [],
})
export class AdminModule {}
