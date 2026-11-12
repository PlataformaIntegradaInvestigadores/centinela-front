import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from '../search-engine/presentation/home-page/pages/home-page/home-page.component';
import { SearchResultComponent } from '../search-engine/presentation/home-page/components/search-result/search-result.component';
import { NgModule } from '@angular/core';
import { ArticlePageComponent } from '../search-engine/presentation/home-page/pages/article-page/article-page.component';
import { researcherOnlyGuard } from 'src/guards/researcher-only.guard';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    children: [
      {
        path: '', // Esta ruta coincide con la página principal
        component: SearchResultComponent, // El componente app-author-retrieve se mostrará solo en la página principal
      },
      {
        path: 'article/:scopusId',
        component: ArticlePageComponent,
      },
      {
        path: 'analitica',
        loadChildren: () =>
          import('src/app/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'recommendations',
        loadChildren: () =>
          import('src/app/recommendations/recommendations.module').then(
            (m) => m.RecommendationsModule,
          ),
        canActivate: [researcherOnlyGuard],
      },
      {
        // Recomendación ética de investigadores (ethical-recommender-service).
        // Sin researcherOnlyGuard a propósito: la página solo consume /api/recommender (público)
        // y debe funcionar en local sin identity-service ni sesión iniciada.
        path: 'team-builder',
        loadChildren: () =>
          import('src/app/team-recommender/team-recommender.module').then(
            (m) => m.TeamRecommenderModule,
          ),
      },
      {
        path: 'about-us',
        loadChildren: () =>
          import('src/app/search-engine/presentation/about-us/about-us.module').then(
            (m) => m.AboutUsModule,
          ),
      },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
  providers: [],
})
export class SharedRoutingModule {}
