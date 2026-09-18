import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap } from 'rxjs';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { PaginationAuthorResult } from 'src/app/shared/interfaces/author.interface';

@Component({
  selector: 'app-author-retrieve',
  templateUrl: './author-retrieve.component.html',
  styleUrls: ['./author-retrieve.component.css'],
})
export class AuthorRetrieveComponent implements OnInit, OnChanges {
  @Input()
  query: string = '';
  pageEvent: PageEvent = new PageEvent();
  page: number = 1;
  size: number = 10;
  total: number = 0;
  authors!: Observable<PaginationAuthorResult>;
  refreshTable$: BehaviorSubject<{ page: number; size: number }> = new BehaviorSubject<{
    page: number;
    size: number;
  }>({ page: this.page, size: this.size });
  isLoading: boolean = false;
  isFirstLoad: boolean = true;
  isPaginating: boolean = false;
  displayedColumns: string[] = [
    'name',
    'current_affiliation',
    'articles',
    'topics',
    'affiliations',
    'citation_count',
    'updated',
  ];
  isServerOnline: boolean = true;
  constructor(
    private authorService: AuthorService,
    @Inject(Router) private router: Router,
  ) {}

  ngOnInit(): void {
    this.retrieveAuthors();
  }

  retrieveAuthors() {
    this.authors = this.refreshTable$.pipe(
      tap(() => {
        this.isLoading = true;
      }),
      switchMap(({ page, size }) => {
        return this.authorService.getAuthorsByQuery(this.query, page, size).pipe(
          catchError((error) => {
            console.log(error);
            if (error.status === 0) {
              this.isServerOnline = false;
            }
            this.isLoading = false;
            this.isFirstLoad = false;
            this.isPaginating = false;
            return of({ authors: [], total: 0, data: [] } as PaginationAuthorResult);
          }),
        );
      }),
      tap((authors) => {
        this.total = authors.total;
        this.isLoading = false;
        this.isFirstLoad = false;
        this.isPaginating = false;
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']) {
      this.isFirstLoad = true;
      this.refreshTable$.next({ page: this.page, size: this.size });
    }
  }

  onChangePagination(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.size = event.pageSize;
    this.isPaginating = true;
    this.refreshTable$.next({ page: this.page, size: this.size });
  }

  goToScopus(scopus_id: string) {
    window.open(`https://www.scopus.com/authid/detail.uri?authorId=${scopus_id}`, '_blank');
  }

  goToAuthor(scopus_id: string) {
    this.router.navigate(['/profile', scopus_id], {
      queryParams: {
        returnUrl: this.router.url,
      },
    });
  }
}
