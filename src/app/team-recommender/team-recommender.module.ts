import { NgModule } from '@angular/core';

import { TeamRecommenderRoutingModule } from './team-recommender-routing.module';
import { TeamRecommenderUiModule } from './team-recommender-ui.module';

/** Página propia /home/team-builder (pública, sirve sin sesión para la demo local). */
@NgModule({
  imports: [TeamRecommenderUiModule, TeamRecommenderRoutingModule],
})
export class TeamRecommenderModule {}
