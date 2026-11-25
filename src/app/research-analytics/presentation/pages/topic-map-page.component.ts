import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { TopicDocuments, TopicMap, TopicMapService } from '../../domain/services/topic-map.service';

@Component({
  selector: 'app-topic-map-page',
  templateUrl: './topic-map-page.component.html',
  styleUrls: ['./corpus-page.component.css'],
})
export class TopicMapPageComponent implements OnInit, OnDestroy {
  data: TopicMap | null = null;
  documents: TopicDocuments | null = null;
  start = '';
  end = '';
  threshold = 0.2;
  selected = '';
  offset = 0;
  state = 'loading';
  documentState = '';
  appliedStart = '';
  appliedEnd = '';
  private readonly refresh = new Subject<void>();
  private readonly selection = new Subject<void>();
  private readonly destroyed = new Subject<void>();
  constructor(private readonly service: TopicMapService) {}
  ngOnInit() {
    this.refresh
      .pipe(
        switchMap(() => {
          this.state = 'loading';
          this.data = null;
          this.selected = '';
          this.documents = null;
          this.selection.next();
          this.appliedStart = this.start;
          this.appliedEnd = this.end;
          return this.service.map(this.start, this.end, this.threshold).pipe(
            catchError((e) => {
              this.state = this.error(e);
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroyed),
      )
      .subscribe((data) => {
        this.data = data;
        if (data) this.state = data.denominator ? 'ready' : 'empty';
      });
    this.selection
      .pipe(
        switchMap(() => {
          this.documents = null;
          if (!this.data || !this.selected) return of(null);
          this.documentState = 'loading';
          return this.service
            .documents(this.data, this.selected, this.appliedStart, this.appliedEnd, this.offset)
            .pipe(
              catchError((e) => {
                this.documentState = this.error(e);
                return of(null);
              }),
            );
        }),
        takeUntil(this.destroyed),
      )
      .subscribe((d) => {
        this.documents = d;
        if (d) this.documentState = d.total ? 'ready' : 'empty';
      });
    this.reload();
  }
  reload() {
    this.refresh.next();
  }
  select(topic: string) {
    this.selected = topic;
    this.offset = 0;
    this.selection.next();
  }
  page(delta: number) {
    this.offset = Math.max(0, this.offset + delta);
    this.selection.next();
  }
  coordinate(id: string, axis: 'x' | 'y') {
    const index = this.data?.nodes.findIndex((n) => n.topic_id === id) || 0;
    const angle = (2 * Math.PI * index) / (this.data?.nodes.length || 1);
    return axis === 'x' ? 360 + 230 * Math.cos(angle) : 250 + 180 * Math.sin(angle);
  }
  radius(count: number) {
    return 38 * Math.sqrt(count / Math.max(1, ...(this.data?.nodes.map((n) => n.count) || [])));
  }
  private error(e: HttpErrorResponse) {
    return e.status === 401
      ? 'Sesión requerida'
      : e.status === 403
        ? 'Acceso denegado'
        : e.status === 422
          ? 'Filtros o artefactos inválidos'
          : 'Servicio no disponible';
  }
  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
    this.refresh.complete();
    this.selection.complete();
  }
}
