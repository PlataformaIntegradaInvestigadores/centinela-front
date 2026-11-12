import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { FairnessSummaryComponent } from './fairness-summary.component';

describe('FairnessSummaryComponent', () => {
  let fixture: ComponentFixture<FairnessSummaryComponent>;
  let component: FairnessSummaryComponent;

  const tile = (key: string) => component.tiles.find((t) => t.key === key)!;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FairnessSummaryComponent],
      imports: [FontAwesomeModule],
    });
    fixture = TestBed.createComponent(FairnessSummaryComponent);
    component = fixture.componentInstance;
  });

  it('formats the metrics, model and quota chip', () => {
    component.metrics = {
      gini_simpson: 0.9,
      unique_institutions: 10,
      relevance_retained: 0.98999,
      low_visibility_exposure_share: 0.1489,
      pool_low_visibility_share: 0.07,
    };
    component.diagnostics = { quota_picks: 2 };
    component.model = 'sentence-transformers/all-MiniLM-L6-v2';
    component.topK = 10;
    component.elapsedMs = 12.4;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(component.modelName).toBe('all-MiniLM-L6-v2');
    expect(tile('gini').value).toBe('0.90');
    expect(tile('institutions').value).toBe('10 de 10');
    expect(tile('relevance').value).toBe('99.0 %');
    expect(tile('exposure').value).toBe('14.9 %');
    expect(tile('exposure').hint).toContain('7.0 %');
    expect(el.querySelector('.model-chip')?.textContent).toContain('all-MiniLM-L6-v2');
    expect(el.querySelector('.rerank-chip')?.textContent).toContain('Re-ranking R1 activo');
    expect(el.querySelector('.quota-chip')?.textContent).toContain('2 perfiles promovidos');
    expect(el.querySelector('.elapsed')?.textContent).toContain('12 ms');
    expect(el.querySelectorAll('.metric-tile').length).toBe(4);
  });

  it('uses the singular for one promoted profile', () => {
    component.diagnostics = { quota_picks: 1 };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.quota-chip').textContent).toContain(
      '1 perfil promovido',
    );
  });

  it('shows placeholders when metrics are missing and the re-ranking is off', () => {
    component.fairnessEnabled = false;
    component.model = '';
    component.diagnostics = { quota_picks: 3 };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(component.modelName).toBe('Modelo no informado');
    expect(component.quotaPicks).toBe(3);
    expect(tile('gini').value).toBe('—');
    expect(tile('institutions').value).toBe('—');
    expect(tile('relevance').value).toBe('—');
    expect(tile('exposure').value).toBe('—');
    expect(tile('exposure').hint).toContain('ponderada por posición');
    expect(el.querySelector('.rerank-chip')?.textContent).toContain('Solo relevancia');
    expect(el.querySelector('.quota-chip')).toBeNull();
    expect(el.querySelector('.elapsed')).toBeNull();
  });

  it('handles non-finite values, no top-k and no diagnostics', () => {
    component.metrics = { gini_simpson: NaN, relevance_retained: Infinity, unique_institutions: 3 };
    component.diagnostics = {};
    component.topK = 0;
    expect(tile('gini').value).toBe('—');
    expect(tile('relevance').value).toBe('—');
    expect(tile('institutions').value).toBe('3');
    expect(component.quotaPicks).toBe(0);
  });
});
