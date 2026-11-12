import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject, of, throwError } from 'rxjs';

import {
  MAX_TEAM_SIZE,
  RECOMMEND_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  SEARCH_PLACEHOLDER,
  TeamBuilderPageComponent,
} from './team-builder-page.component';
import { InstitutionNamePipe } from '../../pipes/institution-name.pipe';
import { TeamRecommenderService } from '../../../domain/services/team-recommender.service';
import {
  AuthorSearchResult,
  RecommendResponse,
  RecommenderError,
} from '../../../domain/entities/team-recommendation.interface';

const author = (id: string, name: string | null = `Autor ${id}`): AuthorSearchResult => ({
  author_id: id,
  name,
  institution: 'escuela politécnica nacional',
  low_visibility: false,
  article_count: 5,
});

const response = (overrides: Partial<RecommendResponse> = {}): RecommendResponse => ({
  model: 'sentence-transformers/all-MiniLM-L6-v2',
  team: [
    { author_id: '1', name: 'Piedrahita P.', institution: 'espol', low_visibility: false },
    { author_id: '2', name: null, institution: 'UNKNOWN', low_visibility: false },
  ],
  recommendations: [
    {
      author_id: '9',
      name: 'Astudillo-Sánchez E.',
      institution: 'universidad espíritu santo',
      low_visibility: true,
      rank: 1,
      baseline_rank: 26,
      relevance_score: 0.6,
      relevance_norm: 0.5,
      institution_novelty: 1,
      final_score: 0.5,
      selection_reason: 'quota',
    },
  ],
  fairness_metrics: { gini_simpson: 0.9 },
  diagnostics: { quota_picks: 1 },
  parameters: {},
  ...overrides,
});

