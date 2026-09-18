import { Component, OnInit } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { FairnessService } from 'src/app/search-engine/domain/services/fairness.service';
import {
  FairnessSummary,
  AlphaPoint,
  LambdaPoint,
} from 'src/app/search-engine/domain/entities/fairness.interface';

@Component({
  selector: 'app-fairness-dashboard',
  templateUrl: './fairness-dashboard.component.html',
  styleUrls: ['./fairness-dashboard.component.css'],
})
export class FairnessDashboardComponent implements OnInit {
  data?: FairnessSummary;
  loading = true;
  error = '';

  verdictCols = ['Componente', 'Estrategia', 'DI', 'SPD', 'Caida util', 'Veredicto'];

  // ---- Datos para los graficos (ngx-charts) ----
  shapData: { name: string; value: number }[] = [];
  alphaDiSpd: { name: string; series: { name: string; value: number }[] }[] = [];
  alphaUtil: { name: string; series: { name: string; value: number }[] }[] = [];
  lambdaAreas: { name: string; series: { name: string; value: number }[] }[] = [];
  lambdaNdcg: { name: string; series: { name: string; value: number }[] }[] = [];
  antesDespuesModelo: { name: string; value: number }[] = [];
  antesDespuesBuscador: { name: string; value: number }[] = [];
  queryData: { name: string; series: { name: string; value: number }[] }[] = [];

  // ---- Controles interactivos ----
  alphaIdx = 3; // alpha = 0.3 por defecto
  lambdaIdx = 7; // lambda = 0.7 por defecto

  // ---- Lineas de referencia (umbrales) ----
  diRef = [{ name: 'DI min 0,8', value: 0.8 }];
  utilRef5 = [{ name: 'Umbral 5%', value: 5 }];

  // ---- Esquemas de color ----
  // Paleta apta para daltonismo (se evita el par rojo/verde) y alineada con el
  // acento indigo de Centinela: indigo = estado bueno/"despues", naranja = costo/"antes".
  private readonly CENT_INDIGO = '#4F46E5';
  private readonly CENT_ORANGE = '#EA580C';
  private readonly CENT_CYAN = '#0891B2';
  private readonly CENT_VIOLET = '#7C3AED';

  schemeMetric: Color = {
    name: 'metric',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [this.CENT_INDIGO, this.CENT_ORANGE, this.CENT_CYAN, this.CENT_VIOLET],
  };
  schemeUtil: Color = {
    name: 'util',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [this.CENT_ORANGE],
  };
  schemeAreas: Color = {
    name: 'areas',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [this.CENT_INDIGO],
  };
  schemeBeforeAfter: Color = {
    name: 'ba',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [this.CENT_ORANGE, this.CENT_INDIGO],
  };
  schemeQuery: Color = {
    name: 'q',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [this.CENT_ORANGE, this.CENT_INDIGO],
  };

  constructor(private fairnessService: FairnessService) {}

  ngOnInit(): void {
    this.fairnessService.getSummary().subscribe({
      next: (d) => {
        this.data = d;
        this.alphaIdx = this.indexOfParam(
          d.model_mitigation.alpha_sweep.map((p) => p.alpha),
          d.model_mitigation.alpha_optimo,
        );
        this.lambdaIdx = this.indexOfParam(
          d.search_mitigation.lambda_sweep.map((p) => p.lambda),
          d.search_mitigation.lambda_optimo,
        );
        this.buildCharts(d);
        this.loading = false;
      },
      error: (e) => {
        this.error =
          e?.status === 0
            ? 'No se pudo conectar con el servidor.'
            : 'Error cargando los datos de fairness. Verifique que el backend tenga fairness_dashboard.json.';
        this.loading = false;
      },
    });
  }

  // Punto del barrido seleccionado por el slider
  get alphaPoint(): AlphaPoint | undefined {
    return this.data?.model_mitigation.alpha_sweep[this.alphaIdx];
  }
  get lambdaPoint(): LambdaPoint | undefined {
    return this.data?.search_mitigation.lambda_sweep[this.lambdaIdx];
  }

