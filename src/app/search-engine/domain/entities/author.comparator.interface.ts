export interface AuthorComparator {
  authors_no_updated: number;
  total_authors: number;
}
export interface ArticleComparator {
  total_centinela: number;
  total_scopus: number;
}

export interface ModelCorpusObserver {
  model: boolean;
  corpus: boolean;
}

export interface Status {
  success: boolean;
  message: string;
}
