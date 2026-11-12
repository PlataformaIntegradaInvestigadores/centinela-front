import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { PreparationPageComponent } from './preparation-page.component';
import { PreparationService } from '../../domain/services/preparation.service';
import { QualityReport, WorksetSummary } from '../../domain/entities/preparation';

describe('PreparationPageComponent: synthetic development contracts', () => {
  let fixture: ComponentFixture<PreparationPageComponent>;
  let component: PreparationPageComponent;
  let service: jasmine.SpyObj<PreparationService>;
  const quality: QualityReport = {
    quality_id: 'synthetic-quality',
    source_version: 'synthetic-source',
    articles: 4,
    missing_abstracts: 1,
    abstract_token_buckets: { '0': 1, '1_49': 1, '50_199': 2, '200_plus': 0 },
    duplicate_text_groups: 1,
    duplicate_text_excess: 1,
    language: { unknown: 4, declared: 0, detection: 'not_executed' },
    dates: {
      day_one: 2,
      january_one: 2,
      articles_by_year: { '2024': 4 },
      precision: 'unverified',
      coverage: 'unverified_snapshot',
    },
  };
  const workset: WorksetSummary = {
    workset_id: 'a'.repeat(64),
    preparation_version: 'synthetic-preparation',
    source_version: 'synthetic-source',
    source_sha256: { 'synthetic.csv': 'synthetic-sha' },
    configuration: {
      missing_abstract: 'exclude',
      duplicates: 'exclude_later',
      min_tokens: 5,
      start_year: 2020,
      end_year: 2025,
    },
    counts: {
      included: 1,
      excluded: 3,
      exclusion_reasons: { missing_abstract: 1, duplicate_text: 1, insufficient_tokens: 1 },
    },
    duplicate_groups: 1,
    purpose: 'development',
    training: 'pending',
    temporal_precision: 'unverified',
  };
  beforeEach(async () => {
    service = jasmine.createSpyObj('PreparationService', [
      'quality',
      'preview',
      'create',
      'workset',
    ]);
    service.quality.and.returnValue(of(quality));
    service.preview.and.returnValue(of(workset));
    service.create.and.returnValue(of({ ...workset, reused: false }));
    service.workset.and.returnValue(of(workset));
    await TestBed.configureTestingModule({
      declarations: [PreparationPageComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [{ provide: PreparationService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(PreparationPageComponent);
    component = fixture.componentInstance;
  });

  it('renders diagnostics and requires preview before immutable creation', () => {
    fixture.detectChanges();
    expect(component.qualityState).toBe('ready');
    expect(fixture.nativeElement.textContent).toContain('No se ha ejecutado detección de idioma');
    component.create();
    expect(service.create).not.toHaveBeenCalled();
    component.preview();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Previsualización sin guardado');
    component.create();
    fixture.detectChanges();
    expect(component.state).toBe('saved');
    expect(service.create).toHaveBeenCalledWith(workset.configuration, workset.workset_id);
    expect(fixture.nativeElement.textContent).toContain('Se creó una versión nueva');
    component.changed();
    expect(component.result).toBeNull();
    component.create();
    expect(service.create.calls.count()).toBe(1);
  });

  it('validates selections and lookup identifiers before calling the API', () => {
    fixture.detectChanges();
    component.configuration.start_year = 2026;
    component.preview();
    expect(service.preview).not.toHaveBeenCalled();
    expect(component.state).toBe('error');
    component.configuration = { ...workset.configuration, min_tokens: 0 };
    expect(component.valid).toBeFalse();
    component.configuration.min_tokens = 1.5;
    expect(component.valid).toBeFalse();
    for (const invalid of [
      { min_tokens: 10001 },
      { start_year: 0 },
      { start_year: 2020.5 },
      { end_year: 10000 },
      { end_year: 2025.5 },
    ]) {
      component.configuration = { ...workset.configuration, ...invalid };
      expect(component.valid).toBeFalse();
    }
    component.identifier = '../unsafe';
    component.load();
    expect(service.workset).not.toHaveBeenCalled();
    component.identifier = ' ' + workset.workset_id + ' ';
    component.load();
    expect(component.state).toBe('saved');
    expect(component.configuration).toEqual(workset.configuration);
  });

  it('shows errors, clears stale results and retries quality and preview', () => {
    service.quality.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    fixture.detectChanges();
    expect(component.qualityState).toBe('error');
    service.quality.and.returnValue(of(quality));
    component.reloadQuality();
    expect(component.qualityState).toBe('ready');
    component.preview();
    service.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.create();
    fixture.detectChanges();
    expect(component.result).toBeNull();
    expect(component.state).toBe('error');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    component.preview();
    expect(component.state).toBe('preview');
    for (const status of [401, 403])
      expect(component.message(new HttpErrorResponse({ status }))).toContain('sesión');
    expect(component.message(new HttpErrorResponse({ status: 404 }))).toContain('no existe');
    expect(component.message(new HttpErrorResponse({ status: 422 }))).toContain('integridad');
    expect(
      component.message(
        new HttpErrorResponse({ status: 422, error: { detail: { code: 'preparation_changed' } } }),
      ),
    ).toContain('Previsualiza');
    expect(component.message(new HttpErrorResponse({ status: 0 }))).toContain('conexión');
  });

  it('locks duplicate submissions while loading and unsubscribes on destroy', async () => {
    const pending = new Subject<WorksetSummary>();
    service.preview.and.returnValue(pending);
    fixture.detectChanges();
    component.preview();
    component.preview();
    component.load();
    component.create();
    expect(service.preview.calls.count()).toBe(1);
    expect(service.workset).not.toHaveBeenCalled();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="start_year"]').disabled).toBeTrue();
    fixture.destroy();
    pending.next(workset);
    pending.complete();
    expect(component.result).toBeNull();
  });

  it('describes empty selections and reused immutable versions', () => {
    service.preview.and.returnValue(
      of({
        ...workset,
        counts: { included: 0, excluded: 4, exclusion_reasons: { missing_abstract: 4 } },
      }),
    );
    fixture.detectChanges();
    component.preview();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no contiene documentos aptos');
    component.create();
    expect(service.create).not.toHaveBeenCalled();
    service.preview.and.returnValue(of(workset));
    service.create.and.returnValue(of({ ...workset, reused: true }));
    component.preview();
    component.create();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('sin sobrescribirla');
  });
});
