import { TestBed } from '@angular/core/testing';
import { ReviewDeadlineComponent } from './review-deadline.component';

describe('ReviewDeadlineComponent', () => {
  const now = Date.parse('2026-12-01T12:00:00Z');

  function render(status: 'pending' | 'reject', expiresAt: string): HTMLElement {
    TestBed.configureTestingModule({ declarations: [ReviewDeadlineComponent] });
    const fixture = TestBed.createComponent(ReviewDeadlineComponent);
    Object.assign(fixture.componentInstance, { status, expiresAt, now });
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows time left in a neutral tone', () => {
    const el = render('pending', '2026-12-02T12:00:00Z');
    expect(el.textContent).toContain('Vence en 24 h 0 min');
    expect(el.querySelector('span')?.className).toContain('text-gray-700');
  });

  it('warns under two hours with words, not color alone', () => {
    const el = render('pending', '2026-12-01T13:00:00Z');
    expect(el.textContent).toContain('Vence en 1 h 0 min');
    expect(el.querySelector('span')?.className).toContain('text-amber-800');
  });

  it('says the deadline passed', () => {
    const el = render('pending', '2026-12-01T11:00:00Z');
    expect(el.textContent).toContain('Plazo cumplido');
    expect(el.querySelector('span')?.className).toContain('text-red-700');
  });

  it('shows the final state of a closed case', () => {
    const el = render('reject', '2026-12-01T11:00:00Z');
    expect(el.textContent).toContain('Rechazado');
  });
});
