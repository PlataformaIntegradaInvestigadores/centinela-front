import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { LayerRelease } from '../../domain/entities/lineage';
import { LineageService } from '../../domain/services/lineage.service';

@Component({
  selector: 'app-lineage-page',
  templateUrl: './lineage-page.component.html',
  styleUrls: ['./corpus-page.component.css'],
})
export class LineagePageComponent implements OnInit, OnDestroy {
  data: LayerRelease | null = null;
  state: 'loading' | 'ready' | 'empty' | 'unauthenticated' | 'forbidden' | 'error' = 'loading';
  private readonly requests = new Subject<void>();
  private readonly destroyed = new Subject<void>();

  constructor(private readonly service: LineageService) {}
  ngOnInit(): void {
    this.requests
      .pipe(
        tap(() => {
          this.state = 'loading';
          this.data = null;
        }),
        switchMap(() =>
          this.service.current().pipe(
            catchError((error: HttpErrorResponse) => {
              this.state =
                error.status === 401
                  ? 'unauthenticated'
                  : error.status === 403
                    ? 'forbidden'
                    : error.status === 404
                      ? 'empty'
                      : 'error';
              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((data) => {
        this.data = data;
        if (data) this.state = 'ready';
      });
    this.reload();
  }
  reload(): void {
    this.requests.next();
  }
  get tables() {
    return Object.entries(this.data?.tables || {});
  }
  get sources() {
    return Object.keys(this.data?.lineage.source_sha256 || {});
  }
  layerName(layer: string): string {
    const labels: Record<string, string> = {
      bronze: 'Originales',
      silver: 'Preparados',
      gold: 'Resultados',
      models: 'Modelos',
    };
    return labels[layer] || layer;
  }
  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
