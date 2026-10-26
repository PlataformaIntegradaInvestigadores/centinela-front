import { ModerationInfo } from 'src/app/feeds/domain/entities/feed.interface';

export type ModeratedContentType = 'post' | 'comment';
export type ModerationDecision = 'approve' | 'keep_hidden' | 'block';

export interface SalientToken {
  token: string;
  saliency: number;
  start: number;
  end: number;
}

export interface ReviewCaseContext {
  exists: boolean;
  author?: { id?: string; username?: string; first_name?: string; last_name?: string } | null;
  post_id?: string | null;
  created_at?: string | null;
}

export interface ReviewCase {
  id: number;
  content_type: ModeratedContentType;
  content_id: string;
  author_id: string | null;
  text: string | null;
  label: string | null;
  p_hate: number | null;
  confidence: number | null;
  decision: string | null;
  explanation: { method: string | null; top_tokens: SalientToken[] };
  visibility: 'visible' | 'hidden' | 'blocked';
  review_status: 'none' | 'pending' | 'resolved';
  reasons: string[];
  report_count: number;
  model_version: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  context?: ReviewCaseContext;
}

export interface ReviewDecisionRecord {
  id: number;
  decision: ModerationDecision;
  moderator_id: string;
  notes: string | null;
  previous_visibility: string;
  new_visibility: string;
  p_hate_at_decision: number | null;
  created_at: string;
}

export interface ReviewCaseDetail extends ReviewCase {
  decisions: ReviewDecisionRecord[];
  report_reasons: string[];
}

export interface ReviewQueuePage {
  total: number;
  limit: number;
  offset: number;
  items: ReviewCase[];
}

export interface ReviewQueueFilters {
  status: 'pending' | 'resolved' | 'all';
  reason?: string;
  content_type?: ModeratedContentType | '';
  limit: number;
  offset: number;
}

export interface ReportResult {
  created: boolean;
  report_count: number;
  threshold_reached: boolean;
  moderation: ModerationInfo;
}
