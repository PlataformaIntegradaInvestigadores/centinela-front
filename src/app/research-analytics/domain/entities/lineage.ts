export interface LayerObject {
  layer: 'bronze' | 'silver' | 'gold' | 'models';
  object_sha256: string;
  rows?: number;
  bytes?: number;
  schema?: Record<string, string>;
}

export interface LayerRelease {
  release_id: string;
  published_at: string;
  parent: string | null;
  storage_scope: string;
  distributed_lakehouse_verified: boolean;
  lineage: {
    dataset: string;
    study_run_id: string;
    review_run_id: string;
    signed_plan_sha256: string;
    source_sha256: Record<string, string>;
    date_semantics: string;
  };
  tables: Record<string, LayerObject>;
  blobs: Record<string, LayerObject>;
}
