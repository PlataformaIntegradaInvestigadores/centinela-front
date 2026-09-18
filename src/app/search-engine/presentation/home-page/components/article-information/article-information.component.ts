import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  Inject,
  OnInit,
  OnChanges,
} from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap } from 'rxjs';
import {
  Article,
  ArticleResult,
  PaginationArticleResult,
} from '../../../../../shared/interfaces/article.interface';
import { ArticleService } from '../../../../domain/services/article.service';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';

type PublicationDateFilter = 'any' | 'year0' | 'year1' | 'year2' | 'custom';

@Component({
  selector: 'app-article-information',
  templateUrl: './article-information.component.html',
  styleUrls: ['./article-information.component.css'],
})
export class ArticleInformationComponent implements OnInit, OnChanges {
  displayedColumns: string[] = [
    'title',
    'author_count',
    'affiliation_count',
    'publication_date',
    'relevance',
  ];

  @Input() query!: string;
  @Output() loading: EventEmitter<boolean> = new EventEmitter<boolean>();

  clickedRows = (row: ArticleResult) => this.seeMoreInformation(row.scopus_id);

  page = 1;
  size = 10;
  total = 0;
  isFirstLoad = true;
  isFiltering = false;
  isPaginating = false;
  isServerOnline = true;
  refreshTable$: BehaviorSubject<{ page: number; size: number; years?: number[] }> =
    new BehaviorSubject<{ page: number; size: number; years?: number[] }>({
      page: this.page,
      size: this.size,
    });

  articles$!: Observable<PaginationArticleResult>;

  article!: Article;

  years: number[] = [];
  setYears = true;

  selectedYears: number[] = [];
  activeFilter: PublicationDateFilter = 'custom';
  currentYear = new Date().getFullYear();
  showCustomRange = true;
  minAvailableYear = 2000;
  maxAvailableYear = this.currentYear;
  startYear = this.minAvailableYear;
  endYear = this.maxAvailableYear;
  appliedStartYear: number | null = null;
  appliedEndYear: number | null = null;
  private hasSearchFilterYears = false;

  constructor(
    private articleService: ArticleService,
    private route: ActivatedRoute,
    @Inject(Router) private router: Router,
  ) {}

