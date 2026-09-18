import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { FeedPost } from '../../types/post.types';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { FeedService } from '../../../domain/services/feed.service';

@Component({
  selector: 'app-feed-post',
  templateUrl: './feed-post.component.html',
  styleUrls: ['./feed-post.component.css'],
})
export class FeedPostComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() post!: FeedPost;
  @Input() showActions: boolean = true;
  @Input() showComments: boolean = true;
  @Input() allowDelete: boolean = true;
  @Input() allowEdit: boolean = true;
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

  showFullContent = false;
  showCommentsSection = false;
  isLiking = false;
  showEditModal = false;
  selectedMediaFile: any | null = null;
  selectedMediaIndex = 0;
  showFullMediaContent = false;

  private observer: IntersectionObserver | null = null;
  private hasRecordedView = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private feedService: FeedService,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    // Solo obtener el currentUserId si no se ha pasado como input
    if (this.currentUserId === null) {
      this.currentUserId = this.authService.getCurrentUserId();
    }
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.unlockBodyScroll();
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeMediaViewer();
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeftPressed(): void {
    if (this.selectedMediaFile) {
      this.showPreviousMedia();
    }
  }

  @HostListener('document:keydown.arrowright')
  onArrowRightPressed(): void {
    if (this.selectedMediaFile) {
      this.showNextMedia();
    }
  }

  private setupIntersectionObserver(): void {
    if (!this.post || this.hasRecordedView) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // El 50% del post debe ser visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.hasRecordedView) {
          this.recordView();
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  private recordView(): void {
    this.hasRecordedView = true;
    if (this.observer) {
      this.observer.disconnect();
    }

    this.feedService.recordUserInteraction(this.post.id, 'view').subscribe({
      next: () => {
        // Opcional: actualizar el contador localmente si se desea
        // this.post.views_count = (this.post.views_count || 0) + 1;
      },
      error: (err) => console.error('Error recording view:', err),
    });
  }

  /**
   * Determina si el post puede ser editado/eliminado por el usuario actual
   */
  get canEditPost(): boolean {
    return this.allowEdit && this.allowDelete && this.currentUserId === this.post.author.id;
  }

  /**
   * Formatea la fecha de creación del post
   */
  get formattedDate(): string {
    const now = new Date();
    const postDate = new Date(this.post.created_at);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return postDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  /**
   * Determina si el contenido debe ser truncado
   */
  get shouldTruncateContent(): boolean {
    return this.post.content.length > 300;
  }

  /**
   * Obtiene el contenido a mostrar (truncado o completo)
   */
  get displayContent(): string {
    if (!this.shouldTruncateContent || this.showFullContent) {
      return this.post.content;
    }
    return this.post.content.substring(0, 300) + '...';
  }

  /**
   * Determina el tipo de archivo para mostrar el icono correcto
   */
  getFileType(file: any): string {
    // Usar el file_type del backend si está disponible
    if (file.file_type) {
      return file.file_type;
    }

    // Fallback: determinar por extensión
    const extension = file.file.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['pdf'].includes(extension)) return 'document';
    if (['doc', 'docx'].includes(extension)) return 'document';
    if (['xls', 'xlsx'].includes(extension)) return 'document';

    return 'other';
  }

  /**
   * Obtiene el icono para el tipo de archivo
   */
  getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'image':
        return 'fas fa-image';
      case 'video':
        return 'fas fa-video';
      case 'audio':
        return 'fas fa-music';
      case 'document':
        return 'fas fa-file-alt';
      case 'other':
        return 'fas fa-file';
      default:
        return 'fas fa-file';
    }
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Maneja el click en like
   */
  onLikeClick(): void {
    if (this.isLiking) return;

    this.isLiking = true;
    this.toggleLike.emit(this.post);

    // Reset flag after a delay to prevent double clicks
    setTimeout(() => {
      this.isLiking = false;
    }, 1000);
  }

  /**
   * Maneja el click en editar
   */
  onEditClick(): void {
    console.log('feed-post: onEditClick called, showEditModal =', this.showEditModal);
    this.showEditModal = true;
    console.log('feed-post: showEditModal set to', this.showEditModal);
  }

  /**
   * Cierra el modal de edición
   */
  onCloseEditModal(): void {
    this.showEditModal = false;
  }

  /**
   * Guarda los cambios de edición
   */
  onSaveEdit(editData: { content: string; tags: string[] }): void {
    console.log('feed-post: onSaveEdit called with data:', editData);
    this.editPost.emit({
      postId: this.post.id,
      content: editData.content,
      tags: editData.tags,
    });
    this.showEditModal = false;
    console.log('feed-post: edit event emitted and modal closed');
  }

  /**
   * Maneja el click en eliminar
   */
  onDeleteClick(): void {
    this.deletePost.emit(this.post.id);
  }

  /**
   * Maneja el click en compartir
   */
  onShareClick(): void {
    this.sharePost.emit(this.post);
  }

  /**
   * Toggle para mostrar contenido completo
   */
  toggleFullContent(): void {
    this.showFullContent = !this.showFullContent;
  }

  /**
   * Navega al perfil del autor
   */
  navigateToProfile(): void {
    this.viewProfile.emit(this.post.author.id);
  }

  /**
   * Abre el archivo en una nueva ventana
   */
  openFile(file: any): void {
    if (this.isImageFile(file)) {
      this.openMediaViewer(file);
      return;
    }

    window.open(this.getFileUrl(file), '_blank');
  }

  openMediaViewer(file: any): void {
    const images = this.imageFiles;
    const fileKey = file.id || file.file;
    const index = images.findIndex((image) => (image.id || image.file) === fileKey);

    this.selectedMediaIndex = index >= 0 ? index : 0;
    this.selectedMediaFile = {
      ...images[this.selectedMediaIndex],
      ...file,
    };
    this.showFullMediaContent = false;
    document.body.classList.add('modal-open');
  }

  closeMediaViewer(): void {
    this.selectedMediaFile = null;
    this.showFullMediaContent = false;
    this.unlockBodyScroll();
  }

  showPreviousMedia(): void {
    const images = this.imageFiles;
    if (images.length <= 1) return;

    this.selectedMediaIndex = (this.selectedMediaIndex - 1 + images.length) % images.length;
    this.selectedMediaFile = images[this.selectedMediaIndex];
  }

  showNextMedia(): void {
    const images = this.imageFiles;
    if (images.length <= 1) return;

    this.selectedMediaIndex = (this.selectedMediaIndex + 1) % images.length;
    this.selectedMediaFile = images[this.selectedMediaIndex];
  }

  get imageFiles(): any[] {
    return (this.post.files || []).filter((file) => this.isImageFile(file));
  }

  get hasMultipleImages(): boolean {
    return this.imageFiles.length > 1;
  }

  getSelectedMediaUrl(): string {
    return this.selectedMediaFile ? this.getFileUrl(this.selectedMediaFile) : '';
  }

  get shouldTruncateMediaContent(): boolean {
    return (this.post.content || '').length > 180;
  }

  get mediaDisplayContent(): string {
    const content = this.post.content || '';
    if (!this.shouldTruncateMediaContent || this.showFullMediaContent) {
      return content;
    }

    return `${content.substring(0, 180).trim()}...`;
  }

  toggleMediaContent(): void {
    this.showFullMediaContent = !this.showFullMediaContent;
  }

  private isImageFile(file: any): boolean {
    const type = file?._fileType || file?.file_type || this.getFileType(file);
    return type === 'image';
  }

  private getFileUrl(file: any): string {
    if (!file) return '';
    if (file._imageUrl) return file._imageUrl;

    let url = (file.file || '').trim();
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    const baseUrl = '';
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    return `${baseUrl}${url}`;
  }

  private unlockBodyScroll(): void {
    document.body.classList.remove('modal-open');
  }

  /**
   * Descarga el archivo
   */
  downloadFile(file: any): void {
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.original_filename || file.file.split('/').pop() || 'download';
    link.click();
  }

  /**
   * Maneja cuando se agrega un comentario
   */
  onCommentAdded(comment: any): void {
    console.log('Comentario agregado al post:', comment);
  }

  /**
   * Actualiza el contador de comentarios del post
   */
  onCommentsCountUpdated(newCount: number): void {
    this.post.comments_count = newCount;
    console.log('Contador de comentarios actualizado:', newCount);
  }

  /**
   * Maneja el click en una opción de encuesta
   */
  onPollOptionClick(option: any): void {
    // No permitir votar si ya votó o la encuesta está inactiva
    if (this.post.poll?.user_voted || !this.post.poll?.is_active) {
      return;
    }

    // Emitir evento para votar (será manejado por el componente padre)
    this.votePoll.emit({
      pollId: this.post.poll.id,
      optionId: option.id,
      isMultipleChoice: this.post.poll.is_multiple_choice,
    });
  }

  /**
   * Calcula el porcentaje de votos para una opción
   */
  getOptionPercentage(option: any): number {
    if (!this.post.poll?.total_votes || this.post.poll.total_votes === 0) {
      return 0;
    }
    return Math.round((option.votes_count / this.post.poll.total_votes) * 100);
  }

  /**
   * Obtiene el tiempo restante hasta que expire la encuesta
   */
  getTimeUntilExpiry(): string {
    if (!this.post.poll?.expires_at) {
      return '';
    }

    const now = new Date();
    const expiryDate = new Date(this.post.poll.expires_at);
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'expirada';
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `en ${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `en ${diffHours}h ${diffMins}m`;
    } else {
      return `en ${diffMins}m`;
    }
  }
}
