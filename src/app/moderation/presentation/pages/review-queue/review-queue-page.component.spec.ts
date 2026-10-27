import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ReviewQueuePageComponent } from './review-queue-page.component';
import { ModerationService } from '../../../domain/services/moderation.service';
import { ReviewCase, ReviewCaseDetail } from '../../../domain/entities/moderation.interface';

describe('ReviewQueuePageComponent', () => {
  let component: ReviewQueuePageComponent;
  let fixture: ComponentFixture<ReviewQueuePageComponent>;
  let serviceSpy: jasmine.SpyObj<ModerationService>;

  const makeCase = (over: Partial<ReviewCase> = {}): ReviewCase => ({
    id: 1,
    content_type: 'comment',
    content_id: 'c1',
    author_id: 'u1',
    text: 'eres un indio sucio',
    label: 'hate',
    p_hate: 0.93,
    confidence: 0.86,
    decision: 'hide',
    explanation: {
      method: 'occlusion',
      top_tokens: [
        { token: 'sucio', saliency: 0.4, start: 14, end: 19 },
        { token: 'indio', saliency: 0.8, start: 8, end: 13 },
      ],
    },
    visibility: 'hidden',
    review_status: 'pending',
    reasons: ['hidden_by_model'],
    report_count: 0,
    model_version: 'v1',
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:00Z',
    ...over,
  });

  const detail = (over: Partial<ReviewCaseDetail> = {}): ReviewCaseDetail => ({
    ...makeCase(),
    decisions: [],
    report_reasons: [],
    ...over,
  });

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('ModerationService', [
      'getQueue',
      'getCase',
      'decide',
      'errorMessage',
    ]);
    serviceSpy.getQueue.and.returnValue(
      of({ total: 45, limit: 20, offset: 0, items: [makeCase()] }),
    );
    serviceSpy.getCase.and.returnValue(of(detail()));
    serviceSpy.decide.and.returnValue(of({}));
    serviceSpy.errorMessage.and.callFake((_e: unknown, fallback: string) => fallback);

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ReviewQueuePageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: ModerationService, useValue: serviceSpy }],
    });
    fixture = TestBed.createComponent(ReviewQueuePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the pending queue on init', () => {
    expect(serviceSpy.getQueue).toHaveBeenCalled();
    expect(component.cases.length).toBe(1);
    expect(component.total).toBe(45);
    expect(component.isLoading).toBeFalse();
  });

  it('shows an error when the queue fails', () => {
    serviceSpy.getQueue.and.returnValue(throwError(() => new Error('down')));
    component.loadQueue();
    expect(component.cases).toEqual([]);
    expect(component.total).toBe(0);
    expect(component.error).toBe('The review queue could not be loaded.');
  });

  it('paginates and resets the offset when filters change', () => {
    expect(component.hasPrevious).toBeFalse();
    expect(component.hasNext).toBeTrue();
    component.nextPage();
    expect(component.filters.offset).toBe(20);
    expect(component.hasPrevious).toBeTrue();
    component.previousPage();
    expect(component.filters.offset).toBe(0);
    component.filters.offset = 40;
    component.loadQueue(true);
    expect(component.filters.offset).toBe(0);
  });

  it('opens and closes a case', () => {
    component.openCase(makeCase());
    expect(serviceSpy.getCase).toHaveBeenCalledWith(1);
    expect(component.selected?.id).toBe(1);
    component.closeCase();
    expect(component.selected).toBeNull();
  });

  it('reports errors opening a case', () => {
    serviceSpy.getCase.and.returnValue(throwError(() => new Error('x')));
    component.openCase(makeCase());
    expect(component.error).toBe('The case could not be opened.');
  });

  it('records a decision and reloads queue and case', () => {
    component.openCase(makeCase());
    component.notes = 'ok';
    component.decide('approve');
    expect(serviceSpy.decide).toHaveBeenCalledWith(1, 'approve', 'ok');
    expect(component.feedback).toBe('Decision saved: Approved.');
    expect(component.notes).toBe('');
    expect(serviceSpy.getCase).toHaveBeenCalledTimes(2);
  });

  it('ignores decisions without a selected case and reports failures', () => {
    component.decide('block');
    expect(serviceSpy.decide).not.toHaveBeenCalled();
    component.openCase(makeCase());
    serviceSpy.decide.and.returnValue(throwError(() => new Error('x')));
    component.decide('block');
    expect(component.feedback).toBe('The decision could not be saved.');
    expect(component.isDeciding).toBeFalse();
  });

  it('splits text into highlighted XAI segments', () => {
    const segments = component.segments(makeCase());
    expect(segments.map((s) => s.text)).toEqual(['eres un ', 'indio', ' ', 'sucio']);
    expect(segments[1].highlighted).toBeTrue();
    expect(segments[1].saliency).toBe(1);
    expect(segments[3].saliency).toBe(0.5);
    expect(component.highlightStyle(segments[1])['background-color']).toBe(
      'rgba(251, 191, 36, 0.80)',
    );
    expect(component.highlightStyle(segments[3])['background-color']).toContain(
      'rgba(251, 191, 36, 0.5',
    );
  });

  it('handles missing text, invalid and overlapping tokens', () => {
    expect(component.segments(makeCase({ text: null }))).toEqual([]);
    const segments = component.segments(
      makeCase({
        text: 'hola mundo',
        explanation: {
          method: null,
          top_tokens: [
            { token: 'hola', saliency: 0.5, start: 0, end: 4 },
            { token: 'ola', saliency: 0.5, start: 1, end: 4 },
            { token: 'x', saliency: 0.5, start: 5, end: 99 },
            { token: 'mundo', saliency: 0, start: 5, end: 10 },
          ],
        },
      }),
    );
    expect(segments.map((s) => s.text)).toEqual(['hola', ' mundo']);
    expect(component.segments(makeCase({ explanation: { method: null, top_tokens: [] } }))).toEqual(
      [{ text: 'eres un indio sucio', saliency: 0, highlighted: false }],
    );
  });

  it('formats labels and metrics', () => {
    expect(component.percent(0.931)).toBe('93.1%');
    expect(component.percent(null)).toBe('—');
    expect(component.percent(undefined)).toBe('—');
    expect(component.reasonLabel('reported')).toBe('Reported by users');
    expect(component.reasonLabel('review_band')).toBe('Review band (0.65–0.80)');
    expect(component.reasonLabel('uncertain_band')).toBe('Uncertain band');
    expect(component.reasonLabel('')).toBe('Other');
    expect(component.decisionLabel('keep_hidden')).toBe('Kept hidden');
    expect(component.decisionLabel('otro')).toBe('otro');
    expect(component.pHateClass(null)).toContain('gray');
    expect(component.pHateClass(0.9)).toContain('red');
    expect(component.pHateClass(0.6)).toContain('amber');
    expect(component.pHateClass(0.1)).toContain('green');
    expect(component.trackByCaseId(0, makeCase({ id: 9 }))).toBe(9);
  });

  it('resolves author names from context', () => {
    expect(component.authorName(makeCase())).toBe('u1');
    expect(component.authorName(makeCase({ author_id: null }))).toBe('Unknown');
    expect(
      component.authorName(
        makeCase({ context: { exists: true, author: { first_name: 'Ana', last_name: 'Paz' } } }),
      ),
    ).toBe('Ana Paz');
    expect(
      component.authorName(makeCase({ context: { exists: true, author: { username: 'ana' } } })),
    ).toBe('ana');
    expect(
      component.authorName(makeCase({ author_id: null, context: { exists: true, author: {} } })),
    ).toBe('Unknown');
  });

  it('filters by reason tab and ignores re-selecting the same tab', () => {
    serviceSpy.getQueue.calls.reset();
    component.filters.offset = 20;
    component.setReason('deferred');
    expect(component.filters.reason).toBe('deferred');
    expect(component.filters.offset).toBe(0);
    expect(serviceSpy.getQueue).toHaveBeenCalledTimes(1);
    component.setReason('deferred');
    expect(serviceSpy.getQueue).toHaveBeenCalledTimes(1);
    expect(component.reasonTabs.map((t) => t.label)).toEqual([
      'All',
      'Hidden by model',
      'Reported',
      'Low confidence',
      'Review band',
    ]);
  });

  it('computes the visible range', () => {
    expect(component.rangeStart).toBe(1);
    expect(component.rangeEnd).toBe(20);
    component.filters.offset = 40;
    expect(component.rangeEnd).toBe(45);
    component.total = 0;
    expect(component.rangeStart).toBe(0);
  });

  it('formats badges and probability bars', () => {
    expect(component.barWidth(0.934)).toBe('93%');
    expect(component.barWidth(null)).toBe('0%');
    expect(component.barClass(null)).toContain('gray');
    expect(component.barClass(0.9)).toContain('red');
    expect(component.barClass(0.6)).toContain('amber');
    expect(component.barClass(0.2)).toContain('green');
    expect(component.visibilityLabel('hidden')).toBe('Hidden');
    expect(component.visibilityLabel('other')).toBe('other');
    expect(component.visibilityClass('blocked')).toContain('red');
    expect(component.visibilityClass('hidden')).toContain('amber');
    expect(component.visibilityClass('visible')).toContain('green');
    expect(component.statusLabel('pending')).toBe('Pending');
    expect(component.statusLabel('other')).toBe('other');
    expect(component.reasonClass('reported')).toContain('purple');
    expect(component.reasonClass('deferred')).toContain('sky');
    expect(component.reasonClass('hidden_by_model')).toContain('indigo');
    expect(component.reasonClass('review_band')).toContain('amber');
    expect(component.reasonClass('something_new')).toContain('gray');
  });

  it('lists the most influential tokens by weight', () => {
    expect(component.topTokens(makeCase())).toEqual([
      { token: 'indio', weight: 1 },
      { token: 'sucio', weight: 0.5 },
    ]);
    expect(
      component.topTokens(makeCase({ explanation: { method: null, top_tokens: [] } })),
    ).toEqual([]);
  });

  it('renders the queue and the case detail in English', () => {
    component.openCase(makeCase());
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Content moderation');
    expect(text).toContain('Hidden by model');
    expect(text).toContain('Comment #1');
    expect(text).toContain('Probability of hate speech');
    expect(text).toContain('Most influential words');
    expect(text).toContain('Approve');
    expect(text).toContain('Keep hidden');
    expect(text).toContain('Block');
    expect(fixture.nativeElement.querySelectorAll('mark.xai-token').length).toBe(4);
  });

  it('shows an empty state when there are no cases', () => {
    serviceSpy.getQueue.and.returnValue(of({ total: 0, limit: 20, offset: 0, items: [] }));
    component.loadQueue();
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(empty.textContent).toContain('No cases here');
    expect(fixture.nativeElement.textContent).toContain('Select a case to review it.');
  });

  it('cleans up on destroy', () => {
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });
});
