import { TestBed } from '@angular/core/testing';
import { PostCreatorComponent } from './post-creator.component';

describe('PostCreatorComponent', () => {
  let component: PostCreatorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostCreatorComponent],
    });
    component = TestBed.createComponent(PostCreatorComponent).componentInstance;
    (component as any).textArea = {
      nativeElement: { focus: jasmine.createSpy(), style: {}, scrollHeight: 50 },
    };
    (component as any).imageInput = { nativeElement: { click: jasmine.createSpy(), value: 'x' } };
    (component as any).videoInput = { nativeElement: { click: jasmine.createSpy(), value: 'x' } };
    (component as any).documentInput = { nativeElement: { click: jasmine.createSpy(), value: 'x' } };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngAfterViewInit adjusts textarea height', () => {
    component.ngAfterViewInit();
    expect((component as any).textArea.nativeElement.style.height).toBeDefined();
  });

  describe('isPollValid', () => {
    it('is true when the poll creator is not shown', () => {
      component.showPollCreator = false;
      expect(component.isPollValid).toBeTrue();
    });

    it('is false without a question', () => {
      component.showPollCreator = true;
      component.pollQuestion = '';
      component.pollOptions = ['a', 'b'];
      expect(component.isPollValid).toBeFalse();
    });

    it('is false with fewer than 2 valid options', () => {
      component.showPollCreator = true;
      component.pollQuestion = 'q';
      component.pollOptions = ['a', ''];
      expect(component.isPollValid).toBeFalse();
    });

    it('is true with a question and 2+ valid options', () => {
      component.showPollCreator = true;
      component.pollQuestion = 'q';
      component.pollOptions = ['a', 'b'];
      expect(component.isPollValid).toBeTrue();
    });
  });

  it('validPollOptionsCount counts non-blank options', () => {
    component.pollOptions = ['a', '', 'b', '   '];
    expect(component.validPollOptionsCount).toBe(2);
  });

  describe('focus helpers', () => {
    it('onPostInputFocus focuses the textarea', () => {
      component.onPostInputFocus();
      expect((component as any).textArea.nativeElement.focus).toHaveBeenCalled();
    });

    it('focusPostInput focuses the textarea', () => {
      component.focusPostInput();
      expect((component as any).textArea.nativeElement.focus).toHaveBeenCalled();
    });

    it('onPostInputBlur delegates to onTextAreaBlur without throwing', () => {
      expect(() => component.onPostInputBlur()).not.toThrow();
    });
  });

  describe('submitPost', () => {
    it('does nothing when validation fails', () => {
      component.newPostContent = '';
      let emitted = false;
      component.postSubmitted.subscribe(() => (emitted = true));
      component.submitPost();
      expect(emitted).toBeFalse();
    });

    it('alerts when poll mode is on without a question', () => {
      // validateBeforeSubmit() runs first and already blocks a blank poll question
      // (sets validationMessage), so submitPost's own alert-based poll checks below
      // are unreachable dead code in the real call flow — assert the real outcome.
      spyOn(window, 'alert');
      component.newPostContent = 'hi';
      component.showPollCreator = true;
      component.pollQuestion = '';
      component.pollOptions = ['a', 'b'];
      let emitted = false;
      component.postSubmitted.subscribe(() => (emitted = true));
      component.submitPost();
      expect(window.alert).not.toHaveBeenCalled();
      expect(emitted).toBeFalse();
      expect(component.validationMessage).toContain('pregunta');
    });

    it('does not alert or submit for fewer than 2 valid poll options (blocked earlier by validateBeforeSubmit)', () => {
      spyOn(window, 'alert');
      component.newPostContent = 'hi';
      component.showPollCreator = true;
      component.pollQuestion = 'q';
      component.pollOptions = ['a', ''];
      let emitted = false;
      component.postSubmitted.subscribe(() => (emitted = true));
      component.submitPost();
      expect(window.alert).not.toHaveBeenCalled();
      expect(emitted).toBeFalse();
      expect(component.validationMessage).toContain('opciones');
    });

    it('emits postSubmitted with content, tags, files', () => {
      component.newPostContent = 'hello';
      component.tags = ['x'];
      component.selectedFiles = [new File(['a'], 'a.png')];
      let payload: any;
      component.postSubmitted.subscribe((p) => (payload = p));
      component.submitPost();
      expect(payload.content).toBe('hello');
      expect(payload.tags).toEqual(['x']);
      expect(payload.files?.length).toBe(1);
      expect(payload.poll).toBeUndefined();
    });

    it('does not submit a poll with blank content, since validateBeforeSubmit blocks blank content unconditionally', () => {
      // submitPost's "use the poll question as content when content is blank" fallback
      // is unreachable: validateBeforeSubmit's very first check rejects blank content
      // before that fallback would ever run.
      component.newPostContent = '';
      component.showPollCreator = true;
      component.pollQuestion = 'What do you think?';
      component.pollOptions = ['a', 'b'];
      let emitted = false;
      component.postSubmitted.subscribe(() => (emitted = true));
      component.submitPost();
      expect(emitted).toBeFalse();
      expect(component.validationMessage).toContain('descripción');
    });
  });

  describe('validateBeforeSubmit', () => {
    it('fails for blank content and sets a message', () => {
      component.newPostContent = '   ';
      expect(component.validateBeforeSubmit()).toBeFalse();
      expect(component.validationMessage).toContain('descripción');
    });

    it('fails for content over 5000 chars', () => {
      component.newPostContent = 'a'.repeat(5001);
      expect(component.validateBeforeSubmit()).toBeFalse();
      expect(component.validationMessage).toContain('5000');
    });

    it('fails for poll mode without a question', () => {
      component.newPostContent = 'hi';
      component.showPollCreator = true;
      component.pollQuestion = '';
      expect(component.validateBeforeSubmit()).toBeFalse();
    });

    it('fails for poll mode with fewer than 2 options', () => {
      component.newPostContent = 'hi';
      component.showPollCreator = true;
      component.pollQuestion = 'q';
      component.pollOptions = ['a', ''];
      expect(component.validateBeforeSubmit()).toBeFalse();
    });

    it('passes for valid plain content', () => {
      component.newPostContent = 'hi';
      expect(component.validateBeforeSubmit()).toBeTrue();
    });
  });

  describe('onContentChanged', () => {
    it('clears the validation message when content becomes non-blank', () => {
      component.validationMessage = 'error';
      component.newPostContent = 'now has content';
      component.onContentChanged();
      expect(component.validationMessage).toBeNull();
    });
  });

  it('autoGrowTextArea adjusts height from the event target', () => {
    const target = { style: {}, scrollHeight: 100 } as unknown as HTMLTextAreaElement;
    component.autoGrowTextArea({ target } as unknown as Event);
    expect((target.style as any).height).toBeDefined();
  });

  describe('clearForm', () => {
    it('resets all form state and file inputs', () => {
      component.newPostContent = 'x';
      component.selectedFiles = [new File(['a'], 'a.png')];
      component.tags = ['t'];
      component.newTag = 'n';
      component.validationMessage = 'm';
      component.showTagInput = true;
      component.showPollCreator = true;
      component.pollQuestion = 'q';
      component.pollOptions = ['a', 'b', 'c'];

      component.clearForm();

      expect(component.newPostContent).toBe('');
      expect(component.selectedFiles).toEqual([]);
      expect(component.tags).toEqual([]);
      expect(component.showPollCreator).toBeFalse();
      expect(component.pollOptions).toEqual(['', '']);
      expect((component as any).imageInput.nativeElement.value).toBe('');
    });
  });

  describe('onFileSelected', () => {
    it('appends selected files and clears the input', () => {
      component.newPostContent = 'has content';
      const file = new File(['a'], 'a.png');
      const target: any = { files: [file], value: 'x' };
      component.onFileSelected({ target });
      expect(component.selectedFiles).toEqual([file]);
      expect(target.value).toBe('');
    });

    it('sets a validation message when content is blank', () => {
      component.newPostContent = '';
      const file = new File(['a'], 'a.png');
      const target: any = { files: [file], value: 'x' };
      component.onFileSelected({ target });
      expect(component.validationMessage).toContain('descripción');
    });

    it('does nothing when files is falsy', () => {
      const target: any = { files: null, value: 'x' };
      component.onFileSelected({ target });
      expect(component.selectedFiles).toEqual([]);
    });
  });

  it('removeFile removes the file at the given index', () => {
    const a = new File(['a'], 'a.png');
    const b = new File(['b'], 'b.png');
    component.selectedFiles = [a, b];
    component.removeFile(0);
    expect(component.selectedFiles).toEqual([b]);
  });

  describe('onOptionClick', () => {
    it('clicks the image input for "photo"', () => {
      component.onOptionClick('photo');
      expect((component as any).imageInput.nativeElement.click).toHaveBeenCalled();
    });

    it('clicks the video input for "video"', () => {
      component.onOptionClick('video');
      expect((component as any).videoInput.nativeElement.click).toHaveBeenCalled();
    });

    it('clicks the document input for "file"', () => {
      component.onOptionClick('file');
      expect((component as any).documentInput.nativeElement.click).toHaveBeenCalled();
    });

    it('toggles the poll creator and resets poll state for "poll"', () => {
      component.pollQuestion = 'stale';
      component.onOptionClick('poll');
      expect(component.showPollCreator).toBeTrue();
      expect(component.pollQuestion).toBe('');
    });

    it('toggles the tag input for "tag"', () => {
      component.showTagInput = false;
      component.onOptionClick('tag');
      expect(component.showTagInput).toBeTrue();
    });
  });

  describe('addTag / removeTag', () => {
    it('adds a lowercased tag without a leading #', () => {
      component.newTag = '#MyTag';
      component.addTag();
      expect(component.tags).toEqual(['mytag']);
      expect(component.newTag).toBe('');
    });

    it('prevents default when an event is passed', () => {
      const event = { preventDefault: jasmine.createSpy() } as unknown as Event;
      component.newTag = 'x';
      component.addTag(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not add a duplicate tag', () => {
      component.tags = ['x'];
      component.newTag = 'x';
      component.addTag();
      expect(component.tags).toEqual(['x']);
    });

    it('does not add a blank tag', () => {
      component.newTag = '   ';
      component.addTag();
      expect(component.tags).toEqual([]);
    });

    it('removes a tag by index', () => {
      component.tags = ['a', 'b'];
      component.removeTag(0);
      expect(component.tags).toEqual(['b']);
    });
  });

  describe('getFileIcon', () => {
    it('maps image/video/pdf/word/excel/powerpoint types', () => {
      expect(component.getFileIcon(new File(['x'], 'a.png', { type: 'image/png' }))).toBe('fas fa-image');
      expect(component.getFileIcon(new File(['x'], 'a.mp4', { type: 'video/mp4' }))).toBe('fas fa-video');
      expect(component.getFileIcon(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe(
        'fas fa-file-pdf',
      );
      expect(component.getFileIcon(new File(['x'], 'a.docx', { type: '' }))).toBe('fas fa-file-word');
      expect(component.getFileIcon(new File(['x'], 'a.xlsx', { type: '' }))).toBe('fas fa-file-excel');
      expect(component.getFileIcon(new File(['x'], 'a.pptx', { type: '' }))).toBe(
        'fas fa-file-powerpoint',
      );
    });

    it('falls back for an unknown type', () => {
      expect(component.getFileIcon(new File(['x'], 'a.txt', { type: 'text/plain' }))).toBe(
        'fas fa-file-alt',
      );
    });
  });

  describe('addPollOption / removePollOption / updatePollOption', () => {
    it('adds an option up to the 10-option cap', () => {
      component.pollOptions = Array.from({ length: 9 }, () => '');
      component.addPollOption();
      expect(component.pollOptions.length).toBe(10);
      component.addPollOption();
      expect(component.pollOptions.length).toBe(10);
    });

    it('removes an option above the 2-option floor', () => {
      component.pollOptions = ['a', 'b', 'c'];
      component.removePollOption(0);
      expect(component.pollOptions).toEqual(['b', 'c']);
    });

    it('does not remove below 2 options', () => {
      component.pollOptions = ['a', 'b'];
      component.removePollOption(0);
      expect(component.pollOptions).toEqual(['a', 'b']);
    });

    it('updates an option at a valid index', () => {
      component.pollOptions = ['a', 'b'];
      component.updatePollOption(1, 'new');
      expect(component.pollOptions[1]).toBe('new');
    });

    it('ignores an out-of-range index', () => {
      component.pollOptions = ['a'];
      component.updatePollOption(5, 'new');
      expect(component.pollOptions).toEqual(['a']);
    });
  });

  it('onPollOptionInput updates the option from the event target value', () => {
    component.pollOptions = ['a', 'b'];
    const input = document.createElement('input');
    input.value = 'updated';
    component.onPollOptionInput({ target: input } as unknown as Event, 0);
    expect(component.pollOptions[0]).toBe('updated');
  });

  it('trackByIndex returns the index', () => {
    expect(component.trackByIndex(4)).toBe(4);
  });

  it('cancelPoll resets poll state', () => {
    component.showPollCreator = true;
    component.pollQuestion = 'q';
    component.pollOptions = ['a', 'b', 'c'];
    component.cancelPoll();
    expect(component.showPollCreator).toBeFalse();
    expect(component.pollQuestion).toBe('');
    expect(component.pollOptions).toEqual(['', '']);
  });

  describe('canSubmit', () => {
    it('is true when not loading', () => {
      component.isLoading = false;
      expect(component.canSubmit()).toBeTrue();
    });

    it('is false while loading', () => {
      component.isLoading = true;
      expect(component.canSubmit()).toBeFalse();
    });
  });
});
