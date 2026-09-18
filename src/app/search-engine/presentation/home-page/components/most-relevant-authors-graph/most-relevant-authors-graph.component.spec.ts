import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { of, throwError } from 'rxjs';
import * as d3 from 'd3';
import { MostRelevantAuthorsGraphComponent } from './most-relevant-authors-graph.component';
import { AuthorService } from '../../../../domain/services/author.service';
import { AuthorNode, Coauthors } from '../../../../../shared/interfaces/author.interface';

describe('MostRelevantAuthorsGraphComponent', () => {
  let component: MostRelevantAuthorsGraphComponent;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;

  const makeNode = (over: Partial<AuthorNode> = {}): AuthorNode =>
    ({ scopus_id: '1', initials: 'AB', first_name: 'Ana', last_name: 'Bar', ...over }) as AuthorNode;

  const coauthors: Coauthors = {
    nodes: [makeNode({ scopus_id: '1' }), makeNode({ scopus_id: '2', first_name: 'Bob' })],
    links: [{ source: '1', target: '2', collabStrength: 2 } as any],
    affiliations: [
      { scopus_id: 'a1', name: 'Universidad Andina' },
      { scopus_id: 'a2', name: 'EPN' },
    ],
  };

  beforeEach(() => {
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getMostRelevantAuthors']);
    authorServiceSpy.getMostRelevantAuthors.and.returnValue(of(coauthors));

    TestBed.configureTestingModule({
      declarations: [MostRelevantAuthorsGraphComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorService, useValue: authorServiceSpy },
        { provide: DOCUMENT, useValue: document },
      ],
    });
    component = TestBed.createComponent(MostRelevantAuthorsGraphComponent).componentInstance;
    component.query = 'ai';
    // downloadEl (@ViewChild) never resolves without a rendered template; exportRegion()
    // dereferences it with no null-guard (unlike getSvgAndZoom's `if (!this.downloadEl)`),
    // so a real DOM stub whose querySelector reports "no graph svg" avoids a spurious
    // TypeError while still exercising the real "nothing to export yet" code path.
    const dlEl = document.createElement('div');
    dlEl.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    (component as any).downloadEl = { nativeElement: dlEl };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / refreshGraph', () => {
    it('loads the graph and sets up nodes/links on success', () => {
      let loadingEvents: boolean[] = [];
      component.loading.subscribe((v) => loadingEvents.push(v));
      component.ngOnInit();
      expect(component.showGraph).toBeTrue();
      expect(component.noResults).toBeFalse();
      expect(component.d3Nodes.length).toBe(2);
      expect(component.affiliations.length).toBe(2);
      expect(component.isFirstLoad).toBeFalse();
      expect(loadingEvents).toEqual([true, false]);
    });

    it('flags noResults when there are zero nodes', () => {
      authorServiceSpy.getMostRelevantAuthors.and.returnValue(
        of({ ...coauthors, nodes: [], links: [] } as Coauthors),
      );
      component.ngOnInit();
      expect(component.noResults).toBeTrue();
    });

    it('handles a load failure gracefully', () => {
      spyOn(console, 'error');
      authorServiceSpy.getMostRelevantAuthors.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(component.noResults).toBeTrue();
      expect(component.showGraph).toBeTrue();
      expect(component.d3Nodes).toEqual([]);
      expect(component.d3Links).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('resets filter state and reloads on a non-first query change', () => {
      component.selectedAffiliations = ['a1'];
      component.affiliationSearch = 'x';
      component.ngOnChanges({
        query: { currentValue: 'new', previousValue: 'ai', firstChange: false, isFirstChange: () => false },
      } as any);
      expect(component.selectedAffiliations).toEqual([]);
      expect(component.affiliationSearch).toBe('');
      expect(authorServiceSpy.getMostRelevantAuthors).toHaveBeenCalled();
    });

    it('resets authorsNumber to 50 when it was 0', () => {
      component.authorsNumber = 0;
      component.ngOnChanges({
        query: { currentValue: 'new', previousValue: 'ai', firstChange: false, isFirstChange: () => false },
      } as any);
      expect(component.authorsNumber).toBe(50);
    });

    it('does nothing on the first change', () => {
      component.ngOnChanges({
        query: { currentValue: 'ai', previousValue: undefined, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(authorServiceSpy.getMostRelevantAuthors).not.toHaveBeenCalled();
    });
  });

  describe('onAuthorsNumberChange / setAuthorsNumber', () => {
    it('marks filtering and refreshes the graph', () => {
      component.onAuthorsNumberChange();
      expect(component.isFiltering).toBeFalse(); // refreshGraph resolves synchronously via of()
      expect(authorServiceSpy.getMostRelevantAuthors).toHaveBeenCalled();
    });

    it('setAuthorsNumber updates the count and refreshes', () => {
      component.setAuthorsNumber(25);
      expect(component.authorsNumber).toBe(25);
      expect(authorServiceSpy.getMostRelevantAuthors).toHaveBeenCalled();
    });
  });

  describe('onClickCheckbox / sortAffiliations / filteredAffiliations', () => {
    beforeEach(() => component.ngOnInit());

    it('adds a checked affiliation and re-filters', () => {
      const event = { target: { id: 'a1', checked: true } };
      component.onClickCheckbox(event);
      expect(component.selectedAffiliations).toContain('a1');
      expect(component.affiliations[0].scopus_id).toBe('a1');
    });

    it('removes an unchecked affiliation', () => {
      component.selectedAffiliations = ['a1'];
      const event = { target: { id: 'a1', checked: false } };
      component.onClickCheckbox(event);
      expect(component.selectedAffiliations).not.toContain('a1');
    });

    it('does not duplicate an affiliation that is already selected', () => {
      component.selectedAffiliations = ['a1'];
      const event = { target: { id: 'a1', checked: true } };
      component.onClickCheckbox(event);
      expect(component.selectedAffiliations).toEqual(['a1']);
    });

    it('filteredAffiliations returns all when the search term is blank', () => {
      component.affiliationSearch = '';
      expect(component.filteredAffiliations.length).toBe(2);
    });

    it('filteredAffiliations filters case/accent-insensitively', () => {
      component.affiliationSearch = 'andina';
      expect(component.filteredAffiliations.map((a) => a.scopus_id)).toEqual(['a1']);
    });

    it('filteredAffiliations returns [] when affiliations is not set', () => {
      component.affiliations = undefined as any;
      expect(component.filteredAffiliations).toEqual([]);
    });

    it('sortAffiliations orders selected items first, then falls back to name comparison', () => {
      component.affiliations = [
        { scopus_id: 'a1', name: 'Zeta' },
        { scopus_id: 'a2', name: 'Alpha' },
        { scopus_id: 'a3', name: 'Beta' },
      ];
      component.selectedAffiliations = ['a3'];
      component.sortAffiliations();
      expect(component.affiliations[0].scopus_id).toBe('a3'); // selected bubbles to top
      // the two unselected items fall back to locale-aware name comparison
      const unselected = component.affiliations.slice(1).map((a) => a.scopus_id);
      expect(unselected).toEqual(['a2', 'a1']); // Alpha before Zeta
    });

    it('sortAffiliations is a no-op when affiliations is unset', () => {
      component.affiliations = undefined as any;
      expect(() => component.sortAffiliations()).not.toThrow();
    });
  });

  describe('onClickAffiliationsFilter', () => {
    beforeEach(() => component.ngOnInit());

    it('queries with the filter type and selected affiliations when some are selected', () => {
      component.selectedAffiliations = ['a1'];
      component.onClickAffiliationsFilter('include');
      expect(authorServiceSpy.getMostRelevantAuthors).toHaveBeenCalledWith(
        'ai',
        component.authorsNumber,
        'include',
        ['a1'],
      );
      expect(component.showGraph).toBeTrue();
    });

    it('handles a failure on the filtered-with-selection path', () => {
      spyOn(console, 'error');
      component.selectedAffiliations = ['a1'];
      authorServiceSpy.getMostRelevantAuthors.and.returnValue(throwError(() => new Error('boom')));
      component.onClickAffiliationsFilter('include');
      expect(component.noResults).toBeTrue();
    });

    it('falls back to an unfiltered query when nothing is selected', () => {
      component.selectedAffiliations = [];
      component.onClickAffiliationsFilter('include');
      expect(authorServiceSpy.getMostRelevantAuthors).toHaveBeenCalledWith('ai', component.authorsNumber);
      expect(component.showGraph).toBeTrue();
    });

    it('handles a failure on the unfiltered fallback path', () => {
      spyOn(console, 'error');
      component.selectedAffiliations = [];
      authorServiceSpy.getMostRelevantAuthors.and.returnValue(throwError(() => new Error('boom')));
      component.onClickAffiliationsFilter('include');
      expect(component.noResults).toBeTrue();
    });

    it('flags noResults on the unfiltered fallback path when zero nodes come back', () => {
      component.selectedAffiliations = [];
      authorServiceSpy.getMostRelevantAuthors.and.returnValue(
        of({ ...coauthors, nodes: [], links: [] } as Coauthors),
      );
      component.onClickAffiliationsFilter('include');
      expect(component.noResults).toBeTrue();
    });
  });

  describe('truncateString', () => {
    it('truncates at whichever separator (space or dash) comes first when both exist', () => {
      expect(component.truncateString('Ana-Maria Perez')).toBe('Ana');
      expect(component.truncateString('Jean Paul-Marc')).toBe('Jean');
    });

    it('truncates at a space when no dash exists', () => {
      expect(component.truncateString('Ana Maria Perez')).toBe('Ana');
    });

    it('truncates at a dash when no space exists', () => {
      expect(component.truncateString('Jean-Paul-Marc')).toBe('Jean');
    });

    it('returns the text unchanged with neither separator', () => {
      expect(component.truncateString('Ana')).toBe('Ana');
    });
  });

  describe('getD3Nodes / getD3Links / getIndexByScopusId', () => {
    beforeEach(() => component.ngOnInit());

    it('builds nodes with popover metadata', () => {
      expect(component.d3Nodes.length).toBe(2);
      expect(component.d3Nodes[0].popover.link).toBe('profile/1');
    });

    it('builds links and increments node degree', () => {
      expect(component.d3Links.length).toBe(1);
      expect(component.d3Nodes[0].degree).toBe(1);
      expect(component.d3Nodes[1].degree).toBe(1);
    });

    it('getIndexByScopusId finds a matching node index', () => {
      expect(component.getIndexByScopusId('2')).toBe(1);
      expect(component.getIndexByScopusId('missing')).toBe(-1);
    });
  });

  describe('downloadDataUrl', () => {
    it('creates a temporary link, clicks it, and removes it', () => {
      const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
      const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();
      component.downloadDataUrl('data:image/png;base64,x', 'graph.png');
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('region selection', () => {
    it('toggleRegionSelect flips state and clears region data', () => {
      component.regionStart = { x: 1, y: 1 };
      component.regionRect = { x: 1, y: 1, w: 5, h: 5 };
      component.toggleRegionSelect();
      expect(component.selectingRegion).toBeTrue();
      expect(component.regionStart).toBeNull();
      expect(component.regionRect).toBeNull();
    });

    it('onRegionMouseDown starts a zero-size rect at the click point', () => {
      const el = { getBoundingClientRect: () => ({ left: 10, top: 20 }) };
      component.onRegionMouseDown({ currentTarget: el, clientX: 30, clientY: 50 } as any);
      expect(component.regionStart).toEqual({ x: 20, y: 30 });
      expect(component.regionRect).toEqual({ x: 20, y: 30, w: 0, h: 0 });
    });

    it('onRegionMouseMove grows the rect from the start point', () => {
      const el = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
      component.onRegionMouseDown({ currentTarget: el, clientX: 10, clientY: 10 } as any);
      component.onRegionMouseMove({ currentTarget: el, clientX: 40, clientY: 60 } as any);
      expect(component.regionRect).toEqual({ x: 10, y: 10, w: 30, h: 50 });
    });

    it('onRegionMouseMove does nothing without a start point', () => {
      component.regionStart = null;
      const el = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
      component.onRegionMouseMove({ currentTarget: el, clientX: 40, clientY: 60 } as any);
      expect(component.regionRect).toBeNull();
    });

    it('onRegionMouseUp clears state without exporting a too-small region', () => {
      component.regionRect = { x: 0, y: 0, w: 2, h: 2 };
      component.selectingRegion = true;
      component.onRegionMouseUp();
      expect(component.selectingRegion).toBeTrue();
      expect(component.regionStart).toBeNull();
      expect(component.regionRect).toBeNull();
    });

    it('onRegionMouseUp exits selection mode for a large-enough region (export is a no-op without a graph svg)', () => {
      component.regionRect = { x: 0, y: 0, w: 20, h: 20 };
      component.selectingRegion = true;
      component.onRegionMouseUp();
      expect(component.selectingRegion).toBeFalse();
    });
  });

  describe('zoom controls without a bound graph element', () => {
    it('zoomIn/zoomOut/resetZoom/fitAll are safe no-ops when there is no graph SVG', () => {
      expect(() => component.zoomIn()).not.toThrow();
      expect(() => component.zoomOut()).not.toThrow();
      expect(() => component.resetZoom()).not.toThrow();
      expect(() => component.fitAll()).not.toThrow();
    });

    it('are also safe no-ops when downloadEl itself is unset', () => {
      (component as any).downloadEl = undefined;
      expect(() => component.zoomIn()).not.toThrow();
      expect(() => component.zoomOut()).not.toThrow();
      expect(() => component.resetZoom()).not.toThrow();
    });
  });

  describe('zoom controls with a bound graph SVG', () => {
    it('call the d3 zoom behaviour when a graph svg with __zoomBehavior is present', () => {
      const graphEl = document.createElement('graph');
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as any;
      svgEl.setAttribute('width', '800');
      svgEl.setAttribute('height', '600');
      svgEl.__zoomBehavior = d3.zoom();
      graphEl.appendChild(svgEl);
      const dlEl = document.createElement('div');
      dlEl.appendChild(graphEl);
      (component as any).downloadEl = { nativeElement: dlEl };

      expect(() => component.zoomIn()).not.toThrow();
      expect(() => component.zoomOut()).not.toThrow();
      expect(() => component.resetZoom()).not.toThrow();
    });
  });

  describe('setupGraph setTimeout', () => {
    it('schedules a resetZoom when the graph has nodes', fakeAsync(() => {
      component.ngOnInit();
      tick(200);
      expect(() => component.resetZoom()).not.toThrow();
    }));
  });

});
