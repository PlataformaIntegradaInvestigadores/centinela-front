import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TopicMapPageComponent } from './topic-map-page.component';
import { TopicMapService } from '../../domain/services/topic-map.service';

describe('TopicMapPageComponent', () => {
  let service: jasmine.SpyObj<TopicMapService>;
  let page: TopicMapPageComponent;
  const map = {
    release_id: 'release',
    model_id: 'model',
    denominator: 3,
    unassigned: 0,
    nodes: [{ topic_id: 'topic-0', count: 3, share: 1, terms: ['term'] }],
    edges: [],
    coverage: 'snapshot',
    space: 'cosine',
  };
  beforeEach(() => {
    service = jasmine.createSpyObj('TopicMapService', ['map', 'documents']);
    service.map.and.returnValue(of(map));
    service.documents.and.returnValue(of({ total: 25, items: [] }));
    page = new TopicMapPageComponent(service);
    page.ngOnInit();
  });
  afterEach(() => page.ngOnDestroy());
  it('loads real contracts and uses square root radius for proportional areas', () => {
    expect(page.state).toBe('ready');
    expect(page.radius(3)).toBe(38);
    expect(page.radius(0)).toBe(0);
    expect(page.coordinate('topic-0', 'x')).toBe(590);
  });
  it('pins document pagination to applied filters and release', () => {
    page.start = '2020';
    page.reload();
    page.start = '2021';
    page.select('topic-0');
    expect(service.documents).toHaveBeenCalledWith(map, 'topic-0', '2020', '', 0);
    page.page(20);
    expect(page.offset).toBe(20);
    page.page(-20);
    expect(page.offset).toBe(0);
  });
  it('cancels obsolete document requests when filters change', () => {
    const pending = new Subject<{ total: number; items: [] }>();
    service.documents.and.returnValue(pending);
    page.select('topic-0');
    page.reload();
    pending.next({ total: 10, items: [] });
    expect(page.selected).toBe('');
    expect(page.documents).toBeNull();
  });
  it('distinguishes unauthenticated, forbidden and empty responses', () => {
    service.map.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    page.reload();
    expect(page.state).toBe('Sesión requerida');
    service.map.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    page.reload();
    expect(page.state).toBe('Acceso denegado');
    service.map.and.returnValue(of({ ...map, denominator: 0 }));
    page.reload();
    expect(page.state).toBe('empty');
  });
  it('reports document request errors and recovers to an empty page', () => {
    service.documents.and.returnValue(throwError(() => new HttpErrorResponse({ status: 422 })));
    page.select('topic-0');
    expect(page.documentState).toBe('Filtros o artefactos inválidos');
    expect(page.documents).toBeNull();
    service.documents.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    page.select('topic-0');
    expect(page.documentState).toBe('Servicio no disponible');
    service.documents.and.returnValue(of({ total: 0, items: [] }));
    page.select('topic-0');
    expect(page.documentState).toBe('empty');
    page.select('');
    expect(page.documents).toBeNull();
  });
});
