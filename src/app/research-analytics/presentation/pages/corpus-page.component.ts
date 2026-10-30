import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { CorpusService } from '../../domain/services/corpus.service';
import {
  ArticleDetail,
  ArticlePage,
  CorpusQuery,
  CorpusSummary,
  DescriptorPage,
} from '../../domain/entities/corpus';

@Component({
  selector: 'app-corpus-page',
  templateUrl: './corpus-page.component.html',
  styleUrls: ['./corpus-page.component.css'],
})
export class CorpusPageComponent implements OnInit, OnDestroy {
  state: 'loading' | 'ready' | 'empty' | 'error' = 'loading';
  detailState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  error = '';
  detailError = '';
  summary: CorpusSummary | null = null;
  page: ArticlePage | null = null;
  descriptors: DescriptorPage | null = null;
  detail: ArticleDetail | null = null;
  year = '';
  abstract = 'all';
  author = '';
  descriptor = '';
  query: CorpusQuery = { limit: 20, offset: 0 };
  private readonly requests = new Subject<CorpusQuery>();
  private readonly selections = new Subject<string | null>();
  private readonly destroyed = new Subject<void>();

  constructor(private readonly service: CorpusService) {}

  ngOnInit(): void {
    this.requests
      .pipe(
        tap(() => {
          this.state = 'loading';
          this.error = '';
          this.page = null;
          this.summary = null;
          this.descriptors = null;
          this.closeDetail();
        }),
        switchMap((query) =>
          forkJoin({
            summary: this.service.summary(),
            page: this.service.articles(query),
            descriptors: this.service.descriptors(),
          }).pipe(
            catchError((error: HttpErrorResponse) => {
              this.error = this.message(error);
              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((result) => {
        if (result === null) {
          this.state = 'error';
          return;
        }
        this.summary = result.summary;
        this.page = result.page;
        this.descriptors = result.descriptors;
        this.state = result.page.items.length ? 'ready' : 'empty';
      });
    this.selections
      .pipe(
        switchMap((id) =>
          id === null
            ? of(null)
            : this.service.article(id).pipe(
                catchError(() => {
                  this.detailError = 'No se pudo consultar el documento. Vuelve a intentarlo.';
                  this.detailState = 'error';
                  return of(null);
                }),
              ),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((detail) => {
        this.detail = detail;
        if (detail !== null) this.detailState = 'ready';
      });
    this.reload();
  }

  get years(): string[] {
    return this.summary ? Object.keys(this.summary.diagnostics.articles_by_year).sort() : [];
  }

  message(error: HttpErrorResponse): string {
    if (error.status === 503)
      return 'El servicio analítico no está disponible o no tiene una instantánea configurada.';
    if (error.status === 401 || error.status === 403)
      return 'Tu sesión no tiene acceso a esta consulta.';
    return 'No se pudo consultar el corpus. Comprueba la conexión y vuelve a intentarlo.';
  }

  applyFilters(): void {
    this.query = { limit: 20, offset: 0 };
    if (this.year) this.query.year = Number(this.year);
    if (this.abstract !== 'all') this.query.has_abstract = this.abstract === 'present';
    if (this.author.trim()) this.query.author = this.author.trim();
    if (this.descriptor.trim()) this.query.descriptor = this.descriptor.trim();
    this.reload();
  }

  move(direction: number): void {
    if (this.state === 'loading' || this.page === null) return;
    const offset = this.query.offset + direction * this.query.limit;
    if (offset < 0 || offset >= this.page.total) return;
    this.query = { ...this.query, offset };
    this.reload();
  }

  reload(): void {
    this.requests.next({ ...this.query });
  }

  select(identifier: string): void {
    this.detail = null;
    this.detailError = '';
    this.detailState = 'loading';
    this.selections.next(identifier);
  }

  closeDetail(): void {
    this.detail = null;
    this.detailError = '';
    this.detailState = 'idle';
    this.selections.next(null);
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
