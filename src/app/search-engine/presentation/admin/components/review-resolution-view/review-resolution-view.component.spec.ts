import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewResolutionViewComponent } from './review-resolution-view.component';

describe('ReviewResolutionViewComponent', () => {
  let fixture: ComponentFixture<ReviewResolutionViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ReviewResolutionViewComponent] });
    fixture = TestBed.createComponent(ReviewResolutionViewComponent);
  });

  it('shows a human resolution that departed from the plan', () => {
    fixture.componentInstance.resolution = {
      resolution_id: 'r-1',
      outcome: 'reject',
      resolved_at: '2026-12-01T11:00:00Z',
      supervisor: { identity_id: 'admin', display_name: 'Administrador' },
      justification: 'Cuota incumplida',
      proposed_outcome: 'modify',
      departed_from_plan: true,
    };
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Rechazado');
    expect(text).toContain('Administrador (admin)');
    expect(text).toContain('se apartó de la propuesta');
    expect(text).toContain('Cuota incumplida');
  });

  it('shows an expiry recorded by the service', () => {
    fixture.componentInstance.resolution = {
      resolution_id: 'r-2',
      outcome: 'expired',
      resolved_at: '2026-12-01T11:00:00Z',
      supervisor: null,
      justification: null,
    };
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Vencido');
    expect(text).toContain('por vencimiento del plazo');
  });
});
