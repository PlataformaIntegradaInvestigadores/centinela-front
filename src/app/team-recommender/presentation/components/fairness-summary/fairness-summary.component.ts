import { Component, Input } from '@angular/core';
import { faCircleInfo, faMicrochip, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';

import {
  FairnessMetrics,
  RecommendDiagnostics,
} from '../../../domain/entities/team-recommendation.interface';

export interface SummaryTile {
  key: string;
  label: string;
  value: string;
  hint: string;
}

/** Panel con las métricas de equidad del Top-k devueltas por el backend. */
@Component({
  selector: 'app-fairness-summary',
  templateUrl: './fairness-summary.component.html',
  styleUrls: ['./fairness-summary.component.css'],
})
export class FairnessSummaryComponent {
  @Input() metrics: Partial<FairnessMetrics> = {};
  @Input() diagnostics: Partial<RecommendDiagnostics> = {};
  @Input() model = '';
  @Input() fairnessEnabled = true;
  @Input() topK = 0;
  @Input() elapsedMs: number | null = null;

  readonly faMicrochip = faMicrochip;
  readonly faScaleBalanced = faScaleBalanced;
  readonly faCircleInfo = faCircleInfo;

  /** 'sentence-transformers/all-MiniLM-L6-v2' -> 'all-MiniLM-L6-v2'. */
  get modelName(): string {
    const name = this.model.split('/').pop();
    return name || 'Modelo no informado';
  }

  get quotaPicks(): number {
    return this.diagnostics.quota_picks ?? 0;
  }

  get tiles(): SummaryTile[] {
    const m = this.metrics;
    return [
      {
        key: 'gini',
        label: 'Diversidad institucional',
        value: this.decimal(m.gini_simpson),
        hint: 'Índice Gini-Simpson (0 = una sola institución, 1 = máxima diversidad).',
      },
      {
        key: 'institutions',
        label: 'Instituciones únicas',
        value:
          m.unique_institutions === undefined
            ? '—'
            : `${m.unique_institutions}${this.topK ? ' de ' + this.topK : ''}`,
        hint: 'Instituciones distintas entre los candidatos recomendados.',
      },
      {
        key: 'relevance',
        label: 'Relevancia retenida',
        value: this.percent(m.relevance_retained),
        hint: 'Relevancia del Top-k final frente al Top-k por relevancia pura.',
      },
      {
        key: 'exposure',
        label: 'Exposición baja visibilidad',
        value: this.percent(m.low_visibility_exposure_share),
        hint:
          m.pool_low_visibility_share === undefined
            ? 'Exposición (ponderada por posición) de perfiles de baja visibilidad.'
            : `Exposición ponderada por posición; en el grupo de candidatos son el ${this.percent(
                m.pool_low_visibility_share,
              )}.`,
      },
    ];
  }

  private decimal(value: number | undefined): string {
    return value === undefined || !Number.isFinite(value) ? '—' : value.toFixed(2);
  }

  private percent(value: number | undefined): string {
    return value === undefined || !Number.isFinite(value) ? '—' : `${(value * 100).toFixed(1)} %`;
  }
}
