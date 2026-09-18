import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ArticleComponent } from './article.component';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';

describe('ArticleComponent', () => {
  let component: ArticleComponent;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function build(paramId: string | null) {
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getArticles']);
    authorServiceSpy.getArticles.and.returnValue(
      of(Array.from({ length: 25 }, (_, i) => ({ id: `a-${i}` }) as any)),
    );
    userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['getUser']);
    userDataServiceSpy.getUser.and.returnValue(of(null));
    routerSpy = jasmine.createSpyObj('Router', ['serializeUrl', 'createUrlTree']);
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('/home/article/sc-1');

    TestBed.configureTestingModule({
      declarations: [ArticleComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorService, useValue: authorServiceSpy },
        { provide: UserDataService, useValue: userDataServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: of(convertToParamMap({ id: paramId ?? '' })) } },
        },
      ],
    });
    component = TestBed.createComponent(ArticleComponent).componentInstance;
  }

  it('should create', () => {
    build(null);
    expect(component).toBeTruthy();
  });

  it('fetches articles directly for a numeric route id', () => {
    build('42');
    component.ngOnInit();
    expect(component.idRoute).toBe('42');
    expect(authorServiceSpy.getArticles).toHaveBeenCalledWith('42');
    expect(component.articles.length).toBe(25);
    expect(component.pagedArticles.length).toBe(10);
  });

  it('falls back to the logged-in user scopus_id for a non-numeric route id', () => {
    build('about-me');
    userDataServiceSpy.getUser.and.returnValue(of({ scopus_id: '99' } as any));
    component.ngOnInit();
    expect(component.idRoute).toBe('99');
  });

  describe('pagination', () => {
    beforeEach(() => {
      build('42');
      component.ngOnInit();
    });

    it('totalPages accounts for pageSize and is never below 1', () => {
      expect(component.totalPages).toBe(3); // ceil(25/10)
      component.articles = [];
      component.pagedArticles = [];
      expect(component.totalPages).toBe(1);
    });

    it('nextPage advances and stops at the last page', () => {
      component.nextPage();
      expect(component.pageIndex).toBe(1);
      component.nextPage();
      expect(component.pageIndex).toBe(2);
      component.nextPage();
      expect(component.pageIndex).toBe(2); // clamped
    });

    it('prevPage retreats and stops at 0', () => {
      component.nextPage();
      component.prevPage();
      expect(component.pageIndex).toBe(0);
      component.prevPage();
      expect(component.pageIndex).toBe(0);
    });
  });

  it('seeMoreInformation opens a new tab with the serialized article url', () => {
    build('42');
    spyOn(window, 'open');
    component.seeMoreInformation('sc-1');
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['home/article', 'sc-1']);
    expect(window.open).toHaveBeenCalledWith('/home/article/sc-1', '_blank');
  });
});
