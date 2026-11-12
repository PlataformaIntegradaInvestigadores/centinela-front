import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { TeamBuilderPageComponent } from './presentation/pages/team-builder-page/team-builder-page.component';
import { RecommendedCandidateCardComponent } from './presentation/components/recommended-candidate-card/recommended-candidate-card.component';
import { FairnessSummaryComponent } from './presentation/components/fairness-summary/fairness-summary.component';
import { InstitutionNamePipe } from './presentation/pipes/institution-name.pipe';

/**
 * UI del recomendador ético sin rutas, para embeberla en otros módulos (p. ej. el módulo de
 * grupos del perfil, /profile/:id/my-groups) sin arrastrar las rutas de /home/team-builder.
 *
 * Sin HttpClientModule a propósito: se reutiliza el HttpClient raíz (con AuthInterceptor),
 * que deja pasar las peticiones sin token cuando no hay sesión.
 */
@NgModule({
  declarations: [
    TeamBuilderPageComponent,
    RecommendedCandidateCardComponent,
    FairnessSummaryComponent,
    InstitutionNamePipe,
  ],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FontAwesomeModule],
  exports: [TeamBuilderPageComponent],
})
export class TeamRecommenderUiModule {}
