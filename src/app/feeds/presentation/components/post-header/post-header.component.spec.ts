import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostHeaderComponent } from './post-header.component';

describe('PostHeaderComponent', () => {
  let component: PostHeaderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(PostHeaderComponent).componentInstance;
    component.post = { id: 'p-1' } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isPostEdited', () => {
    it('is false without both timestamps', () => {
      component.post = { created_at: undefined, updated_at: undefined } as any;
      expect(component.isPostEdited).toBeFalse();
    });

    it('is false when the gap is under 30s', () => {
      const base = new Date('2024-01-01T00:00:00Z');
      component.post = {
        created_at: base,
        updated_at: new Date(base.getTime() + 10000),
      } as any;
      expect(component.isPostEdited).toBeFalse();
    });

    it('is true when the gap exceeds 30s', () => {
      const base = new Date('2024-01-01T00:00:00Z');
      component.post = {
        created_at: base,
        updated_at: new Date(base.getTime() + 60000),
      } as any;
      expect(component.isPostEdited).toBeTrue();
    });
  });

  it('onProfileClick emits profileClick', () => {
    let emitted = false;
    component.profileClick.subscribe(() => (emitted = true));
    component.onProfileClick();
    expect(emitted).toBeTrue();
  });

  it('onDeleteClick emits deleteClick and closes the dropdown', () => {
    component.showDropdown = true;
    let emitted = false;
    component.deleteClick.subscribe(() => (emitted = true));
    component.onDeleteClick();
    expect(emitted).toBeTrue();
    expect(component.showDropdown).toBeFalse();
  });

  it('onEditClick emits editClick and closes the dropdown', () => {
    component.showDropdown = true;
    let emitted = false;
    component.editClick.subscribe(() => (emitted = true));
    component.onEditClick();
    expect(emitted).toBeTrue();
    expect(component.showDropdown).toBeFalse();
  });

  it('toggleDropdown flips showDropdown', () => {
    component.toggleDropdown();
    expect(component.showDropdown).toBeTrue();
    component.toggleDropdown();
    expect(component.showDropdown).toBeFalse();
  });

  describe('onDocumentClick', () => {
    it('closes the dropdown when the click target is outside a .relative container', () => {
      component.showDropdown = true;
      const event = { target: document.createElement('div') } as unknown as Event;
      component.onDocumentClick(event);
      expect(component.showDropdown).toBeFalse();
    });

    it('keeps the dropdown open when the click target is inside a .relative container', () => {
      component.showDropdown = true;
      const container = document.createElement('div');
      container.className = 'relative';
      const inner = document.createElement('span');
      container.appendChild(inner);
      const event = { target: inner } as unknown as Event;
      component.onDocumentClick(event);
      expect(component.showDropdown).toBeTrue();
    });
  });

  describe('getEngagementTooltip', () => {
    it('rates low engagement and includes like/comment counts', () => {
      component.post = { engagement_score: 2, likes_count: 3, comments_count: 1 } as any;
      const tooltip = component.getEngagementTooltip();
      expect(tooltip).toContain('Engagement bajo: 2.0');
      expect(tooltip).toContain('Likes: 3, Comentarios: 1');
    });

    it('rates medium engagement above 5', () => {
      component.post = { engagement_score: 7 } as any;
      expect(component.getEngagementTooltip()).toContain('Engagement medio');
    });

    it('rates high engagement above 10', () => {
      component.post = { engagement_score: 15 } as any;
      expect(component.getEngagementTooltip()).toContain('Engagement alto');
    });

    it('appends trending metadata when present', () => {
      component.post = {
        engagement_score: 1,
        trending_metadata: { hours_old: 2.5, engagement_score: 1, trending_rank: 3 },
      } as any;
      const tooltip = component.getEngagementTooltip();
      expect(tooltip).toContain('Publicado hace: 2.5 horas');
      expect(tooltip).toContain('Ranking de tendencia: 3.0');
    });
  });
});
