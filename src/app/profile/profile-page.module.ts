import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ProfilePageRoutingModule } from './profile-page-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FeedsModule } from '../feeds/feeds.module';

import { D3Service } from '../shared/d3';

import { ProfileComponent } from './presentation/pages/profile-page/profile.component';
import { AboutMeComponent } from './presentation/components/aboutme/aboutme.component';
import { InformationComponent } from './presentation/components/aboutme/information/information.component';
import { PostComponent } from './presentation/components/aboutme/post/post.component';

import { ProfileDataComponent } from './presentation/components/profile-data/profile-data.component';
import { DataNavComponent } from './presentation/components/data-nav/data-nav.component';
import { DataFormComponent } from './presentation/components/data-form/data-form.component';
import { ContactInfoComponent } from './presentation/components/aboutme/information/components/contact-info/contact-info.component';
import { DisciplinesComponent } from './presentation/components/aboutme/information/components/disciplines/disciplines.component';
import { AboutMeProfileComponent } from './presentation/components/aboutme/information/components/about-me-profile/about-me-profile.component';
import { CardGroupComponent } from '../group/presentation/card-group/card-group.component';
import { BtnCreateGroupComponent } from '../group/presentation/btn-create-group/btn-create-group.component';
import { ListGroupComponent } from '../group/presentation/list-group/list-group.component';
import { GroupCreateModalComponent } from '../group/presentation/group-create-modal/group-create-modal.component';
import { BtnMenuGroupComponent } from '../group/presentation/btn-menu-group/btn-menu-group.component';
import { ConfirmLeaveModalComponent } from '../group/presentation/confirm-leave-modal/confirm-leave-modal.component';
import { ConfirmDeleteModalComponent } from '../group/presentation/confirm-delete-modal/confirm-delete-modal.component';

@NgModule({
  imports: [
    ProfilePageRoutingModule,
    SharedModule,
    FeedsModule,
    CommonModule,
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
  ],
  exports: [ProfileDataComponent],
  declarations: [
    ProfileComponent,
    AboutMeComponent,
    PostComponent,
    InformationComponent,
    ProfileDataComponent,
    DataNavComponent,
    CardGroupComponent,
    ListGroupComponent,
    BtnCreateGroupComponent,
    DataFormComponent,
    ContactInfoComponent,
    DisciplinesComponent,
    AboutMeProfileComponent,
    BtnMenuGroupComponent,
    ConfirmLeaveModalComponent,
    ConfirmDeleteModalComponent,
    CardGroupComponent,
    ListGroupComponent,
    BtnCreateGroupComponent,
    GroupCreateModalComponent,
  ],
  providers: [D3Service],
})
export class ProfilePageModule {}
