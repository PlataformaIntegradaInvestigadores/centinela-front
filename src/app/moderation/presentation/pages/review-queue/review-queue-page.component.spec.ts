import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ReviewQueuePageComponent } from './review-queue-page.component';
import { ModerationService } from '../../../domain/services/moderation.service';
import { ReviewCase, ReviewCaseDetail } from '../../../domain/entities/moderation.interface';

describe('ReviewQueuePageComponent', () => {
  let component: ReviewQueuePageComponent;
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
    const fixture = TestBed.createComponent(ReviewQueuePageComponent);
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
    expect(component.error).toBe('No se pudo cargar la cola.');
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
    expect(component.error).toBe('No se pudo abrir el caso.');
  });

  it('records a decision and reloads queue and case', () => {
    component.openCase(makeCase());
    component.notes = 'ok';
    component.decide('approve');
    expect(serviceSpy.decide).toHaveBeenCalledWith(1, 'approve', 'ok');
    expect(component.feedback).toBe('Decisión registrada: Aprobado.');
    expect(component.notes).toBe('');
    expect(serviceSpy.getCase).toHaveBeenCalledTimes(2);
  });

  it('ignores decisions without a selected case and reports failures', () => {
    component.decide('block');
    expect(serviceSpy.decide).not.toHaveBeenCalled();
    component.openCase(makeCase());
    serviceSpy.decide.and.returnValue(throwError(() => new Error('x')));
    component.decide('block');
    expect(component.feedback).toBe('No se pudo registrar la decisión.');
    expect(component.isDeciding).toBeFalse();
  });

  it('splits text into highlighted XAI segments', () => {
    const segments = component.segments(makeCase());
    expect(segments.map((s) => s.text)).toEqual(['eres un ', 'indio', ' ', 'sucio']);
    expect(segments[1].highlighted).toBeTrue();
    expect(segments[1].saliency).toBe(1);
    expect(segments[3].saliency).toBe(0.5);
    expect(component.highlightStyle(segments[1])['background-color']).toBe(
      'rgba(239, 68, 68, 0.80)',
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
    expect(component.reasonLabel('reported')).toBe('Reportado por usuarios');
    expect(component.reasonLabel('otro')).toBe('otro');
    expect(component.decisionLabel('keep_hidden')).toBe('Mantener oculto');
    expect(component.decisionLabel('otro')).toBe('otro');
    expect(component.pHateClass(null)).toContain('gray');
    expect(component.pHateClass(0.9)).toContain('red');
    expect(component.pHateClass(0.6)).toContain('amber');
    expect(component.pHateClass(0.1)).toContain('green');
    expect(component.trackByCaseId(0, makeCase({ id: 9 }))).toBe(9);
  });

  it('resolves author names from context', () => {
    expect(component.authorName(makeCase())).toBe('u1');
    expect(component.authorName(makeCase({ author_id: null }))).toBe('Desconocido');
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
    ).toBe('Desconocido');
  });

  it('cleans up on destroy', () => {
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });
});
