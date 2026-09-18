import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

// Routing
import { FeedsRoutingModule } from './feeds-routing.module';

// Components
import { FeedPageComponent } from './presentation/pages/feed-page.component';
import { FeedPostComponent } from './presentation/components/feed-post/feed-post.component';
import { PostCommentsComponent } from './presentation/components/post-comments/post-comments.component';
import { PostCreatorComponent } from './presentation/components/post-creator/post-creator.component';
import { PostListComponent } from './presentation/components/post-list/post-list.component';

// Feed Post Subcomponents
import { PostHeaderComponent } from './presentation/components/post-header/post-header.component';
import { PostContentComponent } from './presentation/components/post-content/post-content.component';
import { PostPollComponent } from './presentation/components/post-poll/post-poll.component';
import { PostFilesComponent } from './presentation/components/post-files/post-files.component';
import { PostActionsComponent } from './presentation/components/post-actions/post-actions.component';
import { PostEditorComponent } from './presentation/components/post-editor/post-editor.component';

// Services
import { FeedService } from './domain/services/feed.service';

// Shared Module
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    FeedPageComponent,
    FeedPostComponent,
    PostCommentsComponent,
    PostCreatorComponent,
    PostListComponent,
    // Feed Post Subcomponents
    PostHeaderComponent,
    PostContentComponent,
    PostPollComponent,
    PostFilesComponent,
    PostActionsComponent,
    PostEditorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FeedsRoutingModule,
    SharedModule,
    OverlayModule,
    PortalModule,
  ],
  exports: [
    FeedPostComponent,
    PostCommentsComponent,
    PostCreatorComponent,
    PostListComponent,
    PostEditorComponent, // <-- exportar el editor de post
  ],
  providers: [FeedService],
})
export class FeedsModule {}
