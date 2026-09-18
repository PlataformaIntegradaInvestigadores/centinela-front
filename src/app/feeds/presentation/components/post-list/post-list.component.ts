import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FeedPost } from '../../types/post.types';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
})
export class PostListComponent {
  @Input() posts: FeedPost[] = [];
  @Input() isLoading: boolean = false;
  @Input() emptyMessage: string = 'No hay publicaciones disponibles';
  @Input() showEmptyState: boolean = true;
  @Input() showActions: boolean = true;
  @Input() currentUserId: string | null = null;

  @Output() toggleLike = new EventEmitter<FeedPost>();
  @Output() deletePost = new EventEmitter<string>();
  @Output() sharePost = new EventEmitter<FeedPost>();
  @Output() viewProfile = new EventEmitter<string>();
  @Output() votePoll = new EventEmitter<{
    pollId: string;
    optionId: string;
    isMultipleChoice: boolean;
  }>();
  @Output() editPost = new EventEmitter<{ postId: string; content: string; tags: string[] }>();

  /**
   * Maneja el toggle de like en un post
   */
  onToggleLike(post: FeedPost): void {
    this.toggleLike.emit(post);
  }

  /**
   * Maneja la eliminación de un post
   */
  onDeletePost(postId: string): void {
    this.deletePost.emit(postId);
  }

  /**
   * Maneja el compartir un post
   */
  onSharePost(post: FeedPost): void {
    this.sharePost.emit(post);
  }

  /**
   * Maneja la navegación al perfil del autor
   */
  onViewProfile(userId: string): void {
    this.viewProfile.emit(userId);
  }

  /**
   * Maneja la edición de un post
   */
  onEditPost(editData: { postId: string; content: string; tags: string[] }): void {
    this.editPost.emit(editData);
  }

  /**
   * Maneja la votación en una encuesta
   */
  onVotePoll(voteData: { pollId: string; optionId: string; isMultipleChoice: boolean }): void {
    this.votePoll.emit(voteData);
  }

  /**
   * Track function para optimizar el renderizado de la lista
   */
  trackByPostId(index: number, post: FeedPost): string {
    return post.id;
  }
}
