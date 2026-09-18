import { NgModule } from '@angular/core';
import { SearchBoxComponent } from './components/search-box/search-box.component';
import { LoaderComponent } from './components/loader/loader.component';
import { MiniLoaderComponent } from './components/loader/mini-loader/mini-loader.component';
import { FiltersSidebarComponent } from './components/filters-sidebar/filters-sidebar.component';
import { NoResultsComponent } from './components/no-results/no-results.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms'; // Asegúrate de importar FormsModule
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { HeaderComponent } from './components/header/header.component';
import { SharedRoutingModule } from './shared.routing.module';
import { FooterComponent } from './components/footer/footer.component';
import { D3_DIRECTIVES } from './d3/directives';
import { EcuadorMapComponent } from './components/visuals/ecuador-map/ecuador-map.component';
import { GraphComponent } from './components/visuals/graph/graph.component';
import { SHARED_VISUALS } from './components/visuals';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { WordCloudComponent } from './components/visuals/word-cloud/word-cloud.component';
import { NgxChartsModule, NumberCardModule } from '@swimlane/ngx-charts';
import { EvolutionLineChartComponent } from './components/visuals/evolution-line-chart/evolution-line-chart.component';
import { D3Service } from './d3';
import { BarChartComponent } from './components/visuals/bar-chart/bar-chart.component';
import { TreeMapChartComponent } from './components/visuals/tree-map-chart/tree-map-chart.component';
import { SummaryComponent } from './components/visuals/summary/summary.component';
import { CountUpModule } from 'ngx-countup';
import { DashboardLoaderComponent } from './components/loader/dashboard-loader/dashboard-loader.component';

@NgModule({
  declarations: [
    SearchBoxComponent,
    HeaderComponent,
    FooterComponent,
    ...D3_DIRECTIVES,
    ...SHARED_VISUALS,
    EcuadorMapComponent,
    BarChartComponent,
    WordCloudComponent,
    GraphComponent,
    EvolutionLineChartComponent,
    TreeMapChartComponent,
    SummaryComponent,
    LoaderComponent,
    MiniLoaderComponent,
    FiltersSidebarComponent,
    NoResultsComponent,
    DashboardLoaderComponent,
  ],
  exports: [
    SearchBoxComponent,
    HeaderComponent,
    FooterComponent,
    ...D3_DIRECTIVES,
    ...SHARED_VISUALS,
    EcuadorMapComponent,
    WordCloudComponent,
    GraphComponent,
    BarChartComponent,
    TreeMapChartComponent,
    SummaryComponent,
    EvolutionLineChartComponent,
    LoaderComponent,
    MiniLoaderComponent,
    FiltersSidebarComponent,
    NoResultsComponent,
    DashboardLoaderComponent,
  ],
  imports: [
    MatButtonModule,
    MatIconModule,
    FontAwesomeModule,
    FormsModule,
    CommonModule,
    SharedRoutingModule,
    NgbPopoverModule,
    NumberCardModule,
    NgxChartsModule,
    CountUpModule,
  ],
  providers: [D3Service],
})
export class SharedModule {}
