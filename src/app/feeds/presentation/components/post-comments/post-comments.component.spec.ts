import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PostCommentsComponent } from './post-comments.component';
import { CommentService } from '../../../domain/services/comment.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Comment, ModerationInfo } from '../../../domain/entities/feed.interface';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';
import { BLOCKED_PLACEHOLDER } from '../moderation-warning/moderation-warning.component';

describe('PostCommentsComponent', () => {
  let component: PostCommentsComponent;
  let commentServiceSpy: jasmine.SpyObj<CommentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let moderationServiceSpy: jasmine.SpyObj<ModerationService>;

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

    moderationServiceSpy = jasmine.createSpyObj('ModerationService', ['report', 'errorMessage']);

    TestBed.configureTestingModule({
      declarations: [PostCommentsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: CommentService, useValue: commentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ModerationService, useValue: moderationServiceSpy },
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

  describe('moderation', () => {
    const moderation = (over: Partial<ModerationInfo> = {}): ModerationInfo => ({
      status: 'classified',
      visibility: 'hidden',
      show_warning: true,
      is_blocked: false,
      sort_last: true,
      review_status: 'pending',
      reasons: ['hidden_by_model'],
      report_count: 0,
      can_report: true,
      ...over,
    });

    beforeEach(() => {
      component.currentUserId = 'u1';
    });

    it('detects own and pending comments', () => {
      const pending = makeComment({ moderation: moderation({ status: 'pending' }) });
      expect(component.isOwnComment(pending)).toBeTrue();
      expect(component.isPending(pending)).toBeTrue();
      expect(component.isOwnComment(makeComment({ author: { id: 'u2' } as any }))).toBeFalse();
      expect(component.isPending(makeComment())).toBeFalse();
    });

    it('conceals hidden comments until revealed', () => {
      const hidden = makeComment({ moderation: moderation() });
      expect(component.isConcealed(hidden)).toBeTrue();
      component.revealComment(hidden);
      expect(component.isConcealed(hidden)).toBeFalse();
      expect(component.isConcealed(makeComment({ id: 'c2' }))).toBeFalse();
    });

    it('cannot reveal or report a redacted blocked comment', () => {
      const blocked = makeComment({
        content: BLOCKED_PLACEHOLDER,
        moderation: moderation({ visibility: 'blocked', is_blocked: true }),
      });
      expect(component.isBlocked(blocked)).toBeTrue();
      expect(component.canReveal(blocked)).toBeFalse();
      expect(component.canReportComment(blocked)).toBeFalse();
      component.revealComment(blocked);
      expect(component.revealedComments.has(blocked.id)).toBeFalse();
    });

    it('allows reporting visible comments flagged as reportable', () => {
      expect(component.canReportComment(makeComment({ moderation: moderation() }))).toBeTrue();
      expect(component.canReportComment(makeComment())).toBeFalse();
    });

    it('opens the report dialog for a comment', () => {
      const target = makeComment();
      component.reportError = 'x';
      component.openReport(target);
      expect(component.reportingComment).toBe(target);
      expect(component.reportError).toBeNull();
    });

    it('does nothing when submitting without a selected comment', () => {
      component.submitReport('x');
      expect(moderationServiceSpy.report).not.toHaveBeenCalled();
    });

    it('submits a report and updates the comment', () => {
      const target = makeComment();
      const updated = moderation({ report_count: 1, can_report: false });
      moderationServiceSpy.report.and.returnValue(
        of({ created: true, report_count: 1, threshold_reached: false, moderation: updated }),
      );
      component.openReport(target);
      component.submitReport('odio');
      expect(moderationServiceSpy.report).toHaveBeenCalledWith('comment', 'c1', 'odio');
      expect(target.moderation).toEqual(updated);
      expect(component.reportingComment).toBeNull();
      expect(component.isReporting).toBeFalse();
      expect(component.reportFeedback).toContain('Gracias');
    });

    it('moves a comment to the end when the report hides it', () => {
      const target = makeComment({ id: 'c1' });
      const other = makeComment({ id: 'c2' });
      component.comments = [target, other];
      const hidden = moderation({ visibility: 'hidden', show_warning: true, sort_last: true });
      moderationServiceSpy.report.and.returnValue(
        of({ created: true, report_count: 5, threshold_reached: true, moderation: hidden }),
      );
      component.openReport(target);
      component.submitReport('odio');
      expect(component.comments.map((c) => c.id)).toEqual(['c2', 'c1']);
    });

    it('reports duplicates and errors', () => {
      moderationServiceSpy.report.and.returnValue(
        of({ created: false, report_count: 1, threshold_reached: false, moderation: moderation() }),
      );
      component.openReport(makeComment());
      component.submitReport('');
      expect(component.reportFeedback).toContain('Ya habías reportado');

      moderationServiceSpy.report.and.returnValue(throwError(() => new Error('boom')));
      moderationServiceSpy.errorMessage.and.returnValue('No se pudo enviar el reporte.');
      component.openReport(makeComment());
      component.submitReport('');
      expect(component.reportError).toBe('No se pudo enviar el reporte.');
    });

    it('refreshes silently while own comments are pending classification', fakeAsync(() => {
      const pending = makeComment({ moderation: moderation({ status: 'pending' }) });
      const done = makeComment({ moderation: moderation({ status: 'classified' }) });
      commentServiceSpy.getPostComments.and.returnValues(of([pending]), of([done]));
      component.loadComments();
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledTimes(1);
      tick(3000);
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledTimes(2);
      expect(component.comments).toEqual([done]);
      tick(30000);
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledTimes(2);
    }));

    it('stops refreshing after the last backoff step and clears timers on destroy', fakeAsync(() => {
      const pending = makeComment({ moderation: moderation({ status: 'pending' }) });
      commentServiceSpy.getPostComments.and.returnValue(of([pending]));
      component.loadComments();
      tick(3000 + 6000 + 12000 + 24000);
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledTimes(5);
      tick(60000);
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledTimes(5);
      component.loadComments();
      component.ngOnDestroy();
    }));

    it('ignores pending comments from other users', fakeAsync(() => {
      const pending = makeComment({
        author: { id: 'u2' } as any,
        moderation: moderation({ status: 'pending' }),
      });
      commentServiceSpy.getPostComments.and.returnValue(of([pending]));
      component.loadComments();
      tick(3000);
      expect(commentServiceSpy.getPostComments).toHaveBeenCalledTimes(1);
    }));
  });
});
