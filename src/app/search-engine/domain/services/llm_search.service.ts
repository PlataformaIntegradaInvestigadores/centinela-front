import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArticleResult, PaginationArticleResult } from '../../../shared/interfaces/article.interface';

export interface QaPair {
  question: string;
  answer: string;
}

export interface GenerateQaRequestDocument {
  scopus_id?: string;
  title?: string;
  abstract?: string;
}

export interface GenerateQaResponse {
  query: string;
  status: string;
  error?: string;
  qa_pairs: QaPair[];
  raw_response?: string;
  intentos_utilizados?: number;
  latency?: {
    compression_ms: number;
    generation_ms: number;
    total_generator_ms: number;
  };
  source_docs?: { article_id?: string; title?: string }[];
  expected_pairs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LLMSearchService {
  private apiUrl = environment.apiSearch;

  constructor(private http: HttpClient) {}

  semanticSearch(query: string, topK: number = 10): Observable<PaginationArticleResult> {
    return this.http.post<PaginationArticleResult>(`${this.apiUrl}/v2/search`, {
      query,
      page: 1,
      page_size: topK,
      filters: {},
    });
  }

  /**
   * Independent from search. Pass the original query + top search hits.
   * Routed via gateway → search-service `/api-se/v1/llm-search/generate-qa/`.
   */
  generateQa(
    query: string,
    documents: GenerateQaRequestDocument[],
    options?: { use_compression?: boolean; use_iterative?: boolean },
  ): Observable<GenerateQaResponse> {
    return this.http.post<GenerateQaResponse>(`${this.apiUrl}/v1/llm-search/generate-qa/`, {
      query,
      documents,
      use_compression: options?.use_compression ?? false,
      use_iterative: options?.use_iterative ?? true,
    });
  }

  /** Convenience: build generate-qa payload from ranked article hits. */
  documentsFromArticles(articles: ArticleResult[], limit = 3): GenerateQaRequestDocument[] {
    return (articles || []).slice(0, limit).map((article) => ({
      scopus_id: article.scopus_id,
      title: article.title,
      abstract: article.abstract || '',
    }));
  }
}
