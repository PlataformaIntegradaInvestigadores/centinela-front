import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ArticleService } from 'src/app/search-engine/domain/services/article.service';
import { Article } from 'src/app/shared/interfaces/article.interface';

@Component({
  selector: 'app-article-page',
  templateUrl: './article-page.component.html',
  styleUrls: ['./article-page.component.css'],
})
export class ArticlePageComponent implements OnInit {
  article!: Article | undefined;
  isLoading: boolean = true;
  loadError: string | null = null;

  scopusId: string = '';

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private title: Title,
    private location: Location,
    @Inject(Router) private router: Router,
  ) {}
  setArticleTitle() {
    this.title.setTitle(this.article?.title ?? '');
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    this.route.params.subscribe((params) => {
      this.scopusId = params['scopusId'];
    });
    this.retrieveArticle();
  }

  retrieveArticle() {
    this.isLoading = true;
    this.loadError = null;
    this.articleService.getArticleById(this.scopusId).subscribe({
      next: (article) => {
        this.article = article;
        this.setArticleTitle();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching article detail', error);
        this.article = undefined;
        this.loadError =
          error?.status === 404
            ? 'The requested article could not be found.'
            : 'Article details are temporarily unavailable.';
        this.isLoading = false;
      },
    });
  }
  goToArticle(scopus: string | undefined) {
    window.open(
      `https://www.scopus.com/record/display.uri?eid=2-s2.0-${scopus}&origin=resultslist`,
      '_blank',
    );
  }

  goToAuthor(scopus_id: string) {
    this.router.navigate(['/profile', scopus_id]);
  }

  backToResults() {
    this.location.back();
  }
}
