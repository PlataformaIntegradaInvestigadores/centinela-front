import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { EMPTY, Observable, Subject, Subscription, defer, of, timer } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  faCircleExclamation,
  faMagnifyingGlass,
  faPeopleGroup,
  faPlugCircleXmark,
  faSpinner,
  faUserPlus,
  faUsersViewfinder,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import {
  AuthorSearchResult,
  RecommendResponse,
  RecommenderError,
} from '../../../domain/entities/team-recommendation.interface';
import { TeamRecommenderService } from '../../../domain/services/team-recommender.service';

export const SEARCH_DEBOUNCE_MS = 300;
/** Espera tras un cambio del equipo o de los parámetros antes de volver a consultar. */
export const RECOMMEND_DEBOUNCE_MS = 400;
export const MIN_SEARCH_CHARS = 2;
/** Equipo semilla: más integrantes diluyen el centroide semántico del equipo. */
export const MAX_TEAM_SIZE = 5;
/** Formato de búsqueda sugerido, sin nombres reales de investigadores. */
export const SEARCH_PLACEHOLDER = 'Ej: Apellido Nombre';
export const TOP_K_OPTIONS = [5, 10, 20] as const;

/** Resultado del autocompletado: null = consulta demasiado corta (no se busca). */
type SearchOutcome = { results: AuthorSearchResult[]; error: boolean } | null;

/**
 * "Conformar equipo": el usuario arma un equipo base (a-priori) buscando autores del corpus
 * y recibe candidatos de ethical-recommender-service (centroide + K-NN y re-ranking R1).
 *
 * Los candidatos se reconsultan solos (debounce RECOMMEND_DEBOUNCE_MS) cada vez que cambia el
 * equipo base, el Top-K o el re-ranking; switchMap cancela la consulta en vuelo y un equipo
 * vacío limpia la lista sin llamar al backend.
 *
 * Se usa como página propia (/home/team-builder) y embebido (embedded=true) en el módulo de
 * grupos del perfil (/profile/:id/my-groups).
 */
@Component({
  selector: 'app-team-builder-page',
  templateUrl: './team-builder-page.component.html',
  styleUrls: ['./team-builder-page.component.css'],
})
export class TeamBuilderPageComponent implements OnInit, OnDestroy {
  /** Embebido en otra pantalla: sin título de pestaña ni encabezado de página propio. */
  @Input() embedded = false;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly topKOptions = TOP_K_OPTIONS;
  readonly maxTeamSize = MAX_TEAM_SIZE;
  readonly searchPlaceholder = SEARCH_PLACEHOLDER;
  readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  readonly faMagnifyingGlass = faMagnifyingGlass;
  readonly faXmark = faXmark;
  readonly faUserPlus = faUserPlus;
  readonly faPeopleGroup = faPeopleGroup;
  readonly faWandMagicSparkles = faWandMagicSparkles;
  readonly faSpinner = faSpinner;
  readonly faCircleExclamation = faCircleExclamation;
  readonly faPlugCircleXmark = faPlugCircleXmark;
  readonly faUsersViewfinder = faUsersViewfinder;

  suggestions: AuthorSearchResult[] = [];
  searching = false;
  searchFailed = false;
  showSuggestions = false;
  activeSuggestion = 0;

  team: AuthorSearchResult[] = [];
  topK: number = 10;
  fairnessEnabled = true;

  loading = false;
  error: RecommenderError | null = null;
  response: RecommendResponse | null = null;
  elapsedMs: number | null = null;
  /** Valor del toggle con el que se calculó la respuesta mostrada. */
  appliedFairness = true;
  lastQuery = '';

  private searchSubscription?: Subscription;
  private recommendSubscription?: Subscription;
  /** Cada emisión es la espera (ms) antes de consultar; 0 = consulta inmediata. */
  private readonly refresh$ = new Subject<number>();

  constructor(
    private recommender: TeamRecommenderService,
    private title: Title,
  ) {}

