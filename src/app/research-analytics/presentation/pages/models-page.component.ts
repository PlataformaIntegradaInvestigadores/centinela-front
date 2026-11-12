import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ModelPage, ModelSummary, ModelsService } from '../../domain/services/models.service';

@Component({
  selector: 'app-models-page',
  templateUrl: './models-page.component.html',
  styleUrls: ['./corpus-page.component.css'],
})
export class ModelsPageComponent implements OnInit, OnDestroy {
  page: ModelPage | null = null;
  detail: ModelSummary | null = null;
  state: 'loading' | 'ready' | 'error' = 'loading';
  detailState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  error = '';
  detailError = '';
  offset = 0;
  private readonly pages = new Subject<number>();
  private readonly selections = new Subject<string | null>();
  private readonly destroyed = new Subject<void>();
  constructor(private readonly service: ModelsService) {}
  ngOnInit(): void {
    this.pages
      .pipe(
        tap(() => {
          this.state = 'loading';
          this.error = '';
          this.page = null;
          this.select(null);
        }),
        switchMap((offset) =>
          this.service.list(offset).pipe(
            catchError((e: HttpErrorResponse) => {
              this.error = this.message(e);
              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((page) => {
        this.page = page;
        this.state = page ? 'ready' : 'error';
      });
    this.selections
      .pipe(
        tap((id) => {
          this.detail = null;
          this.detailError = '';
          this.detailState = id ? 'loading' : 'idle';
        }),
        switchMap((id) =>
          id
            ? this.service.detail(id).pipe(
                catchError((e: HttpErrorResponse) => {
                  this.detailError = this.message(e);
                  return of(null);
                }),
              )
            : of(null),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((detail) => {
        this.detail = detail;
        if (this.detailState !== 'idle') this.detailState = detail ? 'ready' : 'error';
      });
    this.reload();
  }
  reload(): void {
    this.pages.next(this.offset);
  }
  move(direction: number): void {
    if (!this.page) return;
    const next = this.offset + direction * this.page.limit;
    if (next < 0 || next >= this.page.total) return;
    this.offset = next;
    this.reload();
  }
  select(id: string | null): void {
    this.selections.next(id);
  }
  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
  private message(error: HttpErrorResponse): string {
    if (error.status === 409)
      return 'El modelo no superó la verificación de integridad. No se mostrará su contenido.';
    if (error.status === 404) return 'El modelo solicitado no existe.';
    if (error.status === 503)
      return 'El registro de modelos no está configurado o no está disponible.';
    return 'No se pudo consultar el registro. Reintenta la consulta.';
  }
}
