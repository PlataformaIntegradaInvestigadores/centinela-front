import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { CorpusPageComponent } from './corpus-page.component';
import { CorpusService } from '../../domain/services/corpus.service';
import { ArticleDetail, ArticlePage, CorpusSummary } from '../../domain/entities/corpus';

describe('CorpusPageComponent: synthetic responses only', () => {
  let fixture: ComponentFixture<CorpusPageComponent>;
  let component: CorpusPageComponent;
  let service: jasmine.SpyObj<CorpusService>;
  const summary: CorpusSummary = {
    status: 'ready_for_development',
    training: 'pending',
    diagnostics: {
      articles: 41,
      missing_abstracts: 1,
      coverage: 'unverified_snapshot',
      date_precision: 'unverified',
      articles_by_year: { '2025': 21, '2024': 20 },
    },
  };
  const page: ArticlePage = {
    status: 'ok',
    total: 41,
    offset: 0,
    limit: 20,
    items: [
      {
        article_id: 'synthetic',
        title: '<img src=x> Synthetic',
        publication_date: '2024-01-01',
        has_abstract: true,
        author_count: 2,
        descriptor_count: 3,
      },
    ],
  };
  const detail: ArticleDetail = {
    article_id: 'synthetic',
    authors: ['x'],
    descriptors: ['example'],
    document: {
      title: 'Synthetic title',
      abstract: null,
      publication_date: '2024-01-01',
      keywords: [],
      language: null,
      full_text: null,
      available_on: null,
    },
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('CorpusService', [
      'summary',
      'articles',
      'descriptors',
      'article',
    ]);
    service.summary.and.returnValue(of(summary));
    service.articles.and.returnValue(of(page));
    service.descriptors.and.returnValue(
      of({
        status: 'ok',
        total: 1,
        offset: 0,
        limit: 10,
        items: [{ descriptor: 'example', articles: 3 }],
      }),
    );
    service.article.and.returnValue(of(detail));
    await TestBed.configureTestingModule({
      declarations: [CorpusPageComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [{ provide: CorpusService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(CorpusPageComponent);
    component = fixture.componentInstance;
  });

  it('renders actual response values, semantic labels and safe document text', () => {
    expect(component.years).toEqual([]);
    component.move(1);
    fixture.detectChanges();
    expect(component.state).toBe('ready');
    expect(component.years).toEqual(['2024', '2025']);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('producción científica');
    expect(element.querySelector('form')?.getAttribute('aria-label')).toBe('Filtrar artículos');
    expect(element.querySelectorAll('img').length).toBe(0);
    expect(element.textContent).toContain('<img src=x> Synthetic');
    expect(element.textContent).toContain('En proceso');
    expect(element.textContent).toContain('no son temas inferidos');
    component.select('synthetic');
    fixture.detectChanges();
    expect(component.detailState).toBe('ready');
    expect(element.textContent).toContain('Resumen no disponible.');
    component.closeDetail();
    fixture.detectChanges();
    expect(component.detailState).toBe('idle');
  });

  it('applies and resets filters and bounds pagination', () => {
    fixture.detectChanges();
    component.move(-1);
    expect(component.query.offset).toBe(0);
    component.move(1);
    expect(component.query.offset).toBe(20);
    component.move(1);
    expect(component.query.offset).toBe(40);
    component.move(1);
    expect(component.query.offset).toBe(40);
    component.move(-1);
    expect(component.query.offset).toBe(20);
    component.year = '2024';
    component.abstract = 'missing';
    component.author = ' x ';
    component.descriptor = ' alpha ';
    component.applyFilters();
    expect(component.query).toEqual({
      limit: 20,
      offset: 0,
      year: 2024,
      has_abstract: false,
      author: 'x',
      descriptor: 'alpha',
    });
    component.abstract = 'present';
    component.applyFilters();
    expect(component.query.has_abstract).toBeTrue();
    component.year = '';
    component.abstract = 'all';
    component.author = '';
    component.descriptor = '';
    component.applyFilters();
    expect(component.query).toEqual({ limit: 20, offset: 0 });
  });

  it('shows empty results and empty descriptors without inventing data', () => {
    service.articles.and.returnValue(of({ ...page, total: 0, items: [] }));
    service.descriptors.and.returnValue(
      of({ status: 'empty', total: 0, limit: 10, offset: 0, items: [] }),
    );
    fixture.detectChanges();
    expect(component.state).toBe('empty');
    expect(fixture.nativeElement.textContent).toContain('No hay artículos');
    expect(fixture.nativeElement.textContent).toContain('No hay descriptores');
  });

  it('clears stale rows on failure and can retry', () => {
    fixture.detectChanges();
    service.articles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.reload();
    fixture.detectChanges();
    expect(component.state).toBe('error');
    expect(component.page).toBeNull();
    expect(component.error).toContain('instantánea configurada');
    service.articles.and.returnValue(of(page));
    component.reload();
    expect(component.state).toBe('ready');
    expect(component.message(new HttpErrorResponse({ status: 401 }))).toContain('sesión');
    expect(component.message(new HttpErrorResponse({ status: 403 }))).toContain('sesión');
    expect(component.message(new HttpErrorResponse({ status: 0 }))).toContain('conexión');
  });

  it('cancels previous queries, prevents loading pagination and stops on destroy', () => {
    const old = new Subject<ArticlePage>();
    service.articles.and.returnValue(old);
    fixture.detectChanges();
    expect(component.state).toBe('loading');
    component.move(1);
    expect(component.query.offset).toBe(0);
    service.articles.and.returnValue(of(page));
    component.applyFilters();
    old.next({ ...page, total: 999 });
    old.complete();
    expect(component.page?.total).toBe(41);
    fixture.destroy();
    const calls = service.articles.calls.count();
    component.reload();
    expect(service.articles.calls.count()).toBe(calls);
  });

  it('cancels stale detail and handles absence, content and errors', () => {
    fixture.detectChanges();
    const old = new Subject<ArticleDetail>();
    service.article.and.returnValue(old);
    component.select('old');
    expect(component.detailState).toBe('loading');
    service.article.and.returnValue(
      of({
        ...detail,
        article_id: 'new',
        document: { ...detail.document, abstract: 'Available synthetic abstract' },
      }),
    );
    component.select('new');
    old.next(detail);
    old.complete();
    fixture.detectChanges();
    expect(component.detail?.article_id).toBe('new');
    expect(fixture.nativeElement.textContent).toContain('Available synthetic abstract');
    service.article.and.returnValue(throwError(() => new Error('test failure')));
    component.select('missing');
    fixture.detectChanges();
    expect(component.detailState).toBe('error');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    component.closeDetail();
    expect(component.detailError).toBe('');
  });
});
