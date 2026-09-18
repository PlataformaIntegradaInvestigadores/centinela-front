import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfileComponent } from './presentation/pages/profile-page/profile.component';
import { NetworkComponent } from './presentation/components/network/network.component';
import { ArticleComponent } from './presentation/components/article/article.component';
import { FingerprintComponent } from './presentation/components/fingerprint/fingerprint.component';
import { AboutMeComponent } from './presentation/components/aboutme/aboutme.component';
import { ListGroupComponent } from '../group/presentation/list-group/list-group.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
    children: [
      { path: 'about-me', component: AboutMeComponent },
      { path: 'network', component: NetworkComponent },
      { path: 'article', component: ArticleComponent },
      { path: 'fingerprint', component: FingerprintComponent },
      { path: 'my-groups', component: ListGroupComponent },
    ],
  },
  {
    path: 'my-groups/:groupId',
    loadChildren: () => import('src/app/consensus/consensus.module').then((m) => m.ConsensusModule),
  },
  { path: '', redirectTo: 'about-me', pathMatch: 'full' },
  { path: '**', redirectTo: 'about-me' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfilePageRoutingModule {}
