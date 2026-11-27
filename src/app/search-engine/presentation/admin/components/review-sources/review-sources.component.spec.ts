import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReviewSourcesComponent } from './review-sources.component';
import { ReviewPanelComponent } from '../review-panel/review-panel.component';
import { ArticleService } from 'src/app/search-engine/domain/services/article.service';
import { Article } from 'src/app/shared/interfaces/article.interface';

describe('ReviewSourcesComponent', () => {
  let fixture: ComponentFixture<ReviewSourcesComponent>;
  let component: ReviewSourcesComponent;
  let articles: jasmine.SpyObj<ArticleService>;

  beforeEach(() => {
    articles = jasmine.createSpyObj('ArticleService', ['getArticleById']);
    TestBed.configureTestingModule({
      declarations: [ReviewSourcesComponent, ReviewPanelComponent],
      providers: [{ provide: ArticleService, useValue: articles }],
    });
    fixture = TestBed.createComponent(ReviewSourcesComponent);
    component = fixture.componentInstance;
  });

  it('shows the corpus text of each source and flags missing ones', () => {
    articles.getArticleById.and.callFake((id: string) =>
      id === 'SYN-A01'
        ? of({ title: 'Datos abiertos', abstract: 'El 35 % reutilizó datos.' } as Article)
        : throwError(() => new Error('404')),
    );
    component.articleIds = ['SYN-A01', 'SYN-X99'];
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.sources).toEqual([
      {
        articleId: 'SYN-A01',
        title: 'Datos abiertos',
        abstract: 'El 35 % reutilizó datos.',
        missing: false,
      },
      { articleId: 'SYN-X99', title: null, abstract: null, missing: true },
    ]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('El 35 % reutilizó datos.');
    expect(text).toContain('No está en el corpus');
  });

  it('shows a record without title or abstract as such', () => {
    articles.getArticleById.and.returnValue(of({ title: '', abstract: '' } as Article));
    component.articleIds = ['SYN-A05'];
    component.ngOnChanges();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sin título');
    expect(text).toContain('El registro no tiene resumen.');
  });

  it('warns when the case keeps no source at all', () => {
    component.articleIds = [];
    component.ngOnChanges();
    fixture.detectChanges();
    expect(articles.getArticleById).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('no conserva ninguna fuente');
  });

  it('cancels pending requests on destroy', () => {
    articles.getArticleById.and.returnValue(of({ title: 't', abstract: 'a' } as Article));
    component.articleIds = ['SYN-A01'];
    component.ngOnChanges();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
