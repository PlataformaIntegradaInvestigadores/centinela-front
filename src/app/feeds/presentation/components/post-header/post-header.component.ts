import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { FeedPost } from '../../types/post.types';

@Component({
  selector: 'app-post-header',
  templateUrl: './post-header.component.html',
  styleUrls: ['./post-header.component.css'],
})
export class PostHeaderComponent {
  @Input() post!: FeedPost;
  @Input() canEditPost: boolean = false;
  @Input() formattedDate!: string;

  @Output() profileClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<void>();

  showDropdown: boolean = false;

  /**
   * Determina si el post fue editado
   */
  get isPostEdited(): boolean {
    if (!this.post.created_at || !this.post.updated_at) return false;

    const createdTime = new Date(this.post.created_at).getTime();
    const updatedTime = new Date(this.post.updated_at).getTime();

    // Considerar editado si hay más de 30 segundos de diferencia
    return updatedTime - createdTime > 30000;
  }

  onProfileClick(): void {
    this.profileClick.emit();
  }

  onDeleteClick(): void {
    this.deleteClick.emit();
    this.showDropdown = false;
  }

  onEditClick(): void {
    console.log('onEditClick called - opening edit modal');
    this.editClick.emit();
    this.showDropdown = false;
  }

  /**
   * Toggle del dropdown
   */
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Cerrar dropdown al hacer click fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.relative');

    if (!dropdown || !dropdown.contains(target)) {
      this.showDropdown = false;
    }
  }

  /**
   * Genera tooltip informativo para el score de engagement
   */
  getEngagementTooltip(): string {
    const score = this.post.engagement_score || 0;
    const likes = this.post.likes_count || 0;
    const comments = this.post.comments_count || 0;

    let rating = 'bajo';
    if (score > 10) rating = 'alto';
    else if (score > 5) rating = 'medio';

    let tooltip = `Engagement ${rating}: ${score.toFixed(1)}`;
    tooltip += `\nLikes: ${likes}, Comentarios: ${comments}`;

    // Si hay metadata de trending, mostrarla
    if (this.post.trending_metadata) {
      const { hours_old, trending_rank } = this.post.trending_metadata;
      tooltip += `\nPublicado hace: ${hours_old.toFixed(1)} horas`;
      tooltip += `\nRanking de tendencia: ${trending_rank.toFixed(1)}`;
    }

    return tooltip;
  }
}
