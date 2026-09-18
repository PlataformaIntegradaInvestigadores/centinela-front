// Modelo de datos del dashboard de fairness (mitigacion de sesgos).
// Refleja el JSON que sirve /v1/dashboard/fairness/summary/ (resultados S5-S10).

export interface FairnessThresholds {
  di_min: number;
  spd: number[]; // [-0.1, 0.1]
  util_max_drop: number; // 0.05
}

export interface FairnessMeta {
  generated: string;
  proyecto: string;
  thresholds: FairnessThresholds;
}

export interface ShapItem {
  feature: string;
  pct: number;
}

export interface AlphaPoint {
  alpha: number;
  SPD: number;
  DI: number;
  accuracy: number;
  caida_util: number;
  tasa_pequena: number;
  spd_ok: boolean;
  di_ok: boolean;
}

export interface LambdaPoint {
  lambda: number;
  n_areas: number;
  gini: number;
  ndcg: number;
  score: number;
  caida_ndcg: number;
}

export interface ModelMitigation {
  baseline: { [k: string]: number };
  reweighing: { [k: string]: number };
  threshold_adj: { [k: string]: number };
  alpha_optimo: number;
  alpha_sweep: AlphaPoint[];
}

export interface SearchMitigation {
  lambda_optimo: number;
  lambda_sweep: LambdaPoint[];
  comparison: Array<{ [k: string]: number | string }>;
}

export interface SelectionItem {
  estrategia: string;
  parametro: string;
  cumple_equidad: boolean;
  cumple_utilidad: boolean;
  equidad: string;
  utilidad: string;
  robustez: string;
  decision: string;
  alternativa: string;
  efecto_servicio?: string;
}

export interface FairnessSelection {
  modelo_predictivo: SelectionItem;
  motor_busqueda: SelectionItem;
  umbrales: FairnessThresholds;
}

export interface FairnessSummary {
  meta: FairnessMeta;
  baseline: Array<{ [k: string]: number | string }>;
  shap: ShapItem[];
  model_mitigation: ModelMitigation;
  search_mitigation: SearchMitigation;
  impact: Array<{ [k: string]: number | string }>;
  verdict: Array<{ [k: string]: number | string }>;
  selection: FairnessSelection;
}
