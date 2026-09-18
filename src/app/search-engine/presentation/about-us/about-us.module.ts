import { NgModule } from '@angular/core';
import { AboutUsRoutingModule } from './about-us.routing.module';
import { CommonModule } from '@angular/common';
import { GettingStartedComponent } from './components/getting-started/getting-started.component';
import { AuthorSearchComponent } from './components/author-search/author-search.component';
import { AboutComponent } from './components/about/about.component';
import { RelevantArticlesComponent } from './components/relevant-articles/relevant-articles.component';
import { RelevantAuthorsComponent } from './components/relevant-authors/relevant-authors.component';
import { ConsensusWorkshopComponent } from './components/consensus-workshop/consensus-workshop.component';

@NgModule({
  imports: [AboutUsRoutingModule, CommonModule],
  exports: [],
  declarations: [
    GettingStartedComponent,
    AuthorSearchComponent,
    AboutComponent,
    RelevantArticlesComponent,
    RelevantAuthorsComponent,
    ConsensusWorkshopComponent,
  ],
  providers: [],
})
export class AboutUsModule {}
