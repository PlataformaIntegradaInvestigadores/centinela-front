import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { ModelsPageComponent } from './models-page.component';
import { ModelPage, ModelSummary, ModelsService } from '../../domain/services/models.service';

const model: ModelSummary = {
  model_id: 'a'.repeat(64),
  workset_id: 'b'.repeat(64),
  method: 'tfidf-nmf',
  purpose: 'technical',
  evaluation_status: 'not_research_validated',
  fit_document_count: 4,
  configuration: { topics: 2 },
  versions: { 'scikit-learn': 'controlled-version' },
  cutoff: null,
  temporal_status: 'not_temporal_validation',
};
const page: ModelPage = { status: 'ok', total: 21, offset: 0, limit: 20, items: [model] };

describe('Model registry presentation', () => {
  let fixture: ComponentFixture<ModelsPageComponent>;
  let service: jasmine.SpyObj<ModelsService>;
  beforeEach(async () => {
    service = jasmine.createSpyObj('ModelsService', ['list', 'detail']);
    service.list.and.returnValue(of(page));
    service.detail.and.returnValue(of(model));
    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule],
      declarations: [ModelsPageComponent],
      providers: [{ provide: ModelsService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(ModelsPageComponent);
  });
  afterEach(() => fixture.destroy());
  it('shows metadata, warnings and closes detail', () => {
    fixture.detectChanges();
    fixture.componentInstance.select(model.model_id);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Evaluación científica final: pendiente');
    expect(fixture.nativeElement.textContent).toContain('controlled-version');
    expect(fixture.nativeElement.textContent).toContain('Sin corte temporal validado');
    fixture.componentInstance.select(null);
    expect(fixture.componentInstance.detail).toBeNull();
    service.detail.and.returnValue(of({ ...model, cutoff: '2020-01-01' }));
    fixture.componentInstance.select(model.model_id);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2020-01-01');
  });
  it('paginates within bounds', () => {
    fixture.componentInstance.move(1);
    expect(service.list).not.toHaveBeenCalled();
    fixture.detectChanges();
    fixture.componentInstance.move(-1);
    expect(service.list).toHaveBeenCalledTimes(1);
    fixture.componentInstance.move(1);
    expect(service.list).toHaveBeenCalledWith(20);
    fixture.componentInstance.move(1);
    expect(service.list).toHaveBeenCalledTimes(2);
    fixture.componentInstance.move(-1);
    expect(fixture.componentInstance.offset).toBe(0);
  });
  it('shows empty registry', () => {
    service.list.and.returnValue(of({ ...page, items: [], total: 0, status: 'empty' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay modelos registrados');
  });
  for (const status of [0, 404, 409, 503]) {
    it(`handles ${status} in list and detail, then recovers`, () => {
      service.list.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      fixture.detectChanges();
      expect(fixture.componentInstance.state).toBe('error');
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
      service.list.and.returnValue(of(page));
      fixture.componentInstance.reload();
      service.detail.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      fixture.componentInstance.select(model.model_id);
      expect(fixture.componentInstance.detailState).toBe('error');
      expect(fixture.componentInstance.detail).toBeNull();
      service.detail.and.returnValue(of(model));
      fixture.componentInstance.select(model.model_id);
      expect(fixture.componentInstance.detailState).toBe('ready');
    });
  }
  it('cancels obsolete selection when changing pages and on destruction', () => {
    const pending = new Subject<ModelSummary>();
    service.detail.and.returnValue(pending);
    fixture.detectChanges();
    fixture.componentInstance.select('old');
    expect(pending.observed).toBeTrue();
    fixture.componentInstance.reload();
    expect(pending.observed).toBeFalse();
    fixture.componentInstance.select('new');
    fixture.destroy();
    expect(pending.observed).toBeFalse();
  });
  it('renders loading state while HTTP is pending', () => {
    service.list.and.returnValue(new Subject<ModelPage>());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Consultando modelos');
  });
});

describe('Model registry HTTP service', () => {
  let service: ModelsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ModelsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses relative paginated list and encoded ID', () => {
    service.list().subscribe();
    const request = http.expectOne((r) => r.url === '/api/analytics/models');
    expect(request.request.params.get('offset')).toBe('0');
    expect(request.request.params.get('limit')).toBe('20');
    request.flush(page);
    service.detail('a/b').subscribe();
    http.expectOne('/api/analytics/models/a%2Fb').flush(model);
  });
});