describe('TeamBuilderPageComponent', () => {
  let fixture: ComponentFixture<TeamBuilderPageComponent>;
  let component: TeamBuilderPageComponent;
  let service: jasmine.SpyObj<TeamRecommenderService>;
  let title: jasmine.SpyObj<Title>;

  const el = () => fixture.nativeElement as HTMLElement;
  const key = (k: string) => new KeyboardEvent('keydown', { key: k, cancelable: true });
  const typeQuery = (q: string) => {
    component.searchControl.setValue(q);
    tick(SEARCH_DEBOUNCE_MS);
    fixture.detectChanges();
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('TeamRecommenderService', [
      'searchAuthors',
      'recommend',
      'toRecommenderError',
    ]);
    title = jasmine.createSpyObj('Title', ['setTitle']);
    TestBed.configureTestingModule({
      declarations: [TeamBuilderPageComponent, InstitutionNamePipe],
      imports: [ReactiveFormsModule, FontAwesomeModule],
      providers: [
        { provide: TeamRecommenderService, useValue: service },
        { provide: Title, useValue: title },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(TeamBuilderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('sets the page title and shows the initial empty state', () => {
    expect(title.setTitle).toHaveBeenCalledWith('Conformar equipo');
    expect(el().querySelector('.initial-state')?.textContent).toContain(
      'Agrega investigadores al equipo base',
    );
    expect(el().querySelector('.team-empty')).not.toBeNull();
    const button = el().querySelector('.recommend-button') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('Recomendar colaboradores');
  });

  describe('author autocomplete', () => {
    it('debounces, searches and lists suggestions', fakeAsync(() => {
      service.searchAuthors.and.returnValue(of([author('1', 'Piedrahita P.'), author('2')]));
      component.searchControl.setValue('pied');
      tick(SEARCH_DEBOUNCE_MS - 1);
      expect(service.searchAuthors).not.toHaveBeenCalled();
      tick(1);
      fixture.detectChanges();
      expect(service.searchAuthors).toHaveBeenCalledOnceWith('pied');
      expect(component.searching).toBeFalse();
      expect(el().querySelectorAll('.suggestion').length).toBe(2);
      expect(el().querySelector('.suggestion')?.textContent).toContain('Piedrahita P.');
    }));

    it('does not search queries shorter than 2 characters and hides suggestions', fakeAsync(() => {
      service.searchAuthors.and.returnValue(of([author('1')]));
      typeQuery('pi');
      expect(component.showSuggestions).toBeTrue();
      typeQuery(' p ');
      expect(service.searchAuthors).toHaveBeenCalledTimes(1);
      expect(component.suggestions).toEqual([]);
      expect(component.showSuggestions).toBeFalse();
    }));

    it('shows a no-match message and a search error', fakeAsync(() => {
      service.searchAuthors.and.returnValue(of([]));
      typeQuery('zzzz');
      expect(el().querySelector('.suggestion-empty')?.textContent).toContain('zzzz');
      service.searchAuthors.and.returnValue(throwError(() => new Error('down')));
      typeQuery('yyyy');
      expect(component.searchFailed).toBeTrue();
      expect(el().querySelector('.suggestion-error')).not.toBeNull();
    }));

    it('supports keyboard navigation, Enter to add and Escape to close', fakeAsync(() => {
      service.searchAuthors.and.returnValue(of([author('1'), author('2')]));
      typeQuery('autor');
      const down = key('ArrowDown');
      component.onSearchKeydown(down);
      expect(down.defaultPrevented).toBeTrue();
      component.onSearchKeydown(key('ArrowDown'));
      expect(component.activeSuggestion).toBe(1);
      component.onSearchKeydown(key('ArrowUp'));
      component.onSearchKeydown(key('ArrowUp'));
      expect(component.activeSuggestion).toBe(0);
      component.onSearchKeydown(key('Tab'));
      expect(component.showSuggestions).toBeTrue();
      component.onSearchKeydown(key('Enter'));
      expect(component.team.map((m) => m.author_id)).toEqual(['1']);
      expect(component.showSuggestions).toBeFalse();
      tick(SEARCH_DEBOUNCE_MS);

      component.suggestions = [author('3')];
      component.openSuggestions();
      expect(component.showSuggestions).toBeTrue();
      component.onSearchKeydown(key('Escape'));
      expect(component.showSuggestions).toBeFalse();
      component.onSearchKeydown(key('Enter'));
      expect(component.team.length).toBe(1);
      service.recommend.and.returnValue(of(response()));
      tick(RECOMMEND_DEBOUNCE_MS);
    }));

    it('renders full name, institution and Scopus name of each suggestion', fakeAsync(() => {
      service.searchAuthors.and.returnValue(
        of([
          { ...author('37026882700', 'Piedrahita P.'), full_name: 'Piedrahita, Paolo' },
          author('2', null),
        ]),
      );
      typeQuery('pablo piedrahita');
      expect(service.searchAuthors).toHaveBeenCalledOnceWith('pablo piedrahita');
      const [first, second] = Array.from(el().querySelectorAll('.suggestion'));
      expect(first.querySelector('.suggestion-name')?.textContent?.trim()).toBe(
        'Piedrahita, Paolo',
      );
      expect(first.querySelector('.suggestion-institution')?.textContent).toContain(
        'Escuela Politécnica Nacional',
      );
      expect(first.querySelector('.suggestion-scopus')?.textContent).toContain(
        'Scopus: Piedrahita P.',
      );
      expect(first.querySelector('.suggestion-scopus')?.textContent).toContain('37026882700');
      expect(second.querySelector('.suggestion-name')?.textContent?.trim()).toBe('Autor 2');
      expect(second.querySelector('.suggestion-scopus')?.textContent).not.toContain('Scopus:');
    }));

    it('uses a generic placeholder without real researcher names', () => {
      const input = el().querySelector('#author-search') as HTMLInputElement;
      expect(SEARCH_PLACEHOLDER).toBe('Ej: Apellido Nombre');
      expect(input.placeholder).toBe('Ej: Apellido Nombre');
    });

    it('opens suggestions on focus only when there are results', () => {
      component.suggestions = [];
      component.openSuggestions();
      expect(component.showSuggestions).toBeFalse();
    });
  });

  describe('team management', () => {
    it('limits the base team to 5 members and says so in the help text', () => {
      expect(MAX_TEAM_SIZE).toBe(5);
      expect(el().textContent).toContain('agrega hasta 5 integrantes');
      for (let i = 1; i <= 6; i++) {
        component.addMember(author(String(i)));
      }
      fixture.detectChanges();
      expect(component.team.length).toBe(5);
      expect(el().querySelectorAll('.member-chip').length).toBe(5);
      const input = el().querySelector('#author-search') as HTMLInputElement;
      expect(input.disabled).toBeTrue();
      expect(input.placeholder).toBe('Equipo completo');
    });

    it('shows the full name in chips and falls back to the Scopus name or id', () => {
      const paolo = { ...author('1', 'Piedrahita P.'), full_name: 'Piedrahita, Paolo' };
      component.addMember(paolo);
      fixture.detectChanges();
      expect(el().querySelector('.member-chip')?.textContent).toContain('Piedrahita, Paolo');
      expect(component.displayName(paolo)).toBe('Piedrahita, Paolo');
      expect(component.scopusName(paolo)).toBe('Piedrahita P.');
      expect(component.displayName({ ...paolo, full_name: '  ' })).toBe('Piedrahita P.');
      expect(component.scopusName({ ...paolo, full_name: null })).toBeNull();
      expect(component.displayName(author('7', null))).toBe('Autor 7');
    });

    it('adds members once, renders chips and enforces the size limit', () => {
      component.addMember(author('1', 'Piedrahita P.'));
      component.addMember(author('1', 'Piedrahita P.'));
      fixture.detectChanges();
      expect(component.team.length).toBe(1);
      expect(component.isInTeam(author('1'))).toBeTrue();
      expect(el().querySelector('.member-chip')?.textContent).toContain('Piedrahita P.');
      expect(el().querySelector('.member-chip')?.textContent).toContain(
        'Escuela Politécnica Nacional',
      );
      expect(el().querySelector('.initial-state')?.textContent).toContain(
        'Preparando recomendaciones',
      );

      for (let i = 2; i <= MAX_TEAM_SIZE + 2; i++) {
        component.addMember(author(String(i)));
      }
      expect(component.team.length).toBe(MAX_TEAM_SIZE);
      expect(component.teamIsFull).toBeTrue();
    });

    it('removes members and clears the team', () => {
      component.addMember(author('1'));
      component.addMember(author('2'));
      component.removeMember(author('1'));
      expect(component.team.map((m) => m.author_id)).toEqual(['2']);
      component.clearTeam();
      expect(component.team).toEqual([]);
      expect(component.response).toBeNull();
    });
  });

  describe('recommendation', () => {
    beforeEach(() => {
      service.recommend.and.returnValue(of(response()));
      component.addMember(author('1'));
      component.addMember(author('2'));
    });

    it('sends the team, top_k and fairness flag and renders the results', () => {
      component.setTopK(20);
      component.recommend();
      fixture.detectChanges();
      expect(service.recommend).toHaveBeenCalledOnceWith({
        author_ids: ['1', '2'],
        top_k: 20,
        fairness: { enabled: true },
      });
      expect(component.loading).toBeFalse();
      expect(component.hasResults).toBeTrue();
      expect(component.elapsedMs).not.toBeNull();
      expect(component.responseTeamLabel).toBe('Piedrahita P., 2');
      expect(el().querySelector('.team-label')?.textContent).toContain('Piedrahita P., 2');
      component.team = [{ ...author('1'), full_name: 'Piedrahita, Paolo' }];
      expect(component.responseTeamLabel).toBe('Piedrahita, Paolo, 2');
      expect(el().querySelectorAll('app-recommended-candidate-card').length).toBe(1);
      expect(el().querySelector('app-fairness-summary')).not.toBeNull();
      expect(el().querySelector('.initial-state')).toBeNull();
      expect(el().querySelector('.recommend-button')?.textContent).toContain(
        'Actualizar recomendaciones',
      );
    });

    it('shows the skeleton on the first load and cancels a request in flight', () => {
      const first = new Subject<RecommendResponse>();
      const second = new Subject<RecommendResponse>();
      service.recommend.and.returnValues(first, second);
      component.recommend();
      fixture.detectChanges();
      expect(component.loading).toBeTrue();
      expect(component.canRecommend).toBeFalse();
      expect(el().querySelector('.loading-state')).not.toBeNull();
      expect(el().querySelector('.recommend-button')?.textContent).toContain('Calculando');
      component.recommend(); // ignorado mientras carga
      expect(service.recommend).toHaveBeenCalledTimes(1);

      component.loading = false;
      component.recommend();
      expect(first.observed).toBeFalse();
      second.next(response());
      second.complete();
      expect(component.loading).toBeFalse();
    });

    it('keeps the previous results visible while refreshing', () => {
      component.recommend();
      const pending = new Subject<RecommendResponse>();
      service.recommend.and.returnValue(pending);
      component.loading = false;
      component.recommend();
      fixture.detectChanges();
      expect(el().querySelector('.loading-state')).toBeNull();
      expect(el().querySelector('.refreshing')?.textContent).toContain('Actualizando');
      expect(el().querySelector('.results-list.opacity-60')).not.toBeNull();
      pending.complete();
    });

    it('does nothing without team members', () => {
      component.clearTeam();
      component.recommend();
      expect(service.recommend).not.toHaveBeenCalled();
    });

    it('renders an unavailable backend error', () => {
      const error: RecommenderError = {
        kind: 'unavailable',
        message: 'sin conexión',
        unknownIds: [],
      };
      service.recommend.and.returnValue(throwError(() => new HttpErrorResponse({ status: 504 })));
      service.toRecommenderError.and.returnValue(error);
      component.recommend();
      fixture.detectChanges();
      expect(component.error).toBe(error);
      expect(component.response).toBeNull();
      expect(component.loading).toBeFalse();
      expect(el().querySelector('.error-panel')?.textContent).toContain(
        'Servicio de recomendación no disponible',
      );
    });

    it('highlights unknown ids and clears the error when one is removed', () => {
      service.recommend.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      service.toRecommenderError.and.returnValue({
        kind: 'unknown_ids',
        message: 'no están',
        unknownIds: ['2'],
      });
      component.recommend();
      fixture.detectChanges();
      expect(component.isUnknown(author('2'))).toBeTrue();
      expect(component.isUnknown(author('1'))).toBeFalse();
      expect(el().querySelector('.error-panel')?.textContent).toContain(
        'No se pudo generar la recomendación',
      );
      expect(el().querySelector('.member-chip.border-rose-300')).not.toBeNull();
      component.removeMember(author('2'));
      expect(component.error).toBeNull();
    });

    it('keeps a non-id error when removing a member', () => {
      component.error = { kind: 'invalid', message: 'x', unknownIds: [] };
      component.removeMember(author('2'));
      expect(component.error).not.toBeNull();
      expect(component.isUnknown(author('1'))).toBeFalse();
    });

    it('shows the empty-result state', () => {
      service.recommend.and.returnValue(of(response({ recommendations: [] })));
      component.recommend();
      fixture.detectChanges();
      expect(component.hasResults).toBeFalse();
      expect(el().querySelector('.results-empty')).not.toBeNull();
      expect(el().querySelector('app-fairness-summary')).toBeNull();
    });

    it('does not compute anything before the first change settles', () => {
      expect(component.responseTeamLabel).toBe('');
      expect(service.recommend).not.toHaveBeenCalled();
    });
  });

  describe('dynamic refresh', () => {
    beforeEach(() => service.recommend.and.returnValue(of(response())));

    it('re-queries automatically after adding a member (debounced, coalesced)', fakeAsync(() => {
      component.addMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS - 1);
      component.addMember(author('2'));
      tick(RECOMMEND_DEBOUNCE_MS - 1);
      expect(service.recommend).not.toHaveBeenCalled();
      tick(1);
      expect(service.recommend).toHaveBeenCalledOnceWith({
        author_ids: ['1', '2'],
        top_k: 10,
        fairness: { enabled: true },
      });
      fixture.detectChanges();
      expect(el().querySelectorAll('app-recommended-candidate-card').length).toBe(1);
    }));

    it('re-queries automatically after removing a member', fakeAsync(() => {
      component.addMember(author('1'));
      component.addMember(author('2'));
      tick(RECOMMEND_DEBOUNCE_MS);
      component.removeMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(service.recommend).toHaveBeenCalledTimes(2);
      expect(service.recommend.calls.mostRecent().args[0].author_ids).toEqual(['2']);
    }));

    it('re-queries when Top-K or the fairness toggle change', fakeAsync(() => {
      component.addMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS);
      component.setTopK(10); // mismo valor: sin cambios
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(service.recommend).toHaveBeenCalledTimes(1);
      component.setTopK(5);
      component.toggleFairness();
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(service.recommend).toHaveBeenCalledTimes(2);
      expect(service.recommend.calls.mostRecent().args[0]).toEqual({
        author_ids: ['1'],
        top_k: 5,
        fairness: { enabled: false },
      });
      expect(component.appliedFairness).toBeFalse();
    }));

    it('cancels the request in flight when the team changes again', fakeAsync(() => {
      const inFlight = new Subject<RecommendResponse>();
      service.recommend.and.returnValues(inFlight, of(response()));
      component.addMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(component.loading).toBeTrue();
      component.addMember(author('2'));
      expect(inFlight.observed).toBeFalse();
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(service.recommend).toHaveBeenCalledTimes(2);
      expect(component.loading).toBeFalse();
      expect(component.hasResults).toBeTrue();
    }));

    it('clears the list without calling the backend when the team becomes empty', fakeAsync(() => {
      component.addMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(component.response).not.toBeNull();
      const inFlight = new Subject<RecommendResponse>();
      service.recommend.and.returnValue(inFlight);
      component.addMember(author('2'));
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(inFlight.observed).toBeTrue();

      component.clearTeam();
      expect(inFlight.observed).toBeFalse();
      expect(component.response).toBeNull();
      expect(component.error).toBeNull();
      expect(component.loading).toBeFalse();
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(service.recommend).toHaveBeenCalledTimes(2);
      fixture.detectChanges();
      expect(el().querySelector('.initial-state')?.textContent).toContain(
        'Agrega investigadores al equipo base',
      );
    }));

    it('clears the list when the last member is removed', fakeAsync(() => {
      component.addMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS);
      component.removeMember(author('1'));
      tick(RECOMMEND_DEBOUNCE_MS);
      expect(component.response).toBeNull();
      expect(service.recommend).toHaveBeenCalledTimes(1);
    }));
  });

  describe('embedded mode', () => {
    it('skips the page title and header when embedded in another module', () => {
      const embedded = TestBed.createComponent(TeamBuilderPageComponent);
      title.setTitle.calls.reset();
      embedded.componentInstance.embedded = true;
      embedded.detectChanges();
      const root = embedded.nativeElement as HTMLElement;
      expect(title.setTitle).not.toHaveBeenCalled();
      expect(root.querySelector('.page-header')).toBeNull();
      expect(root.querySelector('.team-builder--embedded')).not.toBeNull();
      expect(el().querySelector('.page-header')).not.toBeNull();
      embedded.destroy();
    });
  });

  it('trackByAuthorId returns the id', () => {
    expect(component.trackByAuthorId(0, { author_id: '42' })).toBe('42');
  });
});
