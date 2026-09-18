import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { CommentService } from '../../../domain/services/comment.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Comment, CreateCommentData } from '../../../domain/entities/feed.interface';

@Component({
  selector: 'app-post-comments',
  templateUrl: './post-comments.component.html',
  styleUrls: ['./post-comments.component.css'],
})
export class PostCommentsComponent implements OnInit, OnDestroy {
  @Input() postId!: string;
  @Input() commentsCount: number = 0;

  @Output() commentAdded = new EventEmitter<Comment>();
  @Output() commentsCountUpdated = new EventEmitter<number>();

  private destroy$ = new Subject<void>();

  comments: Comment[] = [];
  newCommentContent = '';
  isLoadingComments = false;
  isSubmittingComment = false;
  currentUserId: string | null = null;
  error: string | null = null;

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    // Cargar comentarios automáticamente cuando se inicializa el componente
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los comentarios del post
   */
  loadComments(): void {
    if (!this.postId) return;

    this.isLoadingComments = true;
    this.error = null;

    this.commentService
      .getPostComments(this.postId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingComments = false)),
      )
      .subscribe({
        next: (comments) => {
          this.comments = comments;

          // Actualizar el contador de comentarios real
          // Solo emitimos la actualización si los comentarios devueltos son diferentes al contador actual
          // Pero no cambiamos el contador interno ya que ese es un Input desde el post
          if (comments.length !== this.commentsCount) {
            console.log(
              `Actualizando contador de comentarios de ${this.commentsCount} a ${comments.length}`,
            );
            this.commentsCountUpdated.emit(comments.length);
          }

          console.log(`Comentarios cargados para post ${this.postId}:`, comments.length);
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.error = 'No se pudieron cargar los comentarios.';
        },
      });
  }

  /**
   * Envía un nuevo comentario
   */
  submitComment(): void {
    if (!this.newCommentContent.trim() || !this.postId) return;

    this.isSubmittingComment = true;
    this.error = null;

    const commentData: CreateCommentData = {
      content: this.newCommentContent.trim(),
    };

    this.commentService
      .createComment(this.postId, commentData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSubmittingComment = false)),
      )
      .subscribe({
        next: (newComment) => {
          // Agregar el comentario al principio de la lista
          this.comments.unshift(newComment);
          this.newCommentContent = '';
          this.commentsCount++;

          // Emitir eventos para notificar al componente padre
          this.commentAdded.emit(newComment);
          this.commentsCountUpdated.emit(this.commentsCount);

          console.log('Comentario creado:', newComment);
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.error = 'No se pudo enviar el comentario. Intenta de nuevo.';
        },
      });
  }

  /**
   * Alterna el like de un comentario
   */
  toggleCommentLike(comment: Comment): void {
    this.commentService
      .toggleCommentLike(comment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          comment.is_liked = response.liked;
          comment.likes_count = response.likes_count;
        },
        error: (error) => {
          console.error('Error toggling comment like:', error);
        },
      });
  }

  /**
   * Elimina un comentario
   */
  deleteComment(comment: Comment): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    this.commentService
      .deleteComment(comment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.comments = this.comments.filter((c) => c.id !== comment.id);
          this.commentsCount--;
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.error = 'No se pudo eliminar el comentario.';
        },
      });
  }

  /**
   * Verifica si el usuario actual puede eliminar el comentario
   */
  canDeleteComment(comment: Comment): boolean {
    return this.currentUserId === comment.author.id;
  }

  /**
   * Formatea la fecha de creación del comentario
   */
  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  /**
   * TrackBy function para optimizar el rendering de comentarios
   */
  trackByCommentId(index: number, comment: Comment): string {
    return comment.id;
  }
}
