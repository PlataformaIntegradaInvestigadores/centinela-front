import { TestBed } from '@angular/core/testing';
import { ReviewPanelComponent } from './review-panel.component';
import { ReviewReasonsComponent } from '../review-reasons/review-reasons.component';
import { ReviewErrorComponent } from '../review-error/review-error.component';
import {
  UNSAVED_DECISION_MESSAGE,
  unsavedDecisionGuard,
} from '../../pages/review-case/unsaved-decision.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('review shared components', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      declarations: [ReviewPanelComponent, ReviewReasonsComponent, ReviewErrorComponent],
    }),
  );

  it('panel names its region with its heading and shows an optional description', () => {
    const fixture = TestBed.createComponent(ReviewPanelComponent);
    fixture.componentInstance.heading = 'Fuentes';
    fixture.detectChanges();
    const section: HTMLElement = fixture.nativeElement.querySelector('section');
    const heading = section.querySelector('h2') as HTMLElement;
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(section.querySelector('p')).toBeNull();
    fixture.componentInstance.description = 'Texto';
    fixture.detectChanges();
    expect(section.textContent).toContain('Texto');
  });

  it('reasons show the label and, on request, the code', () => {
    const fixture = TestBed.createComponent(ReviewReasonsComponent);
    fixture.componentInstance.codes = ['PARTIAL_GENERATION'];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('PARTIAL_GENERATION');
    fixture.componentInstance.showCodes = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PARTIAL_GENERATION');
  });

  it('error shows its trace and runs its action', () => {
    const fixture = TestBed.createComponent(ReviewErrorComponent);
    const error = fixture.componentInstance;
    let clicks = 0;
    error.action.subscribe(() => clicks++);
    error.message = 'Falló';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    error.traceId = 't-1';
    error.actionLabel = 'Reintentar';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('t-1');
    fixture.nativeElement.querySelector('button').click();
    expect(clicks).toBe(1);
  });

  describe('unsavedDecisionGuard', () => {
    const run = (dirty: boolean) =>
      TestBed.runInInjectionContext(() =>
        unsavedDecisionGuard(
          { hasUnsavedDecision: () => dirty },
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
          {} as RouterStateSnapshot,
        ),
      );

    it('lets the reviewer leave when nothing is pending', () => {
      spyOn(window, 'confirm');
      expect(run(false)).toBeTrue();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('asks before discarding an unsent decision', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      expect(run(true)).toBeFalse();
      expect(window.confirm).toHaveBeenCalledWith(UNSAVED_DECISION_MESSAGE);
    });
  });
});
