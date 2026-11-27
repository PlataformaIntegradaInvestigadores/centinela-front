import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ReviewInboxComponent } from './review-inbox.component';
import { ReviewDatePipe } from '../../pipes/review-format.pipes';
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
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    reviews = jasmine.createSpyObj('ReviewService', ['listCases']);
    reviews.listCases.and.returnValue(of({ items: [summary()], next_cursor: null }));
    query = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      declarations: [ReviewInboxComponent, ReviewDatePipe],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: ReviewService, useValue: reviews },
        { provide: ActivatedRoute, useValue: { queryParamMap: query } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReviewInboxComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => fixture.destroy());

  it('loads pending cases by default and shows them', () => {
    fixture.detectChanges();
    expect(reviews.listCases).toHaveBeenCalledWith({
      status: 'pending',
      caseType: undefined,
      cursor: null,
      limit: 25,
    });
    expect(fixture.nativeElement.textContent).toContain('Preguntas y respuestas');
  });

  it('reads valid filters from the URL and ignores invalid ones', () => {
    fixture.detectChanges();
    query.next(convertToParamMap({ tipo: 'rag', estado: 'expired' }));
    expect(reviews.listCases.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ caseType: 'rag', status: 'expired' }),
    );
    expect(component.statusLabel).toBe('Vencidos');
    query.next(convertToParamMap({ tipo: 'x', estado: 'y' }));
    expect(component.caseType).toBeNull();
    expect(component.status).toBe('pending');
  });

  it('writes filters to the URL', () => {
    component.setType('recommendation');
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { tipo: 'recommendation' } }),
    );
    component.setStatus('reject');
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { estado: 'reject' } }),
    );
    component.setStatus('pending');
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { estado: null } }),
    );
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

  it('keeps the service error and its trace', () => {
    reviews.listCases.and.returnValue(
      throwError(() => ({ status: 404, code: 'CASE_LIST_UNAVAILABLE', traceId: 't-1' })),
    );
    fixture.detectChanges();
    expect(component.error).toContain('listado');
    expect(component.traceId).toBe('t-1');
  });

  it('teaches what fills an empty queue', () => {
    reviews.listCases.and.returnValue(of({ items: [], next_cursor: null }));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No hay expedientes pendientes');
    expect(text).toContain('Aparecen aquí');
  });

  it('opens a case by trimmed ID and ignores a blank one', () => {
    component.open('  ');
    expect(router.navigate).not.toHaveBeenCalled();
    component.open(' qa-9 ');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard/reviews', 'qa-9']);
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
