import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ReviewInboxComponent } from './review-inbox.component';
import { ReviewService } from 'src/app/search-engine/domain/services/review.service';
import { ReviewCaseSummary } from 'src/app/search-engine/domain/entities/review.interface';

function summary(overrides: Partial<ReviewCaseSummary> = {}): ReviewCaseSummary {
  return {
    case_id: 'qa-1',
    case_type: 'qa',
    created_at: '2026-12-01T10:00:00Z',
    expires_at: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    status: 'pending',
    policy: { policy_id: 'search-qa-review', version: 'draft-1' },
    reason_codes: ['HUMAN_REVIEW_REQUIRED'],
    ...overrides,
  };
}

describe('ReviewInboxComponent', () => {
  let fixture: ComponentFixture<ReviewInboxComponent>;
  let component: ReviewInboxComponent;
  let reviews: jasmine.SpyObj<ReviewService>;
  let router: Router;

  beforeEach(() => {
    reviews = jasmine.createSpyObj('ReviewService', ['listCases']);
    reviews.listCases.and.returnValue(of({ items: [summary()], next_cursor: null }));
    TestBed.configureTestingModule({
      declarations: [ReviewInboxComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [{ provide: ReviewService, useValue: reviews }],
    });
    fixture = TestBed.createComponent(ReviewInboxComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => fixture.destroy());

  it('loads pending cases first and shows them', () => {
    fixture.detectChanges();
    expect(reviews.listCases).toHaveBeenCalledWith({
      status: 'pending',
      caseType: undefined,
      cursor: null,
      limit: 25,
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Preguntas y respuestas');
    expect(text).toContain('La política exige revisión humana');
  });

  it('filters by case type and status', () => {
    fixture.detectChanges();
    component.setType('recommendation');
    expect(reviews.listCases.calls.mostRecent().args[0]?.caseType).toBe('recommendation');
    component.setStatus('expired');
    expect(reviews.listCases.calls.mostRecent().args[0]?.status).toBe('expired');
  });

  it('appends the next page and keeps its cursor', () => {
    reviews.listCases.and.returnValues(
      of({ items: [summary()], next_cursor: 'n-1' }),
      of({ items: [summary({ case_id: 'qa-2' })], next_cursor: null }),
    );
    fixture.detectChanges();
    expect(component.nextCursor).toBe('n-1');
    component.load('n-1');
    expect(component.cases.map((c) => c.case_id)).toEqual(['qa-1', 'qa-2']);
    expect(component.nextCursor).toBeNull();
  });

  it('shows the service error and its trace', () => {
    reviews.listCases.and.returnValue(
      throwError(() => ({ status: 404, code: 'CASE_LIST_UNAVAILABLE', traceId: 't-1' })),
    );
    fixture.detectChanges();
    expect(component.error).toContain('listado');
    expect(fixture.nativeElement.textContent).toContain('Traza: t-1');
  });

  it('shows an empty state', () => {
    reviews.listCases.and.returnValue(of({ items: [], next_cursor: null }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay expedientes pendientes');
  });

  it('opens a case by trimmed ID and ignores a blank one', () => {
    component.open('  ');
    expect(router.navigate).not.toHaveBeenCalled();
    component.open(' qa-9 ');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard/reviews', 'qa-9']);
  });

  it('marks cases close to their deadline and overdue ones', () => {
    component.now = Date.parse('2026-12-01T12:00:00Z');
    const soon = summary({ expires_at: '2026-12-01T13:00:00Z' });
    const later = summary({ expires_at: '2026-12-02T12:00:00Z' });
    const due = summary({ expires_at: '2026-12-01T11:00:00Z' });
    expect(component.urgent(soon)).toBeTrue();
    expect(component.urgent(later)).toBeFalse();
    expect(component.remaining(soon)).toBe('1 h 0 min');
    expect(component.remaining(due)).toBeNull();
  });

  it('refreshes its clock and stops on destroy', fakeAsync(() => {
    fixture.detectChanges();
    const before = component.now;
    tick(30000);
    expect(component.now).toBeGreaterThanOrEqual(before);
    fixture.destroy();
    discardPeriodicTasks();
  }));
});
