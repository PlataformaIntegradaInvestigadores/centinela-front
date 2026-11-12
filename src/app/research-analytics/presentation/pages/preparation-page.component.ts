import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { PreparationService } from '../../domain/services/preparation.service';
import {
  PreparationConfiguration,
  QualityReport,
  WorksetSummary,
} from '../../domain/entities/preparation';

type Action =
  | { kind: 'preview'; configuration: PreparationConfiguration }
  | { kind: 'create'; configuration: PreparationConfiguration; expectedWorksetId: string }
  | { kind: 'load'; identifier: string };

@Component({
  selector: 'app-preparation-page',
  templateUrl: './preparation-page.component.html',
  styleUrls: ['./corpus-page.component.css'],
})
export class PreparationPageComponent implements OnInit, OnDestroy {
  configuration: PreparationConfiguration = {
    missing_abstract: 'exclude',
    duplicates: 'exclude_later',
    min_tokens: 5,
    start_year: 2020,
    end_year: 2025,
  };
  quality: QualityReport | null = null;
  qualityState: 'loading' | 'ready' | 'error' = 'loading';
  qualityError = '';
  state: 'idle' | 'loading' | 'preview' | 'saved' | 'error' = 'idle';
  error = '';
  result: WorksetSummary | null = null;
  identifier = '';
  readonly tokenLabels: Record<string, string> = {
    '0': 'Sin tokens',
    '1_49': '1 a 49',
    '50_199': '50 a 199',
    '200_plus': '200 o más',
  };
  readonly exclusionLabels: Record<string, string> = {
    missing_abstract: 'Sin resumen',
    duplicate_text: 'Texto repetido',
    insufficient_tokens: 'Texto insuficiente',
    outside_year_filter: 'Fuera del rango de años',
  };
  private readonly actions = new Subject<Action>();
  private readonly qualityRequests = new Subject<void>();
  private readonly destroyed = new Subject<void>();

  constructor(private readonly service: PreparationService) {}

  get busy(): boolean {
    return this.state === 'loading';
  }

  get valid(): boolean {
    const c = this.configuration;
    return (
      Number.isInteger(c.min_tokens) &&
      c.min_tokens >= 1 &&
      c.min_tokens <= 10000 &&
      Number.isInteger(c.start_year) &&
      Number.isInteger(c.end_year) &&
      c.start_year >= 1 &&
      c.end_year <= 9999 &&
      c.start_year <= c.end_year
    );
  }

  ngOnInit(): void {
    this.qualityRequests
      .pipe(
        tap(() => {
          this.qualityState = 'loading';
          this.quality = null;
          this.qualityError = '';
        }),
        switchMap(() =>
          this.service.quality().pipe(
            catchError((error: HttpErrorResponse) => {
              this.qualityError = this.message(error);
              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((report) => {
        this.quality = report;
        this.qualityState = report ? 'ready' : 'error';
      });
    this.actions
      .pipe(
        tap(() => {
          this.state = 'loading';
          this.result = null;
          this.error = '';
        }),
        switchMap((action) => {
          const response =
            action.kind === 'load'
              ? this.service.workset(action.identifier)
              : action.kind === 'preview'
                ? this.service.preview(action.configuration)
                : this.service.create(action.configuration, action.expectedWorksetId);
          return response.pipe(
            tap((result) => {
              this.state = action.kind === 'preview' ? 'preview' : 'saved';
              this.configuration = { ...result.configuration };
            }),
            catchError((error: HttpErrorResponse) => {
              this.error = this.message(error);
              this.state = 'error';
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroyed),
      )
      .subscribe((result) => {
        this.result = result;
      });
    this.reloadQuality();
  }

  reloadQuality(): void {
    this.qualityRequests.next();
  }

  changed(): void {
    this.result = null;
    this.state = 'idle';
    this.error = '';
  }

  preview(): void {
    if (this.busy) return;
    if (!this.valid) {
      this.changed();
      this.state = 'error';
      this.error = 'Revisa los años y el mínimo de tokens.';
      return;
    }
    this.actions.next({ kind: 'preview', configuration: { ...this.configuration } });
  }

  create(): void {
    if (this.state !== 'preview' || !this.result || !this.valid || !this.result.counts.included)
      return;
    this.actions.next({
      kind: 'create',
      configuration: { ...this.configuration },
      expectedWorksetId: this.result.workset_id,
    });
  }

  load(): void {
    if (this.busy) return;
    const identifier = this.identifier.trim();
    if (!/^[a-f0-9]{64}$/.test(identifier)) {
      this.changed();
      this.state = 'error';
      this.error = 'Introduce un identificador de 64 caracteres hexadecimales.';
      return;
    }
    this.actions.next({ kind: 'load', identifier });
  }

  message(error: HttpErrorResponse): string {
    if (error.error?.detail?.code === 'preparation_changed')
      return 'La preparación cambió. Previsualiza la selección de nuevo antes de guardarla.';
    if (error.status === 503)
      return 'El corpus o el almacenamiento de conjuntos no está configurado o disponible en el servidor local.';
    if (error.status === 401 || error.status === 403)
      return 'Tu sesión no tiene acceso a esta operación.';
    if (error.status === 404)
      return 'El conjunto solicitado no existe en el almacenamiento configurado.';
    if (error.status === 422)
      return 'No se pudo validar la configuración o la integridad del conjunto.';
    return 'No se pudo completar la operación. Comprueba la conexión y vuelve a intentarlo.';
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
