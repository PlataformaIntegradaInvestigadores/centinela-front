export interface PreparationConfiguration {
  missing_abstract: 'exclude' | 'title_only';
  duplicates: 'keep' | 'exclude_later';
  min_tokens: number;
  start_year: number;
  end_year: number;
}

export interface WorksetSummary {
  workset_id: string;
  preparation_version: string;
  configuration: PreparationConfiguration;
  source_version: string;
  source_sha256: Record<string, string>;
  counts: { included: number; excluded: number; exclusion_reasons: Record<string, number> };
  duplicate_groups: number;
  purpose: string;
  training: string;
  temporal_precision: string;
  reused?: boolean;
}

export interface QualityReport {
  quality_id: string;
  source_version: string;
  articles: number;
  missing_abstracts: number;
  abstract_token_buckets: Record<string, number>;
  duplicate_text_groups: number;
  duplicate_text_excess: number;
  language: { unknown: number; declared: number; detection: string };
  dates: {
    day_one: number;
    january_one: number;
    articles_by_year: Record<string, number>;
    precision: string;
    coverage: string;
  };
}
