import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ArticlePageComponent } from './article-page.component';
import { ArticleService } from 'src/app/search-engine/domain/services/article.service';

describe('ArticlePageComponent', () => {
  let component: ArticlePageComponent;
  let articleServiceSpy: jasmine.SpyObj<ArticleService>;
  let titleSpy: jasmine.SpyObj<Title>;
  let locationSpy: jasmine.SpyObj<Location>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    articleServiceSpy = jasmine.createSpyObj('ArticleService', ['getArticleById']);
    articleServiceSpy.getArticleById.and.returnValue(of({ title: 'Paper' } as any));
    titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    spyOn(window, 'scrollTo');
    spyOn(window, 'open');

    TestBed.configureTestingModule({
      declarations: [ArticlePageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ scopusId: 'sc-1' }) } },
        { provide: ArticleService, useValue: articleServiceSpy },
        { provide: Title, useValue: titleSpy },
        { provide: Location, useValue: locationSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(ArticlePageComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('scrolls to top, reads the route param, and loads the article', () => {
      component.ngOnInit();
      expect(window.scrollTo).toHaveBeenCalled();
      expect(component.scopusId).toBe('sc-1');
      expect(component.article).toEqual({ title: 'Paper' } as any);
      expect(titleSpy.setTitle).toHaveBeenCalledWith('Paper');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('retrieveArticle error handling', () => {
    it('shows a not-found message on a 404', () => {
      articleServiceSpy.getArticleById.and.returnValue(
        throwError(() => ({ status: 404 })),
      );
      spyOn(console, 'error');
      component.retrieveArticle();
      expect(component.article).toBeUndefined();
      expect(component.loadError).toBe('The requested article could not be found.');
      expect(component.isLoading).toBeFalse();
    });

    it('shows a generic message on any other error', () => {
      articleServiceSpy.getArticleById.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      spyOn(console, 'error');
      component.retrieveArticle();
      expect(component.loadError).toBe('Article details are temporarily unavailable.');
    });
  });

  it('setArticleTitle falls back to an empty title when there is no article', () => {
    component.article = undefined;
    component.setArticleTitle();
    expect(titleSpy.setTitle).toHaveBeenCalledWith('');
  });

  it('goToArticle opens the Scopus record in a new tab', () => {
    component.goToArticle('12345');
    expect(window.open).toHaveBeenCalledWith(
      'https://www.scopus.com/record/display.uri?eid=2-s2.0-12345&origin=resultslist',
      '_blank',
    );
  });

  it('goToAuthor navigates to the author profile', () => {
    component.goToAuthor('sc-9');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile', 'sc-9']);
  });

  it('backToResults navigates back in browser history', () => {
    component.backToResults();
    expect(locationSpy.back).toHaveBeenCalled();
  });
});
