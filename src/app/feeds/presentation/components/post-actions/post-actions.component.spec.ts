import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { PostActionsComponent } from './post-actions.component';

describe('PostActionsComponent', () => {
  let component: PostActionsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostActionsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(PostActionsComponent).componentInstance;
    component.post = { id: 'p-1', is_liked: false } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults showActions/showComments to true and isLiking/showCommentsSection to false', () => {
    expect(component.showActions).toBeTrue();
    expect(component.showComments).toBeTrue();
    expect(component.isLiking).toBeFalse();
    expect(component.showCommentsSection).toBeFalse();
  });

  it('onLikeClick emits likeClick', () => {
    let emitted = false;
    component.likeClick.subscribe(() => (emitted = true));
    component.onLikeClick();
    expect(emitted).toBeTrue();
  });

  it('onLikeClick is a no-op on the DOM when the like button is not found', () => {
    (component as any).elementRef = { nativeElement: { querySelector: () => null } };
    expect(() => component.onLikeClick()).not.toThrow();
  });

  it('animates the like button and removes the class after the timer when not liked', fakeAsync(() => {
    const likeButton = { classList: { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') } };
    (component as any).elementRef = { nativeElement: { querySelector: () => likeButton } };
    component.post = { id: 'p-1', is_liked: false } as any;

    component.onLikeClick();
    expect(likeButton.classList.add).toHaveBeenCalledWith('liked');
    tick(800);
    expect(likeButton.classList.remove).toHaveBeenCalledWith('liked');
  }));

  it('keeps the liked class after the timer when the post is now liked', fakeAsync(() => {
    const likeButton = { classList: { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') } };
    (component as any).elementRef = { nativeElement: { querySelector: () => likeButton } };
    component.post = { id: 'p-1', is_liked: true } as any;

    component.onLikeClick();
    tick(800);
    expect(likeButton.classList.remove).not.toHaveBeenCalled();
  }));

  it('onCommentToggle emits commentToggle', () => {
    let emitted = false;
    component.commentToggle.subscribe(() => (emitted = true));
    component.onCommentToggle();
    expect(emitted).toBeTrue();
  });
});
