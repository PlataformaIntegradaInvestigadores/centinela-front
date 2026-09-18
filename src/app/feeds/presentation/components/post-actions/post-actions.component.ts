import { Component, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { FeedPost } from '../../types/post.types';

@Component({
  selector: 'app-post-actions',
  templateUrl: './post-actions.component.html',
  styleUrls: ['./post-actions.component.css'],
})
export class PostActionsComponent {
  @Input() post!: FeedPost;
  @Input() showActions: boolean = true;
  @Input() showComments: boolean = true;
  @Input() isLiking: boolean = false;
  @Input() showCommentsSection: boolean = false;

  @Output() likeClick = new EventEmitter<void>();
  @Output() commentToggle = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  onLikeClick(): void {
    // Agregar clase de animación temporalmente
    const likeButton = this.elementRef.nativeElement.querySelector('.like-button');
    if (likeButton) {
      likeButton.classList.add('liked');
      // Remover la clase después de la animación para permitir que se repita
      setTimeout(() => {
        if (!this.post.is_liked) {
          likeButton.classList.remove('liked');
        }
      }, 800);
    }

    this.likeClick.emit();
  }

  onCommentToggle(): void {
    this.commentToggle.emit();
  }
}
