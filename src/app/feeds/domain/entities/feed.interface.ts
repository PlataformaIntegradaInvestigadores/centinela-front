/**
 * Representa metadatos de trending para un post
 */
export interface TrendingMetadata {
  hours_old: number;
  engagement_score: number;
  trending_rank: number;
}

/**
 * Estado de moderación (discurso de odio) que expone social-service.
 * p_hate, label y case_id solo llegan a moderadores.
 */
export interface ModerationInfo {
  status: 'pending' | 'classified' | 'failed';
  visibility: 'visible' | 'hidden' | 'blocked';
  show_warning: boolean;
  is_blocked: boolean;
  sort_last: boolean;
  review_status: 'none' | 'pending' | 'resolved';
  reasons: string[];
  report_count: number;
  can_report: boolean;
  p_hate?: number | null;
  label?: string | null;
  case_id?: number | null;
}

/**
 * Representa un post en el feed
 */
export interface FeedPost {
  id: string;
  content: string;
  files?: PostFile[];
  poll?: Poll;
  tags: string[];
  is_public: boolean;
  author: FeedAuthor;
  created_at: Date;
  updated_at: Date;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  engagement_score?: number;
  trending_metadata?: TrendingMetadata;
  moderation?: ModerationInfo;
}

/**
 * Representa un archivo adjunto a un post
 */
export interface PostFile {
  id: string;
  file: string;
  file_type: string;
  file_size: number;
  original_filename?: string;
  alt_text?: string;
  uploaded_at: Date;
}

/**
 * Representa el autor de un post
 */
export interface FeedAuthor {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  email: string;
}

/**
 * Representa un comentario en un post
 */
export interface Comment {
  id: string;
  content: string;
  author: FeedAuthor;
  parent_comment?: string;
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  replies?: Comment[];
  moderation?: ModerationInfo;
}

/**
 * Representa un like
 */
export interface Like {
  id: string;
  user: FeedAuthor;
  content_type: string;
  object_id: string;
  created_at: Date;
}

/**
 * Representa una encuesta
 */
export interface Poll {
  id: string;
  question: string;
  is_multiple_choice: boolean;
  is_anonymous: boolean;
  allows_other: boolean;
  expires_at?: Date;
  is_active: boolean;
  options: PollOption[];
  total_votes: number;
  user_voted: boolean;
  user_votes: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Representa una opción de encuesta
 */
export interface PollOption {
  id: string;
  text: string;
  votes_count: number;
  order: number;
  user_voted: boolean;
}

/**
 * Representa un voto en encuesta
 */
export interface PollVote {
  id: string;
  option: string;
  created_at: Date;
}

/**
 * Representa la respuesta del feed
 */
export interface FeedResponse {
  posts: FeedPost[];
  has_next: boolean;
  next_cursor?: string;
  total_count: number;
}

/**
 * Representa los filtros para el feed
 */
export interface FeedFilters {
  feed_type?: 'personalized' | 'trending' | 'latest';
  tags?: string[];
  author?: string;
  time_range?: 'day' | 'week' | 'month' | 'all';
  cursor?: string;
  limit?: number;
}

/**
 * Representa los datos para crear un nuevo post
 */
export interface CreatePostData {
  content: string;
  files?: File[];
  tags?: string[];
  is_public?: boolean;
  poll_data?: {
    question: string;
    options: string[];
  };
}

/**
 * Representa las estadísticas del usuario en el feed
 */
export interface UserFeedStats {
  total_posts: number;
  total_likes_received: number;
  total_comments_received: number;
  total_views_received: number;
  total_shares_received: number;
  average_engagement: number;
  most_liked_post?: {
    id: string;
    content: string;
    likes_count: number;
  };
  most_commented_post?: {
    id: string;
    content: string;
    comments_count: number;
  };
}

/**
 * Representa los datos para crear un comentario
 */
export interface CreateCommentData {
  content: string;
  parent_comment?: string;
}

/**
 * Representa la respuesta de comentarios del API
 */
export interface CommentsResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Comment[];
}
