export interface Recommendation {
  topic: string;
  novelty: number;
  relevance: number;
  collaborative_signal: number;
  score: number;
  rank: number;
}

export interface ResearchGroup {
  group_id: number;
  members: number[];
  n_members: number;
  papers_total: number;
  recommendations: Recommendation[];
  count: number;
}

export interface GroupsResponse {
  total_groups: number;
  displayed_groups: number;
  groups: ResearchGroup[];
}

export interface MetricsResponse {
  groups_persistent: number;
  topics_unique: number;
  novelty_rate: number;
  new_vs_recent: number;
  coverage: number;
  diversity: number;
  avg_relevance: number;
  avg_score: number;
  fairness_gini: number;
  fairness_score_gap_by_group_size: number;
  n_recommendations: number;
}

export interface RecommendationHealthResponse {
  status: string;
  service_initialized: boolean;
  error: string | null;
}
