import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FingerprintComponent } from './fingerprint.component';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';

describe('FingerprintComponent', () => {
  let component: FingerprintComponent;
  let authorServiceSpy: jasmine.SpyObj<AuthorService>;
  let userDataServiceSpy: jasmine.SpyObj<UserDataService>;

  function build(paramId: string | null) {
    authorServiceSpy = jasmine.createSpyObj('AuthorService', ['getTopicsById']);
    authorServiceSpy.getTopicsById.and.returnValue(of([{ name: 'AI', value: 3 }] as any));
    userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['getUser']);
    userDataServiceSpy.getUser.and.returnValue(of(null));

    TestBed.configureTestingModule({
      declarations: [FingerprintComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorService, useValue: authorServiceSpy },
        { provide: UserDataService, useValue: userDataServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: of(convertToParamMap({ id: paramId ?? '' })) } },
        },
      ],
    });
    component = TestBed.createComponent(FingerprintComponent).componentInstance;
  }

  it('should create', () => {
    build(null);
    expect(component).toBeTruthy();
  });

  it('uses a numeric route id directly', () => {
    build('42');
    component.ngOnInit();
    expect(component.scopusId).toBe(42);
    expect(authorServiceSpy.getTopicsById).toHaveBeenCalledWith(42);
  });

  it('falls back to the logged-in user scopus_id when the route id is not numeric', () => {
    build('about-me');
    userDataServiceSpy.getUser.and.returnValue(of({ scopus_id: '99' } as any));
    component.ngOnInit();
    expect(component.scopusId).toBe(99);
  });

  describe('getTopics', () => {
    it('returns early when scopusId is unset', () => {
      build(null);
      component.getTopics();
      expect(authorServiceSpy.getTopicsById).not.toHaveBeenCalled();
    });

    it('populates words on success, defaulting to [] for a falsy response', () => {
      build(null);
      authorServiceSpy.getTopicsById.and.returnValue(of(null as any));
      component.scopusId = 5;
      component.getTopics();
      expect(component.words).toEqual([]);
      expect(component.loading).toBeFalse();
    });

    it('clears words and stops loading on error', () => {
      build(null);
      authorServiceSpy.getTopicsById.and.returnValue(throwError(() => new Error('boom')));
      component.scopusId = 5;
      component.getTopics();
      expect(component.words).toEqual([]);
      expect(component.loading).toBeFalse();
    });
  });
});
