import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NetworkComponent } from './network.component';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';

describe('NetworkComponent', () => {
  let component: NetworkComponent;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;

  function build(paramId: string | null) {
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getAuthorById']);
    authorServiceSpy.getAuthorById.and.returnValue(of({ id: 1 } as any));
    userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['getUser']);
    userDataServiceSpy.getUser.and.returnValue(of(null));

    TestBed.configureTestingModule({
      declarations: [NetworkComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorService, useValue: authorServiceSpy },
        { provide: UserDataService, useValue: userDataServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { paramMap: of(convertToParamMap({ id: paramId ?? '' })) },
          },
        },
      ],
    });
    component = TestBed.createComponent(NetworkComponent).componentInstance;
  }

  it('should create', () => {
    build(null);
    expect(component).toBeTruthy();
  });

  it('uses a numeric route id directly when present', () => {
    build('42');
    component.ngOnInit();
    expect(component.scopusId).toBe(42);
    expect(authorServiceSpy.getAuthorById).toHaveBeenCalledWith('42');
  });

  it('falls back to the logged-in user scopus_id when the route id is not numeric', () => {
    build('about-me');
    userDataServiceSpy.getUser.and.returnValue(of({ scopus_id: '99' } as any));
    component.ngOnInit();
    expect(component.scopusId).toBe(99);
    expect(authorServiceSpy.getAuthorById).toHaveBeenCalledWith('99');
  });

  it('does not fetch an author when the fallback user has no scopus_id', () => {
    build('about-me');
    userDataServiceSpy.getUser.and.returnValue(of({} as any));
    component.ngOnInit();
    expect(authorServiceSpy.getAuthorById).not.toHaveBeenCalled();
  });

  describe('isNumeric', () => {
    it('accepts digit-only strings', () => {
      build(null);
      expect(component.isNumeric('123')).toBeTrue();
    });

    it('rejects non-digit strings', () => {
      build(null);
      expect(component.isNumeric('abc')).toBeFalse();
      expect(component.isNumeric('12a')).toBeFalse();
    });
  });

  describe('getAuthor', () => {
    it('sets loading then author on success', () => {
      build(null);
      component.scopusId = 5;
      component.getAuthor();
      expect(component.author).toEqual({ id: 1 } as any);
      expect(component.loading).toBeFalse();
    });

    it('logs and stops loading on error', () => {
      build(null);
      spyOn(console, 'error');
      authorServiceSpy.getAuthorById.and.returnValue(throwError(() => new Error('boom')));
      component.scopusId = 5;
      component.getAuthor();
      expect(component.loading).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('does nothing when scopusId is falsy', () => {
      build(null);
      component.scopusId = 0 as any;
      component.getAuthor();
      expect(authorServiceSpy.getAuthorById).not.toHaveBeenCalled();
    });
  });
});
