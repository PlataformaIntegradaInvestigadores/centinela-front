import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AnnualPoint, ExplainedForecast, ResearchStudy } from '../../domain/entities/study';
import { StudyService } from '../../domain/services/study.service';

@Component({
  selector: 'app-study-page',
  templateUrl: './study-page.component.html',
  styleUrls: ['./corpus-page.component.css', './study-page.component.css'],
})
export class StudyPageComponent implements OnInit, OnDestroy {
  data: ResearchStudy | null = null;
  state: 'loading' | 'ready' | 'error' | 'unauthorized' | 'forbidden' | 'unavailable' = 'loading';
  topic = '';
  explanationYear = 0;
  fromYear: number | null = null;
  toYear: number | null = null;
  rangeError = '';
  private visibleRange: { from: number; to: number } | null = null;
  private readonly requests = new Subject<void>();
  private readonly destroyed = new Subject<void>();

  constructor(
    private readonly service: StudyService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.requests
      .pipe(
        tap(() => {
          this.state = 'loading';
          this.data = null;
        }),
        switchMap(() =>
          this.service.load(this.route.snapshot.queryParamMap.get('release') || undefined).pipe(
            catchError((error: HttpErrorResponse) => {
              this.state = this.errorState(error.status);
              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroyed),
      )
      .subscribe((data) => {
        this.data = data;
        if (data) {
          this.state = 'ready';
          const requestedTopic = this.route.snapshot.queryParamMap.get('topic');
          this.topic =
            data.topics.find((item) => item.topic_id === requestedTopic)?.topic_id ||
            data.topics[0]?.topic_id ||
            '';
          this.resetRange();
          this.changeTopic();
        }
      });
    this.reload();
  }
  reload(): void {
    this.requests.next();
  }
  private errorState(status: number): typeof this.state {
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    return [404, 503].includes(status) ? 'unavailable' : 'error';
  }
  applyRange(): void {
    const from = this.fromYear ?? this.data?.protocol.start_year;
    const to = this.toYear ?? this.data?.protocol.test_end;
    if (
      from === undefined ||
      to === undefined ||
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from > to
    ) {
      this.rangeError = 'Indica años enteros y un intervalo en orden cronológico.';
      return;
    }
    this.rangeError = '';
    this.visibleRange = { from, to };
  }
  resetRange(): void {
    this.fromYear = this.toYear = null;
    this.rangeError = '';
    this.visibleRange = null;
  }
  changeTopic(): void {
    this.explanationYear = this.forecast?.year || 0;
  }
  get points(): AnnualPoint[] {
    const points = this.data?.series[this.topic] || [];
    const range = this.visibleRange;
    return range ? points.filter((p) => p.year >= range.from && p.year <= range.to) : points;
  }
  get observedChange(): number | null {
    return this.points.length > 1
      ? this.points[this.points.length - 1].count - this.points[0].count
      : null;
  }
  get forecast(): ExplainedForecast | undefined {
    return this.data?.prediction.forecasts.find((p) => p.topic_id === this.topic);
  }
  get visibleForecast(): ExplainedForecast | undefined {
    const forecast = this.forecast;
    return this.points[this.points.length - 1]?.year === forecast?.observed_through
      ? forecast
      : undefined;
  }
  get explanationOptions(): ExplainedForecast[] {
    return [
      ...(this.data?.prediction.validation_records || []),
      ...(this.data?.prediction.test_records || []),
      ...(this.data?.prediction.forecasts || []),
    ].filter((p) => p.topic_id === this.topic);
  }
  featureLabel(feature: string): string {
    const labels: Record<string, string> = {
      log1p_lag_1: 'Conteo de hace 1 año',
      log1p_lag_2: 'Conteo de hace 2 años',
      log1p_lag_3: 'Conteo de hace 3 años',
      log1p_mean_previous_3: 'Promedio de los 3 años previos',
    };
    return labels[feature] || feature;
  }
  get explained(): ExplainedForecast | undefined {
    return this.explanationOptions.find((p) => p.year === Number(this.explanationYear));
  }
  get selectedTerms(): string {
    return this.data?.topics.find((t) => t.topic_id === this.topic)?.terms.join(', ') || '';
  }
  x(year: number): number {
    const start = this.points[0]?.year || year;
    const end = this.visibleForecast?.year || this.points[this.points.length - 1]?.year || year;
    return 40 + ((year - start) * 700) / Math.max(1, end - start);
  }
  y(value: number): number {
    const maximum = Math.max(
      1,
      ...this.points.map((p) => p.count),
      this.visibleForecast?.prediction || 0,
    );
    return 240 - (value * 200) / maximum;
  }
  get observedLine(): string {
    return this.points.map((p) => `${this.x(p.year)},${this.y(p.count)}`).join(' ');
  }
  get forecastLine(): string {
    return this.projectionLine(this.visibleForecast?.prediction);
  }
  get referenceLine(): string {
    return this.projectionLine(this.visibleForecast?.baseline_last_value);
  }
  private projectionLine(value?: number): string {
    const last = this.points[this.points.length - 1];
    const f = this.visibleForecast;
    return last && f && value !== undefined
      ? `${this.x(last.year)},${this.y(last.count)} ${this.x(f.year)},${this.y(value)}`
      : '';
  }
  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this.requests.complete();
  }
}
