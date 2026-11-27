/**
 * Payloads of the governance-service supervision API (`/api/governance/*`).
 *
 * Case detail and resolution follow `app/api/review_cases.py` (ADR 0003, D6
 * amendment, ADR 0007). The case list and the `rag` section follow contracts
 * that the service has not published yet; see `docs/admin-review.md`.
 */

export type CaseType = 'qa' | 'recommendation' | 'rag';
export type CaseStatus = 'pending' | 'expired' | 'approve' | 'modify' | 'reject';
export type ReviewOutcome = 'approve' | 'modify' | 'reject';

export interface PolicyRef {
  policy_id: string;
  version: string;
}

export interface QaPair {
  question: string;
  answer: string;
}

export interface RecommendedProfile {
  rank: number;
  author_id?: string;
  institution: string;
  low_visibility?: boolean;
  selection_reason?: string;
  relevance_norm?: number;
  institution_novelty?: number;
  final_score?: number;
  [key: string]: unknown;
}

export interface RecommendationDocument {
  recommendations: RecommendedProfile[];
  fairness_metrics?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  parameters?: { rerank?: Record<string, unknown> };
  [key: string]: unknown;
}

export interface ReviewPlan {
  outcome: ReviewOutcome;
  retained_ranks: number[];
}

export interface RagBlock {
  cite_id: string;
  title?: string | null;
  text: string;
}

export interface RagSection {
  query: string;
  answer_text: string;
  blocks: RagBlock[];
  cited_positions: number[];
}

export interface ResolutionView {
  resolution_id: string;
  outcome: ReviewOutcome | 'expired';
  resolved_at: string;
  supervisor: { identity_id: string; display_name: string } | null;
  justification: string | null;
  proposed_outcome?: ReviewOutcome;
  departed_from_plan?: boolean;
}

export interface ReviewCase {
  case_id: string;
  assessment_id: string;
  created_at: string;
  expires_at: string;
  status: CaseStatus;
  policy: PolicyRef;
  reason_codes: string[];
  qa_pairs?: QaPair[];
  source_article_ids?: string[];
  recommendation?: RecommendationDocument;
  review_plan?: ReviewPlan;
  rag?: RagSection;
  resolution: ResolutionView | null;
}

export interface ReviewCaseSummary {
  case_id: string;
  case_type: CaseType;
  created_at: string;
  expires_at: string;
  status: CaseStatus;
  policy: PolicyRef;
  reason_codes: string[];
}

export interface ReviewCasePage {
  items: ReviewCaseSummary[];
  next_cursor: string | null;
}

export interface ReviewCaseQuery {
  status?: CaseStatus;
  caseType?: CaseType;
  cursor?: string | null;
  limit?: number;
}

export interface ResolutionRequest {
  outcome: ReviewOutcome;
  justification?: string;
  qa_pairs?: QaPair[];
  retained_ranks?: number[];
  answer_text?: string;
}

export interface ResolutionResponse extends ResolutionView {
  case_id: string;
}

/** Body of every governance error: a code and a trace ID, never the input. */
export interface GovernanceError {
  status: number;
  code: string;
  traceId: string | null;
}

export function caseTypeOf(reviewCase: ReviewCase): CaseType {
  if (reviewCase.recommendation) {
    return 'recommendation';
  }
  return reviewCase.rag ? 'rag' : 'qa';
}
