import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PostComponent } from './post.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { FeedService } from 'src/app/feeds/domain/services/feed.service';
import { FeedPost } from 'src/app/feeds/presentation/types/post.types';
import { User } from 'src/app/profile/domain/entities/user.interfaces';

describe('PostComponent', () => {
  let component: PostComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let feedServiceSpy: jasmine.SpyObj<FeedService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const makePost = (over: Partial<FeedPost> = {}): FeedPost =>
    ({ id: 'p1', content: 'hi', is_liked: false, likes_count: 0, ...over }) as FeedPost;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId', 'isLoggedIn']);
    feedServiceSpy = jasmine.createSpyObj('FeedService', [
      'getCurrentUserPosts',
      'getUserPosts',
      'createPost',
      'toggleLikePost',
      'deletePost',
      'updatePost',
      'getFriendlyErrorMessage',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy.getCurrentUserId.and.returnValue('u1');
    authServiceSpy.isLoggedIn.and.returnValue(true);
    feedServiceSpy.getFriendlyErrorMessage.and.callFake((_e: any, fallback: string) => fallback);

    TestBed.configureTestingModule({
      declarations: [PostComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: FeedService, useValue: feedServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(PostComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('uses getCurrentUserPosts for the logged-in user themselves', () => {
      component.user = { id: 'u1' } as User;
      feedServiceSpy.getCurrentUserPosts.and.returnValue(of({ posts: [], has_next: false, total_count: 0 }));
      component.ngOnInit();
      expect(feedServiceSpy.getCurrentUserPosts).toHaveBeenCalledWith(20);
      expect(component.isLoggedIn).toBeTrue();
    });

    it('uses getUserPosts for another user', () => {
      component.user = { id: 'u2' } as User;
      feedServiceSpy.getUserPosts.and.returnValue(of({ posts: [], has_next: false, total_count: 0 }));
      component.ngOnInit();
      expect(feedServiceSpy.getUserPosts).toHaveBeenCalledWith('u2', 20);
    });

    it('does not load posts without a user', () => {
      component.user = null;
      component.ngOnInit();
      expect(feedServiceSpy.getCurrentUserPosts).not.toHaveBeenCalled();
      expect(feedServiceSpy.getUserPosts).not.toHaveBeenCalled();
    });
  });

  describe('loadPosts', () => {
    it('sets posts on success', () => {
      feedServiceSpy.getUserPosts.and.returnValue(
        of({ posts: [makePost()], has_next: false, total_count: 1 }),
      );
      component.loadPosts('u2');
      expect(component.posts.length).toBe(1);
      expect(component.isLoading).toBeFalse();
    });

    it('sets an error message on failure', () => {
      feedServiceSpy.getUserPosts.and.returnValue(throwError(() => new Error('boom')));
      component.loadPosts('u2');
      expect(component.error).toBe('No se pudieron cargar las publicaciones');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('onPostSubmitted', () => {
    it('prepends the new post and shows a success message that auto-clears', (done) => {
      const newPost = makePost({ id: 'new1' });
      feedServiceSpy.createPost.and.returnValue(of(newPost));
      component.posts = [makePost({ id: 'old' })];

      component.onPostSubmitted({ content: 'x', tags: [], files: [] } as any);

      expect(component.posts[0]).toBe(newPost);
      expect(component.isSubmittingPost).toBeFalse();
      expect(component.success).toBe('Post publicado exitosamente!');

      setTimeout(() => {
        expect(component.success).toBeNull();
        done();
      }, 3100);
    }, 4000);

    it('sets a friendly error message on failure', () => {
      feedServiceSpy.createPost.and.returnValue(throwError(() => new Error('boom')));
      component.onPostSubmitted({ content: 'x', tags: [], files: [] } as any);
      expect(component.error).toContain('No se pudo crear');
      expect(component.isSubmittingPost).toBeFalse();
    });
  });

  describe('onToggleLike', () => {
    it('does nothing when not logged in', () => {
      component.isLoggedIn = false;
      component.onToggleLike(makePost());
      expect(feedServiceSpy.toggleLikePost).not.toHaveBeenCalled();
    });

    it('updates the matching post in the list', () => {
      component.isLoggedIn = true;
      component.posts = [makePost({ id: 'p1' })];
      feedServiceSpy.toggleLikePost.and.returnValue(of({ liked: true, likes_count: 9 }));

      component.onToggleLike(makePost({ id: 'p1' }));

      expect(component.posts[0].is_liked).toBeTrue();
      expect(component.posts[0].likes_count).toBe(9);
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      component.isLoggedIn = true;
      feedServiceSpy.toggleLikePost.and.returnValue(throwError(() => new Error('boom')));
      component.onToggleLike(makePost());
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('onSharePost logs the post', () => {
    spyOn(console, 'log');
    component.onSharePost(makePost());
    expect(console.log).toHaveBeenCalled();
  });

  it('onViewProfile navigates to the profile route', () => {
    component.onViewProfile('u9');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile', 'u9', 'about-me']);
  });

  describe('onDeletePost', () => {
    it('does nothing when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.onDeletePost('p1');
      expect(feedServiceSpy.deletePost).not.toHaveBeenCalled();
    });

    it('removes the post and shows a success message', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      feedServiceSpy.deletePost.and.returnValue(of(undefined));
      component.posts = [makePost({ id: 'p1' }), makePost({ id: 'p2' })];

      component.onDeletePost('p1');

      expect(component.posts.map((p) => p.id)).toEqual(['p2']);
      expect(component.success).toBe('Post eliminado exitosamente!');
    });

    it('sets a friendly error message on failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      feedServiceSpy.deletePost.and.returnValue(throwError(() => new Error('boom')));
      component.onDeletePost('p1');
      expect(component.error).toContain('No se pudo eliminar');
    });
  });

  describe('onEditPost / closeEditModal', () => {
    it('opens the edit modal for an existing post', () => {
      component.posts = [makePost({ id: 'p1' })];
      component.onEditPost('p1');
      expect(component.editModalVisible).toBeTrue();
      expect(component.postToEdit?.id).toBe('p1');
    });

    it('does nothing for an unknown post id', () => {
      component.posts = [];
      component.onEditPost('missing');
      expect(component.editModalVisible).toBeFalse();
    });

    it('closes the edit modal and clears postToEdit', () => {
      component.editModalVisible = true;
      component.postToEdit = makePost();
      component.closeEditModal();
      expect(component.editModalVisible).toBeFalse();
      expect(component.postToEdit).toBeNull();
    });
  });

  describe('saveEditPost', () => {
    it('does nothing without a postToEdit', () => {
      component.postToEdit = null;
      component.saveEditPost({ content: 'x', tags: [] });
      expect(feedServiceSpy.updatePost).not.toHaveBeenCalled();
    });

    it('updates the matching post, shows success, and closes the modal', () => {
      const updated = makePost({ id: 'p1', content: 'updated' });
      feedServiceSpy.updatePost.and.returnValue(of(updated));
      component.postToEdit = makePost({ id: 'p1' });
      component.posts = [makePost({ id: 'p1' })];
      component.editModalVisible = true;

      component.saveEditPost({ content: 'updated', tags: [] });

      expect(component.posts[0]).toBe(updated);
      expect(component.success).toBe('Post editado exitosamente!');
      expect(component.editModalVisible).toBeFalse();
      expect(component.isSubmittingPost).toBeFalse();
    });

    it('sets a friendly error message and closes the modal on failure', () => {
      feedServiceSpy.updatePost.and.returnValue(throwError(() => new Error('boom')));
      component.postToEdit = makePost({ id: 'p1' });
      component.editModalVisible = true;

      component.saveEditPost({ content: 'x', tags: [] });

      expect(component.error).toContain('No se pudo editar');
      expect(component.editModalVisible).toBeFalse();
      expect(component.isSubmittingPost).toBeFalse();
    });
  });
});
