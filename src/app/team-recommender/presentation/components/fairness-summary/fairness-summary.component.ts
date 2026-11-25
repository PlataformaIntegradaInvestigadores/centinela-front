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
    return name || 'Model not reported';
  }

  get quotaPicks(): number {
    return this.diagnostics.quota_picks ?? 0;
  }

  get tiles(): SummaryTile[] {
    const m = this.metrics;
    return [
      {
        key: 'gini',
        label: 'Institutional diversity',
        value: this.decimal(m.gini_simpson),
        hint: 'Gini-Simpson index (0 = a single institution, 1 = maximum diversity).',
      },
      {
        key: 'institutions',
        label: 'Unique institutions',
        value:
          m.unique_institutions === undefined
            ? '—'
            : `${m.unique_institutions}${this.topK ? ' of ' + this.topK : ''}`,
        hint: 'Distinct institutions among the recommended candidates.',
      },
      {
        key: 'relevance',
        label: 'Relevance retained',
        value: this.percent(m.relevance_retained),
        hint: 'Relevance of the final Top-k versus the Top-k by pure relevance.',
      },
      {
        key: 'exposure',
        label: 'Low-visibility exposure',
        value: this.percent(m.low_visibility_exposure_share),
        hint:
          m.pool_low_visibility_share === undefined
            ? 'Exposure (position-weighted) of low-visibility profiles.'
            : `Position-weighted exposure; they make up ${this.percent(
                m.pool_low_visibility_share,
              )} of the candidate pool.`,
      },
    ];
  }

  private decimal(value: number | undefined): string {
    return value === undefined || !Number.isFinite(value) ? '—' : value.toFixed(2);
  }

  private percent(value: number | undefined): string {
    return value === undefined || !Number.isFinite(value) ? '—' : `${(value * 100).toFixed(1)}%`;
  }
}
