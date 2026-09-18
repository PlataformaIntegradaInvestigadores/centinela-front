import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostListComponent } from './post-list.component';

describe('PostListComponent', () => {
  let component: PostListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(PostListComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults every input', () => {
    expect(component.posts).toEqual([]);
    expect(component.isLoading).toBeFalse();
    expect(component.emptyMessage).toBe('No hay publicaciones disponibles');
    expect(component.showEmptyState).toBeTrue();
    expect(component.showActions).toBeTrue();
    expect(component.currentUserId).toBeNull();
  });

  it('each handler emits its corresponding output with the given payload', () => {
    const post = { id: 'p-1' } as any;
    let toggleLike: any, deletePost: any, sharePost: any, viewProfile: any, editPost: any, votePoll: any;

    component.toggleLike.subscribe((v: any) => (toggleLike = v));
    component.deletePost.subscribe((v: any) => (deletePost = v));
    component.sharePost.subscribe((v: any) => (sharePost = v));
    component.viewProfile.subscribe((v: any) => (viewProfile = v));
    component.editPost.subscribe((v: any) => (editPost = v));
    component.votePoll.subscribe((v: any) => (votePoll = v));

    component.onToggleLike(post);
    component.onDeletePost('p-1');
    component.onSharePost(post);
    component.onViewProfile('u-1');
    component.onEditPost({ postId: 'p-1', content: 'hi', tags: [] });
    component.onVotePoll({ pollId: 'poll-1', optionId: 'o-1', isMultipleChoice: false });

    expect(toggleLike).toBe(post);
    expect(deletePost).toBe('p-1');
    expect(sharePost).toBe(post);
    expect(viewProfile).toBe('u-1');
    expect(editPost).toEqual({ postId: 'p-1', content: 'hi', tags: [] });
    expect(votePoll).toEqual({ pollId: 'poll-1', optionId: 'o-1', isMultipleChoice: false });
  });

  it('trackByPostId returns the post id', () => {
    expect(component.trackByPostId(0, { id: 'p-9' } as any)).toBe('p-9');
  });
});
