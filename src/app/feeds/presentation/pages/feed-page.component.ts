import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { FeedService } from '../../domain/services/feed.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserService } from 'src/app/profile/domain/services/user.service';
import {
  FeedPost,
  FeedResponse,
  FeedFilters,
  CreatePostData,
  UserFeedStats,
} from '../../domain/entities/feed.interface';
import { PostCreatorData } from '../types/post.types';
import { PostCreatorComponent } from '../components/post-creator/post-creator.component';

@Component({
  selector: 'app-feed-page',
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.css'],
})
export class FeedPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild(PostCreatorComponent) postCreator?: PostCreatorComponent;

  // Data
  posts: FeedPost[] = [];
  userStats: UserFeedStats | null = null;

  // State
  isLoading = false;
  isLoadingMore = false;
  isSubmittingPost = false;
  hasMore = false;
  nextCursor: string | null = null;
  error: string | null = null;
  selectedFilter: 'personalized' | 'trending' | 'latest' = 'personalized';
  trendingTimeRange: '24h' | '7d' | '30d' = '24h';

  // UI State
  searchQuery = '';
  tagInput = '';
  selectedTags: string[] = [];
  currentUserId: string | null = null;
  currentUserAvatar = '/assets/profile.png';
  currentUserName = '';
  isSearching = false;
  isSearchMode = false;

  // Exponer Math para el template
  Math = Math;

  constructor(
    private feedService: FeedService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    console.log('FeedPageComponent: Inicializando componente');
    this.currentUserId = this.authService.getCurrentUserId();
    this.loadCurrentUserProfile();
    this.loadFeed();
    this.loadUserStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el feed inicial
   */
  loadFeed(): void {
    console.log('FeedPageComponent: Iniciando carga de feed');
    this.isLoading = true;
    this.error = null;
    this.posts = [];
    this.nextCursor = null;

    const filters: FeedFilters = {
      feed_type: this.selectedFilter,
      limit: 20,
    };

    // Agregar filtro de tiempo para trending
    if (this.selectedFilter === 'trending') {
      filters.time_range =
        this.trendingTimeRange === '24h'
          ? 'day'
          : this.trendingTimeRange === '7d'
            ? 'week'
            : 'month';
    }

    console.log('FeedPageComponent: Enviando request con filtros:', filters);

    this.feedService
      .getFeed(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('FeedPageComponent: Finalizando carga, isLoading = false');
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: FeedResponse) => {
          console.log('FeedPageComponent: Respuesta recibida:', response);
          this.posts = response.posts;
          this.hasMore = response.has_next;
          this.nextCursor = response.next_cursor || null;
          console.log('FeedPageComponent: Posts cargados:', this.posts.length);
        },
        error: (error) => {
          console.error('FeedPageComponent: Error loading feed:', error);
          this.error = this.feedService.getFriendlyErrorMessage(
            error,
            'No se pudo cargar el feed. Intenta de nuevo.',
          );
        },
      });
  }

  /**
   * Carga más posts (scroll infinito)
   */
  loadMorePosts(): void {
    if (!this.hasMore || this.isLoadingMore || !this.nextCursor) return;

    this.isLoadingMore = true;

    const filters: FeedFilters = {
      feed_type: this.selectedFilter,
      cursor: this.nextCursor,
      limit: 20,
    };

    // Agregar filtro de tiempo para trending
    if (this.selectedFilter === 'trending') {
      filters.time_range =
        this.trendingTimeRange === '24h'
          ? 'day'
          : this.trendingTimeRange === '7d'
            ? 'week'
            : 'month';
    }

    this.feedService
      .getFeed(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingMore = false)),
      )
      .subscribe({
        next: (response: FeedResponse) => {
          this.posts = [...this.posts, ...response.posts];
          this.hasMore = response.has_next;
          this.nextCursor = response.next_cursor || null;
        },
        error: (error) => {
          console.error('Error loading more posts:', error);
        },
      });
  }

  /**
   * Carga las estadísticas del usuario
   */
  loadUserStats(): void {
    this.feedService
      .getUserFeedStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.userStats = stats;
        },
        error: (error) => {
          console.error('Error loading user stats:', error);
        },
      });
  }

  /**
   * Cambia el filtro del feed
   */
  onFilterChange(filter: 'personalized' | 'trending' | 'latest'): void {
    if (this.selectedFilter !== filter) {
      this.selectedFilter = filter;
      this.loadFeed();
    }
  }

  /**
   * Cambia el rango de tiempo para trending
   */
  setTrendingTimeRange(range: '24h' | '7d' | '30d'): void {
    if (this.trendingTimeRange !== range) {
      this.trendingTimeRange = range;

      // Solo recargar si estamos en modo trending
      if (this.selectedFilter === 'trending') {
        this.loadFeed();
      }
    }
  }

  /**
   * Maneja el toggle de like en un post
   */
  onToggleLike(post: FeedPost): void {
    this.feedService
      .toggleLikePost(post.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Actualizar el estado del post en la lista
          const postIndex = this.posts.findIndex((p) => p.id === post.id);
          if (postIndex !== -1) {
            this.posts[postIndex] = {
              ...this.posts[postIndex],
              is_liked: response.liked,
              likes_count: response.likes_count,
            };
          }
          console.log(`Post ${post.id} ${response.liked ? 'liked' : 'unliked'}`);
        },
        error: (error) => {
          console.error('Error toggling like:', error);
          this.error = this.feedService.getFriendlyErrorMessage(
            error,
            'No se pudo procesar el like. Intenta de nuevo.',
          );
        },
      });
  }

  /**
   * Maneja la eliminación de un post
   */
  onDeletePost(postId: string): void {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    this.feedService
      .deletePost(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remover el post de la lista
          this.posts = this.posts.filter((p) => p.id !== postId);
          this.loadUserStats(); // Actualizar estadísticas
          console.log(`Post ${postId} eliminado`);
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          this.error = this.feedService.getFriendlyErrorMessage(
            error,
            'Could not delete the post. Please try again.',
          );
        },
      });
  }

  /**
   * Maneja la edición de un post
   */
  onEditPost(editData: { postId: string; content: string; tags: string[] }): void {
    console.log('feed-page: onEditPost called with data:', editData);

    this.feedService
      .updatePost(editData.postId, {
        content: editData.content,
        tags: editData.tags,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPost) => {
          console.log('feed-page: post updated successfully:', updatedPost);
          // Actualizar el post en la lista
          const postIndex = this.posts.findIndex((p) => p.id === editData.postId);
          if (postIndex !== -1) {
            this.posts[postIndex] = updatedPost;
            console.log('feed-page: post updated in list at index:', postIndex);
          }
          console.log(`Post ${editData.postId} editado`);
        },
        error: (error) => {
          console.error('Error updating post:', error);
          this.error = this.feedService.getFriendlyErrorMessage(
            error,
            'Could not edit the post. Please try again.',
          );
        },
      });
  }

  /**
   * Maneja la votación en una encuesta
   */
  onVotePoll(voteData: { pollId: string; optionId: string; isMultipleChoice: boolean }): void {
    // Convertir optionId a array ya que el servicio espera un array
    const optionIds = [voteData.optionId];

    this.feedService
      .votePoll(voteData.pollId, optionIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Actualizar el post con los nuevos datos de la encuesta
          const postIndex = this.posts.findIndex((p) => p.poll?.id === voteData.pollId);
          if (postIndex !== -1 && this.posts[postIndex].poll) {
            // El backend retorna la encuesta dentro de response.poll
            const updatedPoll = response.poll || response;
            this.posts[postIndex] = {
              ...this.posts[postIndex],
              poll: updatedPoll,
            };
          }
          console.log(
            `Voto registrado para encuesta ${voteData.pollId}, opción ${voteData.optionId}`,
          );
        },
        error: (error) => {
          console.error('Error voting in poll:', error);
          const errorMessage =
            error.error?.error || 'No se pudo registrar el voto. Intenta de nuevo.';
          this.error = errorMessage;
        },
      });
  }

  /**
   * Busca posts usando búsqueda vectorial semántica
   */
  onSearch(): void {
    if (!this.searchQuery.trim() && this.selectedTags.length === 0) {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.isSearchMode = true;
    this.error = null;

    console.log('🔍 Iniciando búsqueda semántica:', this.searchQuery, 'Tags:', this.selectedTags);

    this.feedService
      .searchPosts(this.searchQuery, this.selectedTags)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSearching = false;
          console.log('🔍 Búsqueda completada');
        }),
      )
      .subscribe({
        next: (posts) => {
          this.posts = posts;
          this.hasMore = false;
          this.nextCursor = null;
          console.log(`🔍 Encontrados ${posts.length} posts para "${this.searchQuery}"`);
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.error = 'Could not perform the search. Please try again.';
        },
      });
  }

  /**
   * Limpia la búsqueda y vuelve al feed normal
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.tagInput = '';
    this.selectedTags = [];
    this.isSearchMode = false;
    this.error = null;
    console.log('🔍 Limpiando búsqueda, volviendo al feed normal');
    this.loadFeed();
  }

  /**
   * Añade un tag a la búsqueda
   */
  addSearchTag(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const tag = this.tagInput.trim().replace(/^#/, '');
    if (tag && !this.selectedTags.includes(tag) && this.selectedTags.length < 5) {
      this.selectedTags.push(tag);
      this.tagInput = '';
      this.onSearch();
    }
  }

  /**
   * Elimina un tag de la búsqueda
   */
  removeSearchTag(index: number): void {
    this.selectedTags.splice(index, 1);
    this.onSearch();
  }

  /**
   * Refresca el feed
   */
  refreshFeed(): void {
    this.loadFeed();
    this.loadUserStats();
  }

  /**
   * Maneja el scroll para cargar más posts
   */
  onScroll(): void {
    const threshold = 100;
    const position = window.pageYOffset + window.innerHeight;
    const height = document.documentElement.scrollHeight;

    if (position > height - threshold) {
      this.loadMorePosts();
    }
  }

  /**
   * Enfoca el input de post (para el botón de crear primer post)
   */
  focusPostInput(): void {
    // Scroll hacia arriba y enfocar el textarea del componente post-creator
    setTimeout(() => {
      const textarea = document.querySelector('app-post-creator textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  /**
   * Maneja el envío de post desde el componente PostCreator
   */
  onPostSubmitted(postData: PostCreatorData): void {
    this.isSubmittingPost = true;

    const createPostData: CreatePostData = {
      content: postData.content,
      tags: postData.tags,
      files: postData.files,
      is_public: true, // Todos los posts serán públicos por defecto
      poll_data: postData.poll
        ? {
            question: postData.poll.question,
            options: postData.poll.options,
          }
        : undefined,
    };

    this.feedService
      .createPost(createPostData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSubmittingPost = false)),
      )
      .subscribe({
        next: (newPost) => {
          this.postCreator?.clearForm();
          this.posts = [newPost, ...this.posts];
          this.loadUserStats();
        },
        error: (error) => {
          console.error('Error creando post:', error);
          this.error = this.feedService.getFriendlyErrorMessage(
            error,
            'Could not create the post. Please check the description and attached files.',
          );
        },
      });
  }

  private loadCurrentUserProfile(): void {
    if (!this.currentUserId || !this.authService.isUser()) {
      return;
    }

    this.userService
      .getUserById(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUserAvatar = user.profile_picture || '/assets/profile.png';
          this.currentUserName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        },
        error: (error) => {
          console.error('Error loading current user profile:', error);
        },
      });
  }

  /**
   * Remueve un tag de la búsqueda
   */
  removeTag(index: number): void {
    this.selectedTags.splice(index, 1);
    this.loadFeed();
  }

  /**
   * TrackBy function para optimizar el rendering de la lista de posts
   */
  trackByPostId(index: number, post: FeedPost): string {
    return post.id;
  }

  /**
   * Maneja compartir un post
   */
  onSharePost(post: FeedPost): void {
    // TODO: Implementar funcionalidad de compartir
    console.log('Compartir post:', post);
    // Aquí se puede agregar lógica para compartir en redes sociales, copiar enlace, etc.
  }

  /**
   * Maneja navegación al perfil del autor
   */
  onViewProfile(userId: string): void {
    console.log('Ver perfil del usuario:', userId);
    this.router.navigate(['/profile', userId, 'about-me']);
  }
}
