import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { PostEditorComponent } from './post-editor.component';
import { FeedPost } from '../../../domain/entities/feed.interface';

describe('PostEditorComponent', () => {
  let component: PostEditorComponent;

  const makePost = (over: Partial<FeedPost> = {}): FeedPost =>
    ({ id: 'p1', content: 'hello', tags: ['a', 'b'], ...over }) as FeedPost;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostEditorComponent],
      providers: [Overlay],
    });
    component = TestBed.createComponent(PostEditorComponent).componentInstance;
    // modalTemplate/contentTextarea/tagInputRef are @ViewChild refs never resolved without a
    // rendered template; stub them so openModal()/addTag() branches that touch them don't throw.
    (component as any).modalTemplate = {};
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('initializes editor content when post and showModal are set', () => {
      component.post = makePost();
      component.showModal = true;
      component.ngOnInit();
      expect(component.editedContent).toBe('hello');
      expect(component.editedTags).toEqual(['a', 'b']);
    });
  });

  describe('ngOnChanges', () => {
    it('re-initializes editor when post changes', () => {
      component.post = makePost({ content: 'updated' });
      component.showModal = true;
      component.ngOnChanges({
        post: { currentValue: component.post, previousValue: null, firstChange: false, isFirstChange: () => false },
      } as any);
      expect(component.editedContent).toBe('updated');
    });

    it('does nothing extra when showModal is false and unrelated to post', () => {
      component.showModal = false;
      component.ngOnChanges({});
      expect(component.editedContent).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('disposes the overlay if it exists', () => {
      const fakeOverlayRef = { hasAttached: () => false, detach: jasmine.createSpy(), dispose: jasmine.createSpy() };
      (component as any).overlayRef = fakeOverlayRef;
      component.ngOnDestroy();
      expect(fakeOverlayRef.dispose).toHaveBeenCalled();
    });

    it('does not throw when there is no overlay', () => {
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onClose', () => {
    it('emits closeEditor when not submitting', () => {
      let emitted = false;
      component.closeEditor.subscribe(() => (emitted = true));
      component.isSubmitting = false;
      component.onClose();
      expect(emitted).toBeTrue();
    });

    it('does not emit while submitting', () => {
      let emitted = false;
      component.closeEditor.subscribe(() => (emitted = true));
      component.isSubmitting = true;
      component.onClose();
      expect(emitted).toBeFalse();
    });
  });

  describe('onSave', () => {
    it('does nothing for blank content', () => {
      component.editedContent = '   ';
      component.onSave();
      expect(component.isSubmitting).toBeFalse();
    });

    it('emits save after the timeout when content is present', (done) => {
      component.editedContent = 'hi there';
      component.editedTags = ['x'];
      let payload: any;
      component.save.subscribe((p) => (payload = p));

      component.onSave();
      expect(component.isSubmitting).toBeTrue();

      setTimeout(() => {
        expect(payload).toEqual({ content: 'hi there', tags: ['x'] });
        done();
      }, 150);
    });

    it('does nothing while already submitting', () => {
      component.isSubmitting = true;
      component.editedContent = 'hi';
      let emitted = false;
      component.save.subscribe(() => (emitted = true));
      component.onSave();
      expect(emitted).toBeFalse();
    });
  });

  describe('addTag / removeTag', () => {
    it('adds a trimmed non-duplicate tag and clears the input', () => {
      component.editedTags = ['x'];
      component.tagInput = '  y  ';
      component.addTag();
      expect(component.editedTags).toEqual(['x', 'y']);
      expect(component.tagInput).toBe('');
    });

    it('does not add a duplicate tag', () => {
      component.editedTags = ['x'];
      component.tagInput = 'x';
      component.addTag();
      expect(component.editedTags).toEqual(['x']);
    });

    it('does not add beyond 10 tags', () => {
      component.editedTags = Array.from({ length: 10 }, (_, i) => `t${i}`);
      component.tagInput = 'overflow';
      component.addTag();
      expect(component.editedTags.length).toBe(10);
    });

    it('does not add a blank tag', () => {
      component.editedTags = [];
      component.tagInput = '   ';
      component.addTag();
      expect(component.editedTags).toEqual([]);
    });

    it('removes a tag at a valid index', () => {
      component.editedTags = ['a', 'b', 'c'];
      component.removeTag(1);
      expect(component.editedTags).toEqual(['a', 'c']);
    });

    it('ignores an out-of-range index', () => {
      component.editedTags = ['a'];
      component.removeTag(5);
      expect(component.editedTags).toEqual(['a']);
    });
  });

  describe('onTagKeyDown', () => {
    it('adds a tag on Enter and prevents default', () => {
      component.tagInput = 'new';
      const event = { key: 'Enter', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onTagKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.editedTags).toContain('new');
    });

    it('ignores other keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onTagKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onOverlayClick', () => {
    it('closes when the click target is the overlay itself', () => {
      let emitted = false;
      component.closeEditor.subscribe(() => (emitted = true));
      const el = {};
      component.onOverlayClick({ target: el, currentTarget: el } as unknown as Event);
      expect(emitted).toBeTrue();
    });

    it('does not close when the click bubbled from a child', () => {
      let emitted = false;
      component.closeEditor.subscribe(() => (emitted = true));
      component.onOverlayClick({ target: {}, currentTarget: {} } as unknown as Event);
      expect(emitted).toBeFalse();
    });
  });

  describe('onKeyDown', () => {
    it('closes on Escape when not submitting', () => {
      let emitted = false;
      component.closeEditor.subscribe(() => (emitted = true));
      component.onKeyDown({ key: 'Escape' } as KeyboardEvent);
      expect(emitted).toBeTrue();
    });

    it('does nothing on Escape while submitting', () => {
      component.isSubmitting = true;
      let emitted = false;
      component.closeEditor.subscribe(() => (emitted = true));
      component.onKeyDown({ key: 'Escape' } as KeyboardEvent);
      expect(emitted).toBeFalse();
    });
  });

  it('trackByIndex returns the index', () => {
    expect(component.trackByIndex(3)).toBe(3);
  });

  describe('canSave', () => {
    it('is true with content and not submitting', () => {
      component.editedContent = 'hi';
      component.isSubmitting = false;
      expect(component.canSave()).toBeTrue();
    });

    it('is false while submitting', () => {
      component.editedContent = 'hi';
      component.isSubmitting = true;
      expect(component.canSave()).toBeFalse();
    });

    it('is false for blank content', () => {
      component.editedContent = '   ';
      expect(component.canSave()).toBeFalse();
    });
  });

  describe('character limit helpers', () => {
    it('getRemainingCharacters computes the remainder', () => {
      component.editedContent = 'a'.repeat(10);
      expect(component.getRemainingCharacters()).toBe(4990);
    });

    it('isNearCharacterLimit is true within 100 of the cap', () => {
      component.editedContent = 'a'.repeat(4950);
      expect(component.isNearCharacterLimit()).toBeTrue();
    });

    it('isOverCharacterLimit is true past the cap', () => {
      component.editedContent = 'a'.repeat(5001);
      expect(component.isOverCharacterLimit()).toBeTrue();
    });

    it('isOverCharacterLimit is false at or under the cap', () => {
      component.editedContent = 'a'.repeat(5000);
      expect(component.isOverCharacterLimit()).toBeFalse();
    });
  });
});
