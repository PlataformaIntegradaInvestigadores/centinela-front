import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FeedPostComponent } from './feed-post.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { FeedService } from '../../../domain/services/feed.service';
import { FeedPost } from '../../types/post.types';

describe('FeedPostComponent', () => {
  let component: FeedPostComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let feedServiceSpy: jasmine.SpyObj<FeedService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const makePost = (over: Partial<FeedPost> = {}): FeedPost =>
    ({
      id: 'p1',
      content: 'hello',
      tags: [],
      is_public: true,
      author: { id: 'u1' } as any,
      created_at: new Date(),
      updated_at: new Date(),
      likes_count: 0,
      comments_count: 0,
      files: [],
      ...over,
    }) as FeedPost;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId']);
    feedServiceSpy = jasmine.createSpyObj('FeedService', ['recordUserInteraction']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy.getCurrentUserId.and.returnValue('u1');
    feedServiceSpy.recordUserInteraction.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      declarations: [FeedPostComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: FeedService, useValue: feedServiceSpy },
      ],
    });
    component = TestBed.createComponent(FeedPostComponent).componentInstance;
    component.post = makePost();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('resolves currentUserId from AuthService when not provided as an input', () => {
      component.ngOnInit();
      const resolved: string | null = component.currentUserId;
      expect(resolved).toBe('u1');
    });

    it('keeps a provided currentUserId input', () => {
      component.currentUserId = 'other';
      component.ngOnInit();
      expect(authServiceSpy.getCurrentUserId).not.toHaveBeenCalled();
      expect(component.currentUserId).toBe('other');
    });
  });

  describe('ngAfterViewInit / IntersectionObserver / recordView', () => {
    it('sets up an observer and records a view when the post intersects', () => {
      let capturedCallback: IntersectionObserverCallback | undefined;
      spyOn(window as any, 'IntersectionObserver').and.callFake(function (
        this: any,
        cb: IntersectionObserverCallback,
      ) {
        capturedCallback = cb;
        this.observe = jasmine.createSpy('observe');
        this.disconnect = jasmine.createSpy('disconnect');
      });

      component.ngAfterViewInit();
      expect(capturedCallback).toBeDefined();

      capturedCallback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as any);

      expect(feedServiceSpy.recordUserInteraction).toHaveBeenCalledWith('p1', 'view');
    });

    it('does not set up an observer without a post', () => {
      component.post = null as any;
      spyOn(window as any, 'IntersectionObserver');
      component.ngAfterViewInit();
      expect(window.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('logs on a recordUserInteraction failure', () => {
      spyOn(console, 'error');
      feedServiceSpy.recordUserInteraction.and.returnValue(throwError(() => new Error('boom')));
      let capturedCallback: IntersectionObserverCallback | undefined;
      spyOn(window as any, 'IntersectionObserver').and.callFake(function (
        this: any,
        cb: IntersectionObserverCallback,
      ) {
        capturedCallback = cb;
        this.observe = jasmine.createSpy('observe');
        this.disconnect = jasmine.createSpy('disconnect');
      });
      component.ngAfterViewInit();
      capturedCallback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as any);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('disconnects the observer and unlocks scroll', () => {
      const disconnectSpy = jasmine.createSpy('disconnect');
      (component as any).observer = { disconnect: disconnectSpy };
      document.body.classList.add('modal-open');
      component.ngOnDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(document.body.classList.contains('modal-open')).toBeFalse();
    });

    it('does not throw without an observer', () => {
      (component as any).observer = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('keyboard shortcuts', () => {
    it('onEscapePressed closes the media viewer', () => {
      component.selectedMediaFile = { file: 'a.png' };
      component.onEscapePressed();
      expect(component.selectedMediaFile).toBeNull();
    });

    it('onArrowLeftPressed shows the previous media when a file is open', () => {
      spyOn(component, 'showPreviousMedia');
      component.selectedMediaFile = { file: 'a.png' };
      component.onArrowLeftPressed();
      expect(component.showPreviousMedia).toHaveBeenCalled();
    });

    it('onArrowLeftPressed does nothing without an open file', () => {
      spyOn(component, 'showPreviousMedia');
      component.selectedMediaFile = null;
      component.onArrowLeftPressed();
      expect(component.showPreviousMedia).not.toHaveBeenCalled();
    });

    it('onArrowRightPressed shows the next media when a file is open', () => {
      spyOn(component, 'showNextMedia');
      component.selectedMediaFile = { file: 'a.png' };
      component.onArrowRightPressed();
      expect(component.showNextMedia).toHaveBeenCalled();
    });
  });

  describe('canEditPost', () => {
    it('is true when edit/delete are allowed and the user is the author', () => {
      component.allowEdit = true;
      component.allowDelete = true;
      component.currentUserId = 'u1';
      expect(component.canEditPost).toBeTrue();
    });

    it('is false when the current user is not the author', () => {
      component.currentUserId = 'other';
      expect(component.canEditPost).toBeFalse();
    });

    it('is false when edit is disallowed', () => {
      component.allowEdit = false;
      component.currentUserId = 'u1';
      expect(component.canEditPost).toBeFalse();
    });
  });

  describe('formattedDate', () => {
    it('formats seconds-old as "Ahora"', () => {
      component.post = makePost({ created_at: new Date() });
      expect(component.formattedDate).toBe('Ahora');
    });

    it('formats minutes-old', () => {
      component.post = makePost({ created_at: new Date(Date.now() - 5 * 60000) });
      expect(component.formattedDate).toBe('5m');
    });

    it('formats hours-old', () => {
      component.post = makePost({ created_at: new Date(Date.now() - 3 * 3600000) });
      expect(component.formattedDate).toBe('3h');
    });

    it('formats days-old', () => {
      component.post = makePost({ created_at: new Date(Date.now() - 2 * 86400000) });
      expect(component.formattedDate).toBe('2d');
    });

    it('falls back to a locale date string for very old dates', () => {
      component.post = makePost({ created_at: new Date(Date.now() - 10 * 86400000) });
      expect(component.formattedDate).toMatch(/\d{2}/);
    });
  });

  describe('content truncation', () => {
    it('does not truncate short content', () => {
      component.post = makePost({ content: 'short' });
      expect(component.shouldTruncateContent).toBeFalse();
      expect(component.displayContent).toBe('short');
    });

    it('truncates content over 300 chars unless expanded', () => {
      component.post = makePost({ content: 'a'.repeat(400) });
      expect(component.shouldTruncateContent).toBeTrue();
      expect(component.displayContent.endsWith('...')).toBeTrue();
      component.showFullContent = true;
      expect(component.displayContent.length).toBe(400);
    });

    it('toggleFullContent flips the flag', () => {
      component.showFullContent = false;
      component.toggleFullContent();
      expect(component.showFullContent).toBeTrue();
    });
  });

  describe('getFileType', () => {
    it('uses the backend file_type when present', () => {
      expect(component.getFileType({ file_type: 'video' })).toBe('video');
    });

    it('falls back to extension for image/video/pdf/doc/xls', () => {
      expect(component.getFileType({ file: 'a.png' })).toBe('image');
      expect(component.getFileType({ file: 'a.mp4' })).toBe('video');
      expect(component.getFileType({ file: 'a.pdf' })).toBe('document');
      expect(component.getFileType({ file: 'a.docx' })).toBe('document');
      expect(component.getFileType({ file: 'a.xlsx' })).toBe('document');
    });

    it('returns "other" for unknown extensions', () => {
      expect(component.getFileType({ file: 'a.txt' })).toBe('other');
    });
  });

  describe('getFileIcon', () => {
    it('maps known types to icons', () => {
      expect(component.getFileIcon('image')).toBe('fas fa-image');
      expect(component.getFileIcon('video')).toBe('fas fa-video');
      expect(component.getFileIcon('audio')).toBe('fas fa-music');
      expect(component.getFileIcon('document')).toBe('fas fa-file-alt');
      expect(component.getFileIcon('other')).toBe('fas fa-file');
    });

    it('falls back for an unknown type', () => {
      expect(component.getFileIcon('bogus')).toBe('fas fa-file');
    });
  });

  describe('formatFileSize', () => {
    it('handles zero bytes', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats KB/MB', () => {
      expect(component.formatFileSize(2048)).toBe('2 KB');
      expect(component.formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    });
  });

  describe('onLikeClick', () => {
    it('emits toggleLike and locks out double-click for 1s', (done) => {
      let emitted: FeedPost | undefined;
      component.toggleLike.subscribe((p) => (emitted = p));
      component.onLikeClick();
      expect(emitted).toBe(component.post);
      expect(component.isLiking).toBeTrue();
      setTimeout(() => {
        expect(component.isLiking).toBeFalse();
        done();
      }, 1050);
    }, 2000);

    it('does nothing while already liking', () => {
      component.isLiking = true;
      let emitted = false;
      component.toggleLike.subscribe(() => (emitted = true));
      component.onLikeClick();
      expect(emitted).toBeFalse();
    });
  });

  describe('edit modal', () => {
    it('onEditClick opens the modal', () => {
      component.onEditClick();
      expect(component.showEditModal).toBeTrue();
    });

    it('onCloseEditModal closes the modal', () => {
      component.showEditModal = true;
      component.onCloseEditModal();
      expect(component.showEditModal).toBeFalse();
    });

    it('onSaveEdit emits editPost and closes the modal', () => {
      let emitted: any;
      component.editPost.subscribe((e) => (emitted = e));
      component.showEditModal = true;
      component.onSaveEdit({ content: 'updated', tags: ['x'] });
      expect(emitted).toEqual({ postId: 'p1', content: 'updated', tags: ['x'] });
      expect(component.showEditModal).toBeFalse();
    });
  });

  it('onDeleteClick emits the post id', () => {
    let emitted: string | undefined;
    component.deletePost.subscribe((id) => (emitted = id));
    component.onDeleteClick();
    expect(emitted).toBe('p1');
  });

  it('onShareClick emits the post', () => {
    let emitted: FeedPost | undefined;
    component.sharePost.subscribe((p) => (emitted = p));
    component.onShareClick();
    expect(emitted).toBe(component.post);
  });

  it('navigateToProfile emits the author id', () => {
    let emitted: string | undefined;
    component.viewProfile.subscribe((id) => (emitted = id));
    component.navigateToProfile();
    expect(emitted).toBe('u1');
  });

  describe('openFile', () => {
    it('opens the media viewer for an image file', () => {
      spyOn(component, 'openMediaViewer');
      const file = { file: 'a.png', file_type: 'image' };
      component.openFile(file);
      expect(component.openMediaViewer).toHaveBeenCalledWith(file);
    });

    it('opens a new window for a non-image file', () => {
      spyOn(window, 'open');
      const file = { file: 'a.pdf', file_type: 'document' };
      component.openFile(file);
      expect(window.open).toHaveBeenCalledWith('/a.pdf', '_blank');
    });
  });

  describe('media viewer navigation', () => {
    beforeEach(() => {
      component.post = makePost({
        files: [
          { id: '1', file: 'a.png', file_type: 'image' } as any,
          { id: '2', file: 'b.png', file_type: 'image' } as any,
          { id: '3', file: 'c.png', file_type: 'image' } as any,
        ],
      });
    });

    it('openMediaViewer selects the matching image and adds the modal-open class', () => {
      component.openMediaViewer({ id: '2', file: 'b.png', file_type: 'image' });
      expect(component.selectedMediaIndex).toBe(1);
      expect(document.body.classList.contains('modal-open')).toBeTrue();
      document.body.classList.remove('modal-open');
    });

    it('openMediaViewer falls back to index 0 for an unmatched file', () => {
      component.openMediaViewer({ id: '99', file: 'z.png', file_type: 'image' });
      expect(component.selectedMediaIndex).toBe(0);
      document.body.classList.remove('modal-open');
    });

    it('closeMediaViewer clears state and unlocks scroll', () => {
      component.selectedMediaFile = { file: 'a.png' };
      document.body.classList.add('modal-open');
      component.closeMediaViewer();
      expect(component.selectedMediaFile).toBeNull();
      expect(document.body.classList.contains('modal-open')).toBeFalse();
    });

    it('showPreviousMedia wraps to the last image', () => {
      component.selectedMediaIndex = 0;
      component.showPreviousMedia();
      expect(component.selectedMediaIndex).toBe(2);
    });

    it('showNextMedia wraps to the first image', () => {
      component.selectedMediaIndex = 2;
      component.showNextMedia();
      expect(component.selectedMediaIndex).toBe(0);
    });

    it('showPreviousMedia/showNextMedia are no-ops with <=1 image', () => {
      component.post = makePost({ files: [{ id: '1', file: 'a.png', file_type: 'image' } as any] });
      component.selectedMediaIndex = 0;
      component.showNextMedia();
      expect(component.selectedMediaIndex).toBe(0);
    });

    it('imageFiles/hasMultipleImages reflect the post files', () => {
      expect(component.imageFiles.length).toBe(3);
      expect(component.hasMultipleImages).toBeTrue();
    });

    it('getSelectedMediaUrl returns empty when nothing is selected', () => {
      component.selectedMediaFile = null;
      expect(component.getSelectedMediaUrl()).toBe('');
    });
  });

  describe('media content truncation', () => {
    it('does not truncate short media content', () => {
      component.post = makePost({ content: 'short' });
      expect(component.shouldTruncateMediaContent).toBeFalse();
    });

    it('truncates long media content unless expanded', () => {
      component.post = makePost({ content: 'a'.repeat(200) });
      expect(component.shouldTruncateMediaContent).toBeTrue();
      expect(component.mediaDisplayContent.endsWith('...')).toBeTrue();
      component.showFullMediaContent = true;
      expect(component.mediaDisplayContent.length).toBe(200);
    });

    it('toggleMediaContent flips the flag', () => {
      component.showFullMediaContent = false;
      component.toggleMediaContent();
      expect(component.showFullMediaContent).toBeTrue();
    });
  });

  it('downloadFile triggers a synthetic download click', () => {
    const link = { href: '', download: '', click: jasmine.createSpy() };
    spyOn(document, 'createElement').and.returnValue(link as any);
    component.downloadFile({ file: '/media/a.png', original_filename: 'a.png' });
    expect(link.click).toHaveBeenCalled();
    expect(link.download).toBe('a.png');
  });

  it('onCommentAdded/onCommentsCountUpdated log and update state', () => {
    spyOn(console, 'log');
    component.onCommentAdded({ id: 'c1' });
    component.onCommentsCountUpdated(5);
    expect(component.post.comments_count).toBe(5);
  });

  describe('poll interactions', () => {
    const poll = {
      id: 'poll1',
      is_active: true,
      is_multiple_choice: false,
      user_voted: false,
      total_votes: 10,
      expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    };

    it('onPollOptionClick emits votePoll when eligible', () => {
      component.post = makePost({ poll: poll as any });
      let emitted: any;
      component.votePoll.subscribe((v) => (emitted = v));
      component.onPollOptionClick({ id: 'opt1' });
      expect(emitted).toEqual({ pollId: 'poll1', optionId: 'opt1', isMultipleChoice: false });
    });

    it('onPollOptionClick does nothing when already voted', () => {
      component.post = makePost({ poll: { ...poll, user_voted: true } as any });
      let emitted = false;
      component.votePoll.subscribe(() => (emitted = true));
      component.onPollOptionClick({ id: 'opt1' });
      expect(emitted).toBeFalse();
    });

    it('onPollOptionClick does nothing when the poll is inactive', () => {
      component.post = makePost({ poll: { ...poll, is_active: false } as any });
      let emitted = false;
      component.votePoll.subscribe(() => (emitted = true));
      component.onPollOptionClick({ id: 'opt1' });
      expect(emitted).toBeFalse();
    });

    it('getOptionPercentage computes a rounded percentage', () => {
      component.post = makePost({ poll: poll as any });
      expect(component.getOptionPercentage({ votes_count: 3 })).toBe(30);
    });

    it('getOptionPercentage is 0 with no total votes', () => {
      component.post = makePost({ poll: { ...poll, total_votes: 0 } as any });
      expect(component.getOptionPercentage({ votes_count: 3 })).toBe(0);
    });

    it('getTimeUntilExpiry returns "" without an expiry', () => {
      component.post = makePost({ poll: { ...poll, expires_at: undefined } as any });
      expect(component.getTimeUntilExpiry()).toBe('');
    });

    it('getTimeUntilExpiry returns "expirada" for a past date', () => {
      component.post = makePost({
        poll: { ...poll, expires_at: new Date(Date.now() - 1000).toISOString() } as any,
      });
      expect(component.getTimeUntilExpiry()).toBe('expirada');
    });

    it('getTimeUntilExpiry formats days/hours remaining', () => {
      component.post = makePost({
        poll: { ...poll, expires_at: new Date(Date.now() + 2 * 86400000 + 3 * 3600000).toISOString() } as any,
      });
      expect(component.getTimeUntilExpiry()).toMatch(/^en \d+d \d+h$/);
    });

    it('getTimeUntilExpiry formats hours/minutes when under a day', () => {
      component.post = makePost({
        poll: { ...poll, expires_at: new Date(Date.now() + 3 * 3600000 + 5 * 60000).toISOString() } as any,
      });
      expect(component.getTimeUntilExpiry()).toMatch(/^en \d+h \d+m$/);
    });

    it('getTimeUntilExpiry formats minutes only when under an hour', () => {
      component.post = makePost({
        poll: { ...poll, expires_at: new Date(Date.now() + 5 * 60000).toISOString() } as any,
      });
      expect(component.getTimeUntilExpiry()).toMatch(/^en \d+m$/);
    });
  });
});
