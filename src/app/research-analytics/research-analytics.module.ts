import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CorpusPageComponent } from './presentation/pages/corpus-page.component';
import { PreparationPageComponent } from './presentation/pages/preparation-page.component';
import { ModelsPageComponent } from './presentation/pages/models-page.component';

@NgModule({
  declarations: [CorpusPageComponent, PreparationPageComponent, ModelsPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', pathMatch: 'full', component: CorpusPageComponent },
      { path: 'preparation', component: PreparationPageComponent },
      { path: 'models', component: ModelsPageComponent },
    ]),
  ],
})
export class ResearchAnalyticsModule {}
