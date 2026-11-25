// Technical contract fixtures only, not participant or research results.
import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LineagePageComponent } from './lineage-page.component';
import { LineageService } from '../../domain/services/lineage.service';

describe('LineagePageComponent', () => {
  for (const [status, state] of [[401, 'unauthenticated'], [403, 'forbidden'], [404, 'empty'], [503, 'error']] as const) {
    it(`distinguishes HTTP ${status} without showing stale data`, () => {
      TestBed.configureTestingModule({imports: [CommonModule, RouterTestingModule], declarations: [LineagePageComponent],
        providers: [{provide: LineageService, useValue: {current: () => throwError(() => new HttpErrorResponse({status}))}}]});
      const fixture = TestBed.createComponent(LineagePageComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.state).toBe(state);
      expect(fixture.componentInstance.data).toBeNull();
      fixture.destroy();
    });
  }
  it('renders versioned counts and keeps the local-storage limit visible', () => {
    TestBed.configureTestingModule({imports: [CommonModule, RouterTestingModule], declarations: [LineagePageComponent],
      providers: [{provide: LineageService, useValue: {current: () => of({release_id: 'technical-version',
        published_at: '2026-01-01T00:00:00Z', distributed_lakehouse_verified: false,
        lineage: {dataset: 'unit-fixture', study_run_id: 'unit-study', review_run_id: 'unit-review',
          source_sha256: {'unit.csv': 'hash'}, signed_plan_sha256: 'unit-plan'},
        tables: {silver_documents: {layer: 'silver', rows: 2}}, blobs: {}})}}]});
    const fixture = TestBed.createComponent(LineagePageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.state).toBe('ready');
    expect(fixture.nativeElement.textContent).toContain('technical-version');
    expect(fixture.nativeElement.textContent).toContain('infraestructura institucional');
    expect(fixture.nativeElement.textContent).toContain('Preparados');
    fixture.destroy();
  });
});
