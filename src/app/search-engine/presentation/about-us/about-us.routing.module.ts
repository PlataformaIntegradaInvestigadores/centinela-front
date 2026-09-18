import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { GettingStartedComponent } from './components/getting-started/getting-started.component';
import { AuthorSearchComponent } from './components/author-search/author-search.component';
import { AboutComponent } from './components/about/about.component';
import { RelevantArticlesComponent } from './components/relevant-articles/relevant-articles.component';
import { RelevantAuthorsComponent } from './components/relevant-authors/relevant-authors.component';
import { ConsensusWorkshopComponent } from './components/consensus-workshop/consensus-workshop.component';

const routes: Routes = [
  {
    path: '',
    component: AboutComponent,
    children: [
      {
        path: 'getting-started',
        component: GettingStartedComponent,
      },
      {
        path: 'author-search',
        component: AuthorSearchComponent,
      },
      {
        path: 'relevant-articles',
        component: RelevantArticlesComponent,
      },
      {
        path: 'relevant-authors',
        component: RelevantAuthorsComponent,
      },
      {
        path: 'consensus-workshop',
        component: ConsensusWorkshopComponent,
      },
      {
        path: 'collaborators',
        component: GettingStartedComponent,
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
})
export class AboutUsRoutingModule {}
