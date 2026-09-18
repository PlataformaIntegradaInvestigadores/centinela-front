import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { AuthorRetrieveComponent } from './author-retrieve.component';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';

describe('AuthorRetrieveComponent', () => {
  let component: AuthorRetrieveComponent;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getAuthorsByQuery']);
    authorServiceSpy.getAuthorsByQuery.and.returnValue(of({ data: [], total: 3 } as any));
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/search' });

    TestBed.configureTestingModule({
      declarations: [AuthorRetrieveComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorService, useValue: authorServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(AuthorRetrieveComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit builds the authors$ pipeline and a subscription resolves it', (done) => {
    component.ngOnInit();
    component.authors.subscribe((result) => {
      expect(result.total).toBe(3);
      expect(component.isLoading).toBeFalse();
      expect(component.isFirstLoad).toBeFalse();
      done();
    });
  });

  it('marks the server offline and returns an empty page on a status-0 error', (done) => {
    spyOn(console, 'log');
    authorServiceSpy.getAuthorsByQuery.and.returnValue(throwError(() => ({ status: 0 })));
    component.ngOnInit();
    component.authors.subscribe((result) => {
      expect(component.isServerOnline).toBeFalse();
      expect(result.total).toBe(0);
      done();
    });
  });

  it('does not flag the server offline for a non-connectivity error', (done) => {
    spyOn(console, 'log');
    authorServiceSpy.getAuthorsByQuery.and.returnValue(throwError(() => ({ status: 500 })));
    component.ngOnInit();
    component.authors.subscribe(() => {
      expect(component.isServerOnline).toBeTrue();
      done();
    });
  });

  it('ngOnChanges resets isFirstLoad and re-triggers the table refresh on query changes', () => {
    component.ngOnInit();
    spyOn(component.refreshTable$, 'next');
    component.isFirstLoad = false;
    component.ngOnChanges({ query: { currentValue: 'ai' } as any });
    expect(component.isFirstLoad).toBeTrue();
    expect(component.refreshTable$.next).toHaveBeenCalledWith({ page: 1, size: 10 });
  });

  it('ngOnChanges ignores unrelated input changes', () => {
    component.ngOnInit();
    spyOn(component.refreshTable$, 'next');
    component.ngOnChanges({});
    expect(component.refreshTable$.next).not.toHaveBeenCalled();
  });

  it('onChangePagination updates page/size and triggers the table refresh', () => {
    component.ngOnInit();
    spyOn(component.refreshTable$, 'next');
    const event = { pageIndex: 2, pageSize: 25 } as PageEvent;
    component.onChangePagination(event);
    expect(component.page).toBe(3);
    expect(component.size).toBe(25);
    expect(component.isPaginating).toBeTrue();
    expect(component.refreshTable$.next).toHaveBeenCalledWith({ page: 3, size: 25 });
  });

  it('goToScopus opens the Scopus author profile in a new tab', () => {
    spyOn(window, 'open');
    component.goToScopus('sc-1');
    expect(window.open).toHaveBeenCalledWith(
      'https://www.scopus.com/authid/detail.uri?authorId=sc-1',
      '_blank',
    );
  });

  it('goToAuthor navigates with a returnUrl query param', () => {
    component.goToAuthor('sc-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile', 'sc-1'], {
      queryParams: { returnUrl: '/search' },
    });
  });
});
