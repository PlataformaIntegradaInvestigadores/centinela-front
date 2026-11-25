export interface AnnualPoint {
  year: number;
  count: number;
  denominator: number;
  share: number;
  unassigned_documents: number;
}

export interface ExplainedForecast {
  topic_id: string;
  year: number;
  prediction: number;
  observed: number | null;
  observed_through: number;
  baseline_last_value: number;
  model_id: string;
  explanation: {
    method: string;
    features: string[];
    feature_values: number[];
    reference_values: number[];
    contributions: number[];
    base_value: number;
    output_value: number;
    additivity_residual: number;
    output_scale: string;
  };
}

export interface ErrorMetrics {
  n: number;
  mae: number;
  rmse: number;
}

export interface PairedErrors {
  ridge: ErrorMetrics;
  last_value: ErrorMetrics;
  mae_difference: number;
  rmse_difference: number;
}

export interface ForecastPartition {
  start_year: number;
  end_year: number;
  overall: PairedErrors;
  by_topic: Record<string, PairedErrors>;
  by_year: Record<string, PairedErrors>;
}

export interface ResearchStudy {
  storage_lineage?: { release_id: string; storage_scope: string };
  run_id: string;
  status: string;
  source_articles: number;
  source_unchanged: boolean;
  temporal_mode: string;
  preparation: {
    included: number;
    input_articles: number;
    workset_id: string;
    decisions: Record<string, number>;
  };
  protocol: {
    start_year: number;
    topic_fit_end: number;
    validation_end: number;
    test_end: number;
    rationale: string;
  };
  topic_model_id: string;
  topics: { topic_id: string; terms: string[]; npmi: number }[];
  topic_quality_train: { mean_npmi: number; term_diversity: number };
  topic_quality_test: { mean_npmi: number; term_diversity: number };
  series: Record<string, AnnualPoint[]>;
  forecast_comparison?: {
    validation: ForecastPartition;
    diagnostic: ForecastPartition;
    last_observed_year: number;
    horizon_years: number;
    unit: string;
    diagnostic_scope: string;
  };
  prediction: {
    method: string;
    selected_alpha: number;
    test: { ridge: ErrorMetrics; last_value: ErrorMetrics };
    validation: { ridge: ErrorMetrics; last_value: ErrorMetrics };
    forecasts: ExplainedForecast[];
    test_records: ExplainedForecast[];
    validation_records?: ExplainedForecast[];
    global_explanation: { features: { feature: string; mean_absolute_attribution: number }[] };
    fidelity: { value: number; scope: string };
    stability: { value: number; n: number; interpretation: string };
  };
  limitations: string[];
}
