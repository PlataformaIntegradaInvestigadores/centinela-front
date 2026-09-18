export interface Count {
  count: number;
}

export interface DashboardCounts {
  author: number;
  article: number;
  affiliation: number;
  topic: number;
}
export interface AffiliationCounts {
  articles: number;
  topics: number;
}
export interface DashboardCountsYear {
  year: number;
  author: number;
  article: number;
  affiliation: number;
  topic: number;
}
export interface Word {
  text: string;
  size: number;
}

export interface AffiliationId {
  scopus_id: string;
}
export interface LineChartInfo {
  name: string;
  series: NameValue[];
}

export interface NameValue {
  name: string;
  value: number;
}

export interface LineResponse {
  per_year: LineChartInfo;
  acumulative: LineChartInfo;
}

export interface BarTreeResponse {
  name: string;
  per_year: NameValue[];
  acumulative: NameValue;
}

export interface YearsResponse {
  year: number;
  author: number;
  article: number;
  affiliation: number;
  topic: number;
}

export interface Year {
  year: number;
}

export interface AffiliationInfo {
  scopus_id: number;
  name: string;
  total_articles: number;
}

export interface Affiliation {
  id: string;
  scopus_id: number;
  name: string;
  year: number;
  total_articles: number;
}

export interface AuthorYears {
  id: string;
  scopus_id: number;
  year: number;
  total_articles: number;
}

export interface TopicSummary {
  articles: number;
  affiliations: number;
}

export interface TopicInfo {
  name: string;
  total_articles: number;
}

export interface TopicResponse {
  id: string;
  topic_name: string;
  year: number;
  total_articles: number;
}

export interface SystemHealth {
  authors_no_updated: number;
  total_authors: number;
  articles_pending: number;
  stale_collections: number;
  stale_collection_names: string[];
}

export interface EtlStatusResponse {
  status: string;
  message: string;
  last_run_at: string | null;
  last_run_status: string | null;
}

export interface HeatmapCell {
  scopus_id: number;
  topic_name: string;
  total_articles: number;
}

export interface HeatmapResponse {
  affiliations: { scopus_id: number; name: string; total_articles: number }[];
  topics: string[];
  cells: HeatmapCell[];
}