  // Cumplimiento de umbrales en el punto seleccionado
  get alphaUtilOk(): boolean {
    return (this.alphaPoint?.caida_util ?? 100) <= 5;
  }
  get lambdaUtilOk(): boolean {
    return (this.lambdaPoint?.caida_ndcg ?? 100) <= 5;
  }

  private indexOfParam(values: number[], target: number): number {
    let best = 0;
    let bestDiff = Infinity;
    values.forEach((v, i) => {
      const diff = Math.abs(v - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    });
    return best;
  }

  private r(n: number, d = 2): number {
    const f = Math.pow(10, d);
    return Math.round(n * f) / f;
  }

  private buildCharts(d: FairnessSummary): void {
    // SHAP: importancia de features
    this.shapData = d.shap.map((s) => ({ name: s.feature, value: s.pct }));

    // Sensibilidad alpha: DI y SPD
    const sweep = d.model_mitigation.alpha_sweep;
    const ax = (p: AlphaPoint) => this.r(p.alpha, 1).toString();
    this.alphaDiSpd = [
      { name: 'DI', series: sweep.map((p) => ({ name: ax(p), value: this.r(p.DI, 3) })) },
      { name: 'SPD', series: sweep.map((p) => ({ name: ax(p), value: this.r(p.SPD, 3) })) },
    ];
    this.alphaUtil = [
      {
        name: 'Caida utilidad (%)',
        series: sweep.map((p) => ({ name: ax(p), value: this.r(p.caida_util, 2) })),
      },
    ];

    // Sensibilidad lambda: diversidad y caida de NDCG
    const lsweep = d.search_mitigation.lambda_sweep;
    const lx = (p: LambdaPoint) => this.r(p.lambda, 1).toString();
    this.lambdaAreas = [
      {
        name: 'Areas unicas (top-50)',
        series: lsweep.map((p) => ({ name: lx(p), value: this.r(p.n_areas, 1) })),
      },
    ];
    this.lambdaNdcg = [
      {
        name: 'Caida NDCG (%)',
        series: lsweep.map((p) => ({ name: lx(p), value: this.r(p.caida_ndcg, 2) })),
      },
    ];

    // Antes/despues (escalas distintas -> dos graficos separados)
    const mb = d.model_mitigation.baseline;
    const mt = d.model_mitigation.threshold_adj;
    this.antesDespuesModelo = [
      { name: 'Antes', value: this.r(mb['DI'], 3) },
      { name: 'Después', value: this.r(mt['DI'], 3) },
    ];
    this.antesDespuesBuscador = [
      { name: 'Antes', value: this.r(lsweep[0].n_areas, 1) },
      { name: 'Después', value: this.r(lsweep[this.lambdaIdx].n_areas, 1) },
    ];

    // xQUAD por consulta: areas base vs xQUAD
    this.queryData = d.search_mitigation.comparison.map((c) => ({
      name: c['query'] as string,
      series: [
        { name: 'BM25 (base)', value: c['areas_base'] as number },
        { name: 'xQUAD', value: c['areas_xquad'] as number },
      ],
    }));
  }

  /** Clase de color segun el estado/veredicto (verde/ambar/rojo). */
  estadoClass(estado: string): string {
    const s = (estado || '').toLowerCase();
    if (s.includes('cumple') && !s.includes('no')) return 'text-green-600 font-semibold';
    if (s.includes('aceptable') || s.includes('diversa')) return 'text-green-600 font-semibold';
    if (
      s.includes('no cumple') ||
      s.includes('no mitiga') ||
      s.includes('sesgo') ||
      s.includes('extrema') ||
      s.includes('alta') ||
      s.includes('matthew')
    ) {
      return 'text-red-600 font-semibold';
    }
    if (s.includes('degrada') || s.includes('limite') || s.includes('moderada')) {
      return 'text-yellow-600 font-semibold';
    }
    return 'text-gray-700';
  }
}
