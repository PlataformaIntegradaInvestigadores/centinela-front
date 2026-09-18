import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { FeedService } from 'src/app/feeds/domain/services/feed.service';
import { User } from 'src/app/profile/domain/entities/user.interfaces';
import { PostCreatorData, FeedPost } from 'src/app/feeds/presentation/types/post.types';
import { CreatePostData } from 'src/app/feeds/domain/entities/feed.interface';
import { Router } from '@angular/router';
import { PostCreatorComponent } from 'src/app/feeds/presentation/components/post-creator/post-creator.component';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
})
export class PostComponent implements OnInit {
  @ViewChild(PostCreatorComponent) postCreator?: PostCreatorComponent;
  @Input() user: User | null = null;
  posts: FeedPost[] = [];
  isLoggedIn: boolean = false;
  isLoading: boolean = false;
  isSubmittingPost: boolean = false;
  error: string | null = null;
  success: string | null = null;
  currentUserId: string | null = null;
  editModalVisible: boolean = false;
  postToEdit: FeedPost | null = null;

  constructor(
    private authService: AuthService,
    private feedService: FeedService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    if (this.user && this.user.id) {
      this.loadPosts(this.user.id);
    }
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  /**
   * Carga las publicaciones de un usuario específico.
   * @param userId - El ID del usuario.
   */
  loadPosts(userId: string): void {
    this.isLoading = true;
    this.error = null;

    // Verificar si es el usuario actual para usar el endpoint específico
    const isCurrentUser = this.currentUserId === userId;
    const postsObservable = isCurrentUser
      ? this.feedService.getCurrentUserPosts(20)
      : this.feedService.getUserPosts(userId, 20);

    postsObservable.subscribe({
      next: (response) => {
        this.posts = response.posts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.error = 'No se pudieron cargar las publicaciones';
        this.isLoading = false;
      },
    });
  }

  /**
   * Maneja el envío de post desde el componente PostCreator
   */
  onPostSubmitted(postData: PostCreatorData): void {
    this.isSubmittingPost = true;
    this.error = null;
    this.success = null;

    const createPostData: CreatePostData = {
      content: postData.content,
      tags: postData.tags,
      files: postData.files,
      is_public: true, // Los posts del perfil son públicos por defecto
    };

    this.feedService.createPost(createPostData).subscribe({
      next: (newPost) => {
        this.postCreator?.clearForm();
        // Agregar el nuevo post al inicio de la lista
        this.posts = [newPost, ...this.posts];
        this.isSubmittingPost = false;
        this.success = 'Post publicado exitosamente!';

        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          this.success = null;
        }, 3000);
      },
      error: (error) => {
        console.error('Error creando post:', error);
        this.error = this.feedService.getFriendlyErrorMessage(
          error,
          'No se pudo crear la publicación. Revisa la descripción y los archivos adjuntos.',
        );
        this.isSubmittingPost = false;
      },
    });
  }

  /**
   * Maneja el toggle de like en un post
   */
  onToggleLike(post: FeedPost): void {
    if (!this.isLoggedIn) return;

    this.feedService.toggleLikePost(post.id).subscribe({
      next: (response) => {
        // Actualizar el post en la lista
        const index = this.posts.findIndex((p) => p.id === post.id);
        if (index !== -1) {
          this.posts[index] = {
            ...this.posts[index],
            is_liked: response.liked,
            likes_count: response.likes_count,
          };
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
      },
    });
  }

  /**
   * Maneja compartir un post
   */
  onSharePost(post: FeedPost): void {
    // TODO: Implementar funcionalidad de compartir
    console.log('Compartir post:', post);
  }

  /**
   * Maneja navegación al perfil
   */
  onViewProfile(userId: string): void {
    this.router.navigate(['/profile', userId, 'about-me']);
  }

  /**
   * Elimina una publicación específica.
   * @param postId - El ID de la publicación a eliminar.
   */
  onDeletePost(postId: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
      return;
    }

    this.feedService.deletePost(postId).subscribe({
      next: () => {
        this.posts = this.posts.filter((post) => post.id !== postId);
        this.success = 'Post eliminado exitosamente!';
        setTimeout(() => {
          this.success = null;
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.error = this.feedService.getFriendlyErrorMessage(
          error,
          'No se pudo eliminar la publicación.',
        );
      },
    });
  }

  /**
   * Abre el modal de edición para un post
   */
  onEditPost(postId: string): void {
    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      this.postToEdit = { ...post };
      this.editModalVisible = true;
    }
  }

  /**
   * Cierra el modal de edición
   */
  closeEditModal(): void {
    this.editModalVisible = false;
    this.postToEdit = null;
  }

  /**
   * Guarda los cambios del post editado
   */
  saveEditPost(editData: { content: string; tags: string[] }): void {
    if (!this.postToEdit) return;
    this.isSubmittingPost = true;
    this.error = null;
    this.success = null;
    this.feedService
      .updatePost(this.postToEdit.id, {
        content: editData.content,
        tags: editData.tags,
      })
      .subscribe({
        next: (updatedPost) => {
          const postIndex = this.posts.findIndex((p) => p.id === this.postToEdit!.id);
          if (postIndex !== -1) {
            this.posts[postIndex] = updatedPost;
          }
          this.isSubmittingPost = false;
          this.success = 'Post editado exitosamente!';
          setTimeout(() => {
            this.success = null;
          }, 3000);
          this.closeEditModal();
        },
        error: (error) => {
          console.error('Error editando post:', error);
          this.error = this.feedService.getFriendlyErrorMessage(
            error,
            'No se pudo editar la publicación. Intenta de nuevo.',
          );
          this.isSubmittingPost = false;
          this.closeEditModal();
        },
      });
  }
}
