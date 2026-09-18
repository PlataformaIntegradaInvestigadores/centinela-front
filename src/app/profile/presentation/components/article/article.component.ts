import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorService } from '../../../../search-engine/domain/services/author.service';
import { ArticlesResponse } from '../../../../shared/interfaces/article.interface';
import { User } from '../../../domain/entities/user.interfaces';
import { Subscription } from 'rxjs';
import { UserDataService } from '../../../domain/services/user_data.service';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.css'],
})
export class ArticleComponent implements OnInit {
  // El componente actualmente no tiene lógica específica ni datos.

  idRoute!: string;
  articles: ArticlesResponse[] = [];
  pagedArticles: ArticlesResponse[] = [];
  pageIndex = 0;
  pageSize = 10;
  loading = false;
  private userSubscription: Subscription = new Subscription();
  user: User | null = null;
  // articles:

  constructor(
    private route: ActivatedRoute,
    private authorService: AuthorService,
    private router: Router,
    private userDataService: UserDataService,
  ) {}
  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.idRoute = params.get('id') ?? '';
      if (this.isNumeric(this.idRoute)) {
        this.fetchArticles(this.idRoute);
      } else {
        this.userSubscription = this.userDataService.getUser().subscribe((user: User | null) => {
          this.user = user;
          if (this.user?.scopus_id) {
            this.idRoute = this.user.scopus_id;
            this.fetchArticles(this.idRoute);
          }
        });
      }
    });
  }
  isNumeric(value: string): boolean {
    return /^\d+$/.test(value);
  }

  private fetchArticles(id: string): void {
    this.loading = true;
    this.authorService.getArticles(id).subscribe({
      next: (data) => {
        this.articles = data || [];
        this.pageIndex = 0;
        this.updatePaged();
        this.loading = false;
      },
      error: () => {
        this.articles = [];
        this.updatePaged();
        this.loading = false;
      },
    });
  }

  // Paginacion en cliente (el endpoint devuelve todos los articulos del autor de una vez).
  private updatePaged(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedArticles = this.articles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.articles.length / this.pageSize));
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePaged();
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.updatePaged();
    }
  }

  seeMoreInformation(scopusId: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree(['home/article', scopusId]));
    window.open(url, '_blank');
  }
}
