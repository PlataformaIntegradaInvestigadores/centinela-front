import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostContentComponent } from './post-content.component';

describe('PostContentComponent', () => {
  let component: PostContentComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostContentComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(PostContentComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults showFullContent/shouldTruncateContent to false and tags to empty', () => {
    expect(component.showFullContent).toBeFalse();
    expect(component.shouldTruncateContent).toBeFalse();
    expect(component.tags).toEqual([]);
  });

  it('onToggleContent emits toggleContent', () => {
    let emitted = false;
    component.toggleContent.subscribe(() => (emitted = true));
    component.onToggleContent();
    expect(emitted).toBeTrue();
  });
});