  ngOnInit(): void {
    if (!this.embedded) {
      this.title.setTitle('Conformar equipo');
    }
    this.recommendSubscription = this.refresh$
      .pipe(
        switchMap((wait) => {
          if (this.team.length === 0) {
            return EMPTY;
          }
          return wait > 0
            ? timer(wait).pipe(switchMap(() => this.fetchRecommendations()))
            : this.fetchRecommendations();
        }),
      )
      .subscribe();
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((query) => {
          this.lastQuery = query;
          this.searching = query.length >= MIN_SEARCH_CHARS;
        }),
        switchMap((query) => this.search(query)),
      )
      .subscribe((outcome) => this.applySearch(outcome));
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.recommendSubscription?.unsubscribe();
  }

  get canRecommend(): boolean {
    return this.team.length > 0 && !this.loading;
  }

  get teamIsFull(): boolean {
    return this.team.length >= MAX_TEAM_SIZE;
  }

  get hasResults(): boolean {
    return this.response !== null && this.response.recommendations.length > 0;
  }

  /** Nombres del equipo de la última respuesta (nombre completo si se conoce, si no el de Scopus). */
  get responseTeamLabel(): string {
    return (this.response?.team ?? [])
      .map((m) => this.fullNameOf(m.author_id) || m.name || m.author_id)
      .join(', ');
  }

  /** Nombre a mostrar: completo («Apellido, Nombre»), si no el de Scopus, si no el ID. */
  displayName(author: AuthorSearchResult): string {
    return author.full_name?.trim() || author.name?.trim() || `Autor ${author.author_id}`;
  }

  /** Nombre Scopus como dato secundario, solo cuando difiere del nombre mostrado. */
  scopusName(author: AuthorSearchResult): string | null {
    const scopus = author.name?.trim();
    return scopus && scopus !== this.displayName(author) ? scopus : null;
  }

  isInTeam(author: AuthorSearchResult): boolean {
    return this.team.some((member) => member.author_id === author.author_id);
  }

  isUnknown(author: AuthorSearchResult): boolean {
    return this.error?.unknownIds.includes(author.author_id) ?? false;
  }

  addMember(author: AuthorSearchResult): void {
    if (this.isInTeam(author) || this.teamIsFull) {
      return;
    }
    this.team = [...this.team, author];
    this.scheduleRefresh();
    this.searchControl.setValue('');
    this.closeSuggestions();
  }

  removeMember(author: AuthorSearchResult): void {
    this.team = this.team.filter((member) => member.author_id !== author.author_id);
    if (this.error?.kind === 'unknown_ids') {
      this.error = null;
    }
    this.scheduleRefresh();
  }

  clearTeam(): void {
    this.team = [];
    this.scheduleRefresh();
  }

  setTopK(value: number): void {
    if (this.topK !== value) {
      this.topK = value;
      this.scheduleRefresh();
    }
  }

  toggleFairness(): void {
    this.fairnessEnabled = !this.fairnessEnabled;
    this.scheduleRefresh();
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSuggestions();
      return;
    }
    if (!this.showSuggestions || this.suggestions.length === 0) {
      return;
    }
    const last = this.suggestions.length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestion = Math.min(this.activeSuggestion + 1, last);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestion = Math.max(this.activeSuggestion - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.addMember(this.suggestions[this.activeSuggestion]);
    }
  }

  openSuggestions(): void {
    this.showSuggestions = this.suggestions.length > 0;
  }

  closeSuggestions(): void {
    this.showSuggestions = false;
    this.activeSuggestion = 0;
  }

  /** Consulta inmediata (botón): reintento tras un error o refresco manual. */
  recommend(): void {
    if (!this.canRecommend) {
      return;
    }
    this.closeSuggestions();
    this.refresh$.next(0);
  }

  trackByAuthorId(_: number, author: { author_id: string }): string {
    return author.author_id;
  }

  private search(query: string): Observable<SearchOutcome> {
    if (query.length < MIN_SEARCH_CHARS) {
      return of(null);
    }
    return this.recommender.searchAuthors(query).pipe(
      map((results) => ({ results, error: false })),
      catchError(() => of({ results: [], error: true })),
    );
  }

  private applySearch(outcome: SearchOutcome): void {
    this.searching = false;
    this.activeSuggestion = 0;
    if (outcome === null) {
      this.suggestions = [];
      this.searchFailed = false;
      this.showSuggestions = false;
      return;
    }
    this.suggestions = outcome.results;
    this.searchFailed = outcome.error;
    this.showSuggestions = true;
  }

  private fullNameOf(authorId: string): string | null {
    return this.team.find((member) => member.author_id === authorId)?.full_name?.trim() || null;
  }

  /**
   * Reprograma la consulta de candidatos tras un cambio. Con el equipo vacío limpia el
   * resultado al instante y la emisión cancela cualquier consulta pendiente o en vuelo.
   */
  private scheduleRefresh(): void {
    if (this.team.length === 0) {
      this.response = null;
      this.error = null;
      this.elapsedMs = null;
      this.loading = false;
    }
    this.refresh$.next(RECOMMEND_DEBOUNCE_MS);
  }

  private fetchRecommendations(): Observable<RecommendResponse> {
    return defer(() => {
      this.loading = true;
      this.error = null;
      const fairness = this.fairnessEnabled;
      const started = performance.now();
      return this.recommender
        .recommend({
          author_ids: this.team.map((member) => member.author_id),
          top_k: this.topK,
          fairness: { enabled: fairness },
        })
        .pipe(
          tap((response) => {
            this.response = response;
            this.appliedFairness = fairness;
            this.elapsedMs = performance.now() - started;
          }),
          catchError((err) => {
            this.error = this.recommender.toRecommenderError(err);
            this.response = null;
            this.elapsedMs = null;
            return EMPTY;
          }),
          finalize(() => (this.loading = false)),
        );
    });
  }
}
