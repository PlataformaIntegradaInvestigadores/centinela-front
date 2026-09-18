export interface RecommendedTopic {
  id: number;
  topic_name: string;
  group?: number | null;
  tags?: string[];
}

export interface TopicAddedUser {
  id: number;
  topic: RecommendedTopic;
  group: number;
  user: number;
  added_at: string;
}
