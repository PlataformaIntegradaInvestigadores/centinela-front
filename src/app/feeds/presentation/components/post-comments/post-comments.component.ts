import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { CommentService } from '../../../domain/services/comment.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Comment, CreateCommentData } from '../../../domain/entities/feed.interface';
import {
  ModerationService,
  REPORT_ERROR_MESSAGES,
} from 'src/app/moderation/domain/services/moderation.service';
import { BLOCKED_PLACEHOLDER } from '../moderation-warning/moderation-warning.component';

/** Reintentos para refrescar comentarios recién creados mientras se clasifican. */
const PENDING_REFRESH_DELAYS_MS = [3000, 6000, 12000, 24000];

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

  revealedComments = new Set<string>();
  reportingComment: Comment | null = null;
  isReporting = false;
  reportError: string | null = null;
  reportFeedback: string | null = null;
  private pendingRefreshAttempt = 0;
  private pendingRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private moderationService: ModerationService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    // Cargar comentarios automáticamente cuando se inicializa el componente
    this.loadComments();
  }

  ngOnDestroy(): void {
    if (this.pendingRefreshTimer) {
      clearTimeout(this.pendingRefreshTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los comentarios del post
   */
  loadComments(silent = false): void {
    if (!this.postId) return;

    this.isLoadingComments = !silent;
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
          this.schedulePendingRefresh();

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
          this.error = 'Could not load the comments.';
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

          // La clasificación corre en segundo plano: refrescamos para ver el resultado.
          this.pendingRefreshAttempt = 0;
          this.schedulePendingRefresh();

          console.log('Comentario creado:', newComment);
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.error = 'Could not send the comment. Please try again.';
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
    if (!confirm('Are you sure you want to delete this comment?')) {
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
          this.error = 'Could not delete the comment.';
        },
      });
  }

  /**
   * Si hay comentarios propios aún sin clasificar, vuelve a pedirlos con backoff
   * para que una ocultación por moderación aparezca sin recargar la página.
   */
  private schedulePendingRefresh(): void {
    const hasPending = this.comments.some(
      (comment) => comment.moderation?.status === 'pending' && this.isOwnComment(comment),
    );
    if (!hasPending || this.pendingRefreshAttempt >= PENDING_REFRESH_DELAYS_MS.length) {
      return;
    }
    if (this.pendingRefreshTimer) {
      clearTimeout(this.pendingRefreshTimer);
    }
    const delay = PENDING_REFRESH_DELAYS_MS[this.pendingRefreshAttempt++];
    this.pendingRefreshTimer = setTimeout(() => this.loadComments(true), delay);
  }

  isOwnComment(comment: Comment): boolean {
    return this.currentUserId === comment.author.id;
  }

  isPending(comment: Comment): boolean {
    return comment.moderation?.status === 'pending';
  }

  /** Oculto/bloqueado por moderación y aún no revelado por el usuario. */
  isConcealed(comment: Comment): boolean {
    const moderation = comment.moderation;
    return (
      !!(moderation?.show_warning || moderation?.is_blocked) &&
      !this.revealedComments.has(comment.id)
    );
  }

  isBlocked(comment: Comment): boolean {
    return !!comment.moderation?.is_blocked;
  }

  canReveal(comment: Comment): boolean {
    return !this.isBlocked(comment) || comment.content !== BLOCKED_PLACEHOLDER;
  }

  revealComment(comment: Comment): void {
    if (this.canReveal(comment)) {
      this.revealedComments.add(comment.id);
    }
  }

  canReportComment(comment: Comment): boolean {
    return !!comment.moderation?.can_report && !this.isBlocked(comment);
  }

  openReport(comment: Comment): void {
    this.reportingComment = comment;
    this.reportError = null;
    this.reportFeedback = null;
  }

  submitReport(reason: string): void {
    const comment = this.reportingComment;
    if (!comment) return;
    this.isReporting = true;
    this.reportError = null;
    this.moderationService
      .report('comment', comment.id, reason)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isReporting = false)),
      )
      .subscribe({
        next: (result) => {
          comment.moderation = result.moderation;
          if (result.moderation?.sort_last) {
            // Same ordering the API applies: hidden/blocked comments go last.
            this.comments = [...this.comments.filter((c) => c !== comment), comment];
          }
          this.reportingComment = null;
          this.reportFeedback = result.created
            ? 'Thanks. Your report was sent to moderation.'
            : 'You already reported this comment.';
        },
        error: (error) => {
          this.reportError = this.moderationService.errorMessage(
            error,
            'The report could not be sent.',
            REPORT_ERROR_MESSAGES,
          );
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

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US');
  }

  /**
   * TrackBy function para optimizar el rendering de comentarios
   */
  trackByCommentId(index: number, comment: Comment): string {
    return comment.id;
  }
}
