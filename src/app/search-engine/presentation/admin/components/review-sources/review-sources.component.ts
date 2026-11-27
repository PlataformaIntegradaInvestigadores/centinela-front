import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { ArticleService } from 'src/app/search-engine/domain/services/article.service';

export interface SourceText {
  articleId: string;
  title: string | null;
  abstract: string | null;
  missing: boolean;
}

/**
 * Shows the corpus text behind each source ID of a retained Q&A answer (rubric §9).
 * The service keeps only the IDs, so the text comes from the search corpus, not from
 * the context the generator received.
 */
@Component({
  selector: 'app-review-sources',
  templateUrl: './review-sources.component.html',
})
export class ReviewSourcesComponent implements OnChanges, OnDestroy {
  @Input() articleIds: string[] = [];

  sources: SourceText[] = [];
  loading = false;
  private request?: Subscription;

  constructor(private articles: ArticleService) {}

  ngOnChanges(): void {
    this.request?.unsubscribe();
    this.sources = [];
    if (this.articleIds.length === 0) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.request = forkJoin(
      this.articleIds.map((articleId) =>
        this.articles.getArticleById(articleId).pipe(
          map((article): SourceText => ({
            articleId,
            title: article.title || null,
            abstract: article.abstract || null,
            missing: false,
          })),
          catchError(() => of({ articleId, title: null, abstract: null, missing: true })),
        ),
      ),
    ).subscribe((sources) => {
      this.sources = sources;
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }
}
