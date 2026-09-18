import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FairnessDashboardComponent } from './fairness-dashboard.component';
import { FairnessService } from 'src/app/search-engine/domain/services/fairness.service';
import { FairnessSummary } from 'src/app/search-engine/domain/entities/fairness.interface';

describe('FairnessDashboardComponent', () => {
  let component: FairnessDashboardComponent;
  let fairnessServiceSpy: jasmine.SpyObj<FairnessService>;

  const summary: FairnessSummary = {
    meta: { generated: '2024-01-01', proyecto: 'p', thresholds: { di_min: 0.8, spd: [-0.1, 0.1], util_max_drop: 0.05 } },
    baseline: [],
    shap: [{ feature: 'age', pct: 30 }],
    model_mitigation: {
      baseline: { DI: 0.5 },
      reweighing: {},
      threshold_adj: { DI: 0.9 },
      alpha_optimo: 0.3,
      alpha_sweep: [
        { alpha: 0.1, SPD: 0.1, DI: 0.5, accuracy: 0.8, caida_util: 2, tasa_pequena: 0.1, spd_ok: true, di_ok: true },
        { alpha: 0.3, SPD: 0.05, DI: 0.85, accuracy: 0.82, caida_util: 3, tasa_pequena: 0.1, spd_ok: true, di_ok: true },
        { alpha: 0.5, SPD: 0.02, DI: 0.9, accuracy: 0.83, caida_util: 6, tasa_pequena: 0.1, spd_ok: true, di_ok: true },
      ],
    },
    search_mitigation: {
      lambda_optimo: 0.7,
      lambda_sweep: [
        { lambda: 0.5, n_areas: 4, gini: 0.2, ndcg: 0.8, score: 0.7, caida_ndcg: 3 },
        { lambda: 0.7, n_areas: 6, gini: 0.15, ndcg: 0.78, score: 0.75, caida_ndcg: 4 },
      ],
      comparison: [{ query: 'q1', areas_base: 3, areas_xquad: 5 }],
    },
    impact: [],
    verdict: [{ Componente: 'modelo', Veredicto: 'Cumple' }],
    selection: {
      modelo_predictivo: {
        estrategia: 'threshold',
        parametro: '0.3',
        cumple_equidad: true,
        cumple_utilidad: true,
        equidad: 'ok',
        utilidad: 'ok',
        robustez: 'ok',
        decision: 'usar',
        alternativa: 'ninguna',
      },
      motor_busqueda: {
        estrategia: 'xquad',
        parametro: '0.7',
        cumple_equidad: true,
        cumple_utilidad: true,
        equidad: 'ok',
        utilidad: 'ok',
        robustez: 'ok',
        decision: 'usar',
        alternativa: 'ninguna',
      },
      umbrales: { di_min: 0.8, spd: [-0.1, 0.1], util_max_drop: 0.05 },
    },
  };

  beforeEach(() => {
    fairnessServiceSpy = jasmine.createSpyObj('FairnessService', ['getSummary']);

    TestBed.configureTestingModule({
      declarations: [FairnessDashboardComponent],
      providers: [{ provide: FairnessService, useValue: fairnessServiceSpy }],
    });
    component = TestBed.createComponent(FairnessDashboardComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads data, picks nearest sweep indices, and builds charts', () => {
      fairnessServiceSpy.getSummary.and.returnValue(of(summary));
      component.ngOnInit();

      expect(component.data).toBe(summary);
      expect(component.loading).toBeFalse();
      expect(component.alphaIdx).toBe(1);
      expect(component.lambdaIdx).toBe(1);
      expect(component.shapData).toEqual([{ name: 'age', value: 30 }]);
      expect(component.alphaDiSpd.length).toBe(2);
      expect(component.lambdaAreas.length).toBe(1);
      expect(component.queryData[0].name).toBe('q1');
    });

    it('sets a connection error message for status 0', () => {
      fairnessServiceSpy.getSummary.and.returnValue(throwError(() => ({ status: 0 })));
      component.ngOnInit();
      expect(component.error).toBe('No se pudo conectar con el servidor.');
      expect(component.loading).toBeFalse();
    });

    it('sets a generic error message for other failures', () => {
      fairnessServiceSpy.getSummary.and.returnValue(throwError(() => ({ status: 500 })));
      component.ngOnInit();
      expect(component.error).toContain('Error cargando');
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      fairnessServiceSpy.getSummary.and.returnValue(of(summary));
      component.ngOnInit();
    });

    it('alphaPoint returns the sweep entry at alphaIdx', () => {
      expect(component.alphaPoint?.alpha).toBe(0.3);
    });

    it('lambdaPoint returns the sweep entry at lambdaIdx', () => {
      expect(component.lambdaPoint?.lambda).toBe(0.7);
    });

    it('alphaUtilOk is true when caida_util <= 5', () => {
      expect(component.alphaUtilOk).toBeTrue();
    });

    it('lambdaUtilOk is true when caida_ndcg <= 5', () => {
      expect(component.lambdaUtilOk).toBeTrue();
    });

    it('getters default to failing when there is no data', () => {
      component.data = undefined;
      expect(component.alphaPoint).toBeUndefined();
      expect(component.alphaUtilOk).toBeFalse();
    });
  });

  describe('estadoClass', () => {
    it('returns green for cumple states', () => {
      expect(component.estadoClass('Cumple')).toContain('green');
      expect(component.estadoClass('Aceptable')).toContain('green');
      expect(component.estadoClass('Diversa')).toContain('green');
    });

    it('returns red for non-compliant states', () => {
      expect(component.estadoClass('No cumple')).toContain('red');
      expect(component.estadoClass('Sesgo alto')).toContain('red');
      expect(component.estadoClass('Matthew effect')).toContain('red');
    });

    it('returns yellow for degraded/limit states', () => {
      expect(component.estadoClass('Degrada')).toContain('yellow');
      expect(component.estadoClass('Moderada')).toContain('yellow');
    });

    it('returns gray for unknown states', () => {
      expect(component.estadoClass('')).toContain('gray');
      expect(component.estadoClass('unknown')).toContain('gray');
    });
  });
});
