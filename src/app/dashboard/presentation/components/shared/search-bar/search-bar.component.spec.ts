import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SearchBarComponent } from './search-bar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { SuggestionService } from '../../../../domain/services/suggestion.service';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let suggestionService: jasmine.SpyObj<SuggestionService>;

  beforeEach(() => {
    suggestionService = jasmine.createSpyObj('SuggestionService', [
      'searchAffiliations',
      'searchTopics',
    ]);
    suggestionService.searchAffiliations.and.returnValue(
      of([{ scopus_id: 1, name: 'Aff A', total_articles: 1 }]),
    );
    suggestionService.searchTopics.and.returnValue(of([{ name: 'Topic A', total_articles: 1 }]));

    TestBed.configureTestingModule({
      declarations: [SearchBarComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: SuggestionService, useValue: suggestionService }],
    });
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    component.code = 'affiliation';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit with affiliation sets up debouncer', () => {
    fixture.detectChanges();
    expect(component.searchTerms).toBeDefined();
  });

  it('loads affiliation suggestions after debounce', fakeAsync(() => {
    fixture.detectChanges();
    component.onSearchChange('aff');
    tick(1000);
    expect(suggestionService.searchAffiliations).toHaveBeenCalledWith('aff');
    expect(component.affiliations.length).toBe(1);
    expect(component.showSuggestions).toBeTrue();
  }));

  it('ngOnInit with topic sets up debouncer', fakeAsync(() => {
    component.code = 'topic';
    fixture.detectChanges();
    component.onSearchChange('top');
    tick(1000);
    expect(suggestionService.searchTopics).toHaveBeenCalledWith('top');
    expect(component.topics.length).toBe(1);
    expect(component.showSuggestions).toBeTrue();
  }));

  it('onSearchChange pushes to searchTerms', () => {
    fixture.detectChanges();
    component.onSearchChange('q');
    expect(component.searchTerms.observers.length).toBeGreaterThan(0);
  });

  it('onFocus shows suggestions', () => {
    component.onFocus();
    expect(component.showSuggestions).toBeTrue();
  });

  it('onBlur hides suggestions after delay', fakeAsync(() => {
    component.showSuggestions = true;
    component.onBlur();
    tick(200);
    expect(component.showSuggestions).toBeFalse();
  }));

  it('emitEntity resets arrays and emits entity', () => {
    let emitted = '';
    component.entity.subscribe((e) => (emitted = e));
    component.affiliations = [{ scopus_id: 1, name: 'A', total_articles: 1 }] as any;
    component.topics = [{ name: 'T', total_articles: 1 }] as any;
    component.provinces = [{ x: 1 }] as any;
    component.emitEntity('ent-1');
    expect(emitted).toBe('ent-1');
    expect(component.affiliations.length).toBe(0);
    expect(component.topics.length).toBe(0);
    expect(component.provinces.length).toBe(0);
  });

  it('selectSuggestion affiliation emits scopus id', () => {
    let emitted = '';
    component.name.subscribe(() => {});
    component.entity.subscribe((e) => (emitted = e));
    const entity = { scopus_id: 42, name: 'Aff', total_articles: 1 } as any;
    component.selectSuggestion(entity);
    expect(component.searchQuery).toBe('Aff');
    expect(component.showSuggestions).toBeFalse();
    expect(emitted).toBe('42');
  });

  it('selectSuggestion topic emits name', () => {
    component.code = 'topic';
    let emitted = '';
    component.entity.subscribe((e) => (emitted = e));
    const entity = { name: 'Topic', total_articles: 1 } as any;
    component.selectSuggestion(entity);
    expect(component.searchQuery).toBe('Topic');
    expect(emitted).toBe('Topic');
  });

  it('selectSuggestion province does nothing', () => {
    component.code = 'province';
    let emitted = '';
    component.entity.subscribe((e) => (emitted = e));
    const entity = { name: 'P', total_articles: 1 } as any;
    component.selectSuggestion(entity);
    expect(emitted).toBe('');
  });

  it('emits name output via name emitter', () => {
    let emitted = '';
    component.name.subscribe((n) => (emitted = n));
    component.name.emit('some-name');
    expect(emitted).toBe('some-name');
  });
});
