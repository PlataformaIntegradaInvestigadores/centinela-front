import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PostCommentsComponent } from './post-comments.component';
import { CommentService } from '../../../domain/services/comment.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Comment } from '../../../domain/entities/feed.interface';

describe('PostCommentsComponent', () => {
  let component: PostCommentsComponent;
  let commentServiceSpy: jasmine.SpyObj<CommentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const makeComment = (over: Partial<Comment> = {}): Comment =>
    ({
      id: 'c1',
      content: 'hi',
      author: { id: 'u1' },
      is_liked: false,
      likes_count: 0,
      ...over,
    }) as Comment;

  beforeEach(() => {
    commentServiceSpy = jasmine.createSpyObj('CommentService', [
      'getPostComments',
      'createComment',
      'toggleCommentLike',
      'deleteComment',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId']);
    authServiceSpy.getCurrentUserId.and.returnValue('u1');
    commentServiceSpy.getPostComments.and.returnValue(of([]));

    TestBed.configureTestingModule({
      declarations: [PostCommentsComponent],
      providers: [
        { provide: CommentService, useValue: commentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    component = TestBed.createComponent(PostCommentsComponent).componentInstance;
    component.postId = 'p1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('sets currentUserId and loads comments', () => {
      component.ngOnInit();
      expect(component.currentUserId).toBe('u1');
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledWith('p1');
    });
  });

  describe('ngOnDestroy', () => {
    it('completes destroy$', () => {
      const spy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadComments', () => {
    it('does nothing without a postId', () => {
      component.postId = '' as any;
      component.loadComments();
      expect(commentServiceSpy.getPostComments).not.toHaveBeenCalled();
    });

    it('loads comments and emits count update when count differs', () => {
      const comments = [makeComment(), makeComment({ id: 'c2' })];
      commentServiceSpy.getPostComments.and.returnValue(of(comments));
      component.commentsCount = 0;
      let emitted: number | undefined;
      component.commentsCountUpdated.subscribe((n) => (emitted = n));

      component.loadComments();

      expect(component.comments.length).toBe(2);
      expect(emitted).toBe(2);
      expect(component.isLoadingComments).toBeFalse();
    });

    it('does not emit count update when count matches', () => {
      const comments = [makeComment()];
      commentServiceSpy.getPostComments.and.returnValue(of(comments));
      component.commentsCount = 1;
      let emitted = false;
      component.commentsCountUpdated.subscribe(() => (emitted = true));

      component.loadComments();

      expect(emitted).toBeFalse();
    });

    it('sets error message on failure', () => {
      commentServiceSpy.getPostComments.and.returnValue(throwError(() => new Error('boom')));
      component.loadComments();
      expect(component.error).toBe('No se pudieron cargar los comentarios.');
      expect(component.isLoadingComments).toBeFalse();
    });
  });

  describe('submitComment', () => {
    it('does nothing for blank content', () => {
      component.newCommentContent = '   ';
      component.submitComment();
      expect(commentServiceSpy.createComment).not.toHaveBeenCalled();
    });

    it('does nothing without a postId', () => {
      component.postId = '' as any;
      component.newCommentContent = 'hello';
      component.submitComment();
      expect(commentServiceSpy.createComment).not.toHaveBeenCalled();
    });

    it('creates a comment, prepends it, clears input, and emits events', () => {
      const newComment = makeComment({ id: 'new1' });
      commentServiceSpy.createComment.and.returnValue(of(newComment));
      component.newCommentContent = '  hello  ';
      component.commentsCount = 2;
      let added: Comment | undefined;
      let countEmitted: number | undefined;
      component.commentAdded.subscribe((c) => (added = c));
      component.commentsCountUpdated.subscribe((n) => (countEmitted = n));

      component.submitComment();

      expect(commentServiceSpy.createComment).toHaveBeenCalledWith('p1', { content: 'hello' });
      expect(component.comments[0]).toBe(newComment);
      expect(component.newCommentContent).toBe('');
      expect(component.commentsCount).toBe(3);
      expect(added).toBe(newComment);
      expect(countEmitted).toBe(3);
      expect(component.isSubmittingComment).toBeFalse();
    });

    it('sets error message on failure', () => {
      commentServiceSpy.createComment.and.returnValue(throwError(() => new Error('boom')));
      component.newCommentContent = 'hello';
      component.submitComment();
      expect(component.error).toBe('No se pudo enviar el comentario. Intenta de nuevo.');
    });
  });

  describe('toggleCommentLike', () => {
    it('updates like state on success', () => {
      commentServiceSpy.toggleCommentLike.and.returnValue(of({ liked: true, likes_count: 5 }));
      const comment = makeComment();
      component.toggleCommentLike(comment);
      expect(comment.is_liked).toBeTrue();
      expect(comment.likes_count).toBe(5);
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      commentServiceSpy.toggleCommentLike.and.returnValue(throwError(() => new Error('boom')));
      component.toggleCommentLike(makeComment());
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('does nothing if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteComment(makeComment());
      expect(commentServiceSpy.deleteComment).not.toHaveBeenCalled();
    });

    it('removes the comment and decrements count on success', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      commentServiceSpy.deleteComment.and.returnValue(of(undefined));
      component.comments = [makeComment({ id: 'c1' }), makeComment({ id: 'c2' })];
      component.commentsCount = 2;

      component.deleteComment(makeComment({ id: 'c1' }));

      expect(component.comments.map((c) => c.id)).toEqual(['c2']);
      expect(component.commentsCount).toBe(1);
    });

    it('sets error message on failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      commentServiceSpy.deleteComment.and.returnValue(throwError(() => new Error('boom')));
      component.deleteComment(makeComment());
      expect(component.error).toBe('No se pudo eliminar el comentario.');
    });
  });

  describe('canDeleteComment', () => {
    it('returns true when the comment author matches currentUserId', () => {
      component.currentUserId = 'u1';
      expect(component.canDeleteComment(makeComment({ author: { id: 'u1' } as any }))).toBeTrue();
    });

    it('returns false otherwise', () => {
      component.currentUserId = 'u1';
      expect(
        component.canDeleteComment(makeComment({ author: { id: 'other' } as any })),
      ).toBeFalse();
    });
  });

  describe('formatDate', () => {
    it('formats seconds-old as "ahora"', () => {
      expect(component.formatDate(new Date())).toBe('ahora');
    });

    it('formats minutes-old', () => {
      const d = new Date(Date.now() - 5 * 60000);
      expect(component.formatDate(d)).toBe('5m');
    });

    it('formats hours-old', () => {
      const d = new Date(Date.now() - 3 * 3600000);
      expect(component.formatDate(d)).toBe('3h');
    });

    it('formats days-old', () => {
      const d = new Date(Date.now() - 2 * 86400000);
      expect(component.formatDate(d)).toBe('2d');
    });

    it('falls back to locale date string for very old dates', () => {
      const d = new Date(Date.now() - 10 * 86400000);
      expect(component.formatDate(d)).toBe(d.toLocaleDateString());
    });
  });

  it('trackByCommentId returns the comment id', () => {
    expect(component.trackByCommentId(0, makeComment({ id: 'c9' }))).toBe('c9');
  });
});
