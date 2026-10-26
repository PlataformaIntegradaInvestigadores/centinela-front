// Contratos HTTP de ethical-recommender-service (FastAPI):
// infrastructure/schemas/recommendation.py y infrastructure/schemas/authors.py.
// Los author_id son IDs Scopus de autor (texto numérico, p. ej. '10040712400').

/** Institución sin registrar en el corpus (constante UNKNOWN_INSTITUTION del backend). */
export const UNKNOWN_INSTITUTION = 'UNKNOWN';

export interface AuthorSearchResult {
  author_id: string;
  name: string | null;
  institution: string;
  low_visibility: boolean;
  article_count: number | null;
  /** Nombre completo «Apellido, Nombre» (p. ej. a partir de first/last name de Scopus); null si no se conoce. */
  full_name?: string | null;
}

export interface AuthorSearchResponse {
  query: string;
  count: number;
  results: AuthorSearchResult[];
}

export type FairnessMode = 'prefix' | 'fair' | 'none';

/** Ajustes del re-ranking R1; el backend aplica R1_suave si se omiten. */
export interface FairnessOptions {
  enabled: boolean;
  lambda?: number;
  max_per_institution?: number | null;
  min_low_visibility_share?: number;
  relevance_floor?: number;
  mode?: FairnessMode;
}

export interface RecommendRequest {
  author_ids: string[];
  top_k: number;
  k_candidates?: number;
  alpha?: number;
  fairness?: FairnessOptions;
}

export interface ResearcherOut {
  author_id: string;
  name: string | null;
  institution: string;
  low_visibility: boolean;
}

/** score = mejor puntaje MMR; quota = promovido por la cuota de baja visibilidad;
 *  cap_relaxed = se relajó el tope por institución por falta de candidatos. */
export type SelectionReason = 'score' | 'quota' | 'cap_relaxed';

export interface RecommendedProfile extends ResearcherOut {
  rank: number;
  baseline_rank: number;
  relevance_score: number;
  relevance_norm: number;
  institution_novelty: number;
  final_score: number;
  selection_reason: SelectionReason;
}

export interface FairnessMetrics {
  gini_simpson: number;
  gini_simpson_m2: number;
  unique_institutions: number;
  unknown_institution_share: number;
  low_visibility_share: number;
  low_visibility_exposure_share: number;
  pool_low_visibility_share: number;
  ndkl: number;
  relevance_retained: number;
}

export interface RecommendDiagnostics {
  candidates_retrieved: number;
  quota_picks: number;
  quota_shortfalls: number;
  cap_relaxations: number;
}

export interface RecommendResponse {
  model: string;
  team: ResearcherOut[];
  recommendations: RecommendedProfile[];
  /** Vacío cuando no hay recomendaciones. */
  fairness_metrics: Partial<FairnessMetrics>;
  diagnostics: Partial<RecommendDiagnostics>;
  parameters: Record<string, unknown>;
}

export interface RecommenderHealth {
  status: string;
  model: string;
  authors: number;
  embedding_dim: number;
  metadata_source: string;
}

export type RecommenderErrorKind = 'unavailable' | 'unknown_ids' | 'invalid' | 'unexpected';

/** Error del recomendador ya traducido para la UI. */
export interface RecommenderError {
  kind: RecommenderErrorKind;
  message: string;
  unknownIds: string[];
}
