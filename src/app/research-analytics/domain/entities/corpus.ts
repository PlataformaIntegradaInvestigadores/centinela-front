export interface ArticleSummary {
  article_id: string;
  title: string;
  publication_date: string;
  has_abstract: boolean;
  author_count: number;
  descriptor_count: number;
}

export interface ArticlePage {
  status: 'ok' | 'empty';
  total: number;
  offset: number;
  limit: number;
  items: ArticleSummary[];
}

export interface ArticleDetail {
  article_id: string;
  document: {
    title: string;
    abstract: string | null;
    publication_date: string | null;
    keywords: string[];
    language: string | null;
    full_text: string | null;
    available_on: string | null;
  };
  authors: string[];
  descriptors: string[];
}

export interface DescriptorPage {
  status: 'ok' | 'empty';
  total: number;
  offset: number;
  limit: number;
  items: { descriptor: string; articles: number }[];
}

export interface CorpusSummary {
  status: 'ready_for_development';
  training: string;
  diagnostics: {
    articles: number;
    missing_abstracts: number;
    date_precision: string;
    coverage: string;
    articles_by_year: Record<string, number>;
  };
}

export interface CorpusQuery {
  limit: number;
  offset: number;
  year?: number;
  has_abstract?: boolean;
  author?: string;
  descriptor?: string;
}