  ngOnInit() {
    this.restoreStateFromUrl();
    this.loadSearchFilters();
    this.articles$ = this.refreshTable$.pipe(
      tap(() => {
        this.loading.emit(true);
      }),
      switchMap(({ page, size, years }) => {
        if (years && years.length > 0) {
          return this.articleService.getMostRelevantArticlesByQuery(this.query, page, size, years);
        }
        return this.articleService.getMostRelevantArticlesByQuery(this.query, page, size);
      }),
      tap((response) => {
        this.loading.emit(false);
        this.isFiltering = false;
        this.isPaginating = false;
        this.isFirstLoad = false;
        this.total = response.total_results ?? response.total;

        if (this.setYears && response.years && !this.hasSearchFilterYears) {
          this.updateAvailableYears(response.years.map((year) => Number(year)));
        }
      }),
      catchError((error) => {
        console.error('Error fetching data', error);
        this.isFiltering = false;
        this.isPaginating = false;
        this.isFirstLoad = false;
        this.isServerOnline = error?.status !== 0;
        this.loading.emit(false);
        this.total = 0;
        return of({ data: [], total: 0 } as PaginationArticleResult);
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['query'] && !changes['query'].isFirstChange()) {
      this.setYears = true;
      this.selectedYears = [];
      this.page = 1;
      this.activeFilter = 'custom';
      this.showCustomRange = true;
      this.isFirstLoad = true;
      this.refreshTable$.next({ page: this.page, size: this.size });
      this.updateQueryParams();
    }
  }

  /*
asi es como esta haciendo la paginacion 
  onChangePagination(event: PageEvent) {
    this.setYears = false
    this.page = event.pageIndex + 1
    this.size = event.pageSize
    if (this.selectedType)
      this.refreshTable$.next({page: this.page, size: this.size, type: this.selectedType, years: this.selectedYears})
    else
      this.refreshTable$.next({page: this.page, size: this.size})
  }
*/
  onChangePagination(event: PageEvent) {
    this.setYears = false;
    this.page = event.pageIndex + 1; // Ya se está haciendo bien
    this.size = event.pageSize;
    const payload: { page: number; size: number; years?: number[] } = {
      page: this.page,
      size: this.size,
    };

    if (this.selectedYears.length > 0) {
      payload.years = this.selectedYears;
    }

    this.isPaginating = true;
    this.refreshTable$.next(payload);
    this.updateQueryParams();
  }

  applyScholarFilter(filter: PublicationDateFilter) {
    this.activeFilter = filter;
    this.showCustomRange = filter === 'custom';

    if (filter === 'custom') {
      return;
    }

    if (filter === 'any') {
      this.selectedYears = [];
      this.applyFilters();
      return;
    }

    const offset = filter === 'year0' ? 0 : filter === 'year1' ? 1 : 2;
    const start = this.currentYear - offset;
    this.selectedYears = Array.from(
      { length: this.currentYear - start + 1 },
      (_, index) => start + index,
    );
    this.applyFilters();
  }

  applyCustomRange() {
    const start = Math.max(this.minAvailableYear, Number(this.startYear));
    const end = Math.min(this.maxAvailableYear, Number(this.endYear));

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      return;
    }

    this.startYear = start;
    this.endYear = end;
    this.appliedStartYear = start;
    this.appliedEndYear = end;
    this.selectedYears = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    this.applyFilters();
  }

  private applyFilters() {
    this.setYears = false;
    this.page = 1;
    const payload: { page: number; size: number; years?: number[] } = {
      page: this.page,
      size: this.size,
    };

    if (this.selectedYears.length > 0) {
      payload.years = [...this.selectedYears];
    }

    this.isFiltering = true;
    this.refreshTable$.next(payload);
    this.updateQueryParams();
  }

  private loadSearchFilters() {
    this.articleService.getSearchFilters().subscribe({
      next: (filters) => {
        const filterYears = filters.years ?? [];
        if (filterYears.length > 0) {
          this.hasSearchFilterYears = true;
          this.updateAvailableYears(filterYears);
        }
      },
      error: (error) => {
        console.error('Error fetching filters', error);
      },
    });
  }

  private updateAvailableYears(years: number[]) {
    const validYears = years
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    this.years = [...new Set(validYears)];
    if (this.years.length === 0) {
      return;
    }

    this.minAvailableYear = Math.min(...this.years);
    this.maxAvailableYear = Math.max(...this.years);

    if (this.activeFilter !== 'custom' || this.selectedYears.length === 0) {
      this.startYear = this.minAvailableYear;
      this.endYear = this.maxAvailableYear;
    } else {
      this.startYear = Math.max(this.minAvailableYear, this.startYear);
      this.endYear = Math.min(this.maxAvailableYear, this.endYear);
    }
  }

  private restoreStateFromUrl() {
    const params = this.route.snapshot.queryParamMap;
    const page = Number(params.get('page'));
    const size = Number(params.get('size'));
    const activeFilter = params.get('activeFilter') as PublicationDateFilter | null;
    const validFilters: PublicationDateFilter[] = ['any', 'year0', 'year1', 'year2', 'custom'];

    if (Number.isInteger(page) && page > 0) this.page = page;
    if (Number.isInteger(size) && size > 0) this.size = size;
    if (activeFilter && validFilters.includes(activeFilter)) {
      this.activeFilter = activeFilter;
      this.showCustomRange = activeFilter === 'custom';
    }

    const years = (params.get('years') ?? '')
      .split(',')
      .filter((year) => year.trim() !== '')
      .map(Number)
      .filter(Number.isFinite);

    this.selectedYears = [...new Set(years)];
    if (this.activeFilter === 'custom' && this.selectedYears.length > 0) {
      this.startYear = Math.min(...this.selectedYears);
      this.endYear = Math.max(...this.selectedYears);
      this.appliedStartYear = this.startYear;
      this.appliedEndYear = this.endYear;
    }

    this.refreshTable$.next({
      page: this.page,
      size: this.size,
      years: this.selectedYears.length > 0 ? this.selectedYears : undefined,
    });
  }

  private updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.page > 1 ? this.page : null,
        size: this.size !== 10 ? this.size : null,
        activeFilter: this.activeFilter !== 'any' ? this.activeFilter : null,
        years: this.selectedYears.length > 0 ? this.selectedYears.join(',') : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  seeMoreInformation(scopusId: string) {
    this.router.navigate(['home/article', scopusId]);
  }
}
