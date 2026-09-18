import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { SearchBoxComponent } from './search-box.component';

describe('SearchBoxComponent', () => {
  let component: SearchBoxComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchBoxComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(SearchBoxComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults the selected option to the first search option (Author)', () => {
    expect(component.selectedOption.code).toBe('au');
  });

  it('changeStateDropdown toggles folded', () => {
    expect(component.folded).toBeTrue();
    component.changeStateDropdown();
    expect(component.folded).toBeFalse();
  });

  describe('ngOnChanges', () => {
    it('applies a matching setSearch option and query, and emits a search', () => {
      let emitted: any = null;
      component.search.subscribe((s: any) => (emitted = s));
      component.setSearch = { option: 'mrar', query: 'machine learning' };
      component.ngOnChanges({ setSearch: new SimpleChange(null, component.setSearch, true) });

      expect(component.selectedOption.code).toBe('mrar');
      expect(component.inputValue).toBe('machine learning');
      expect(emitted).toEqual({ option: 'mrar', query: 'machine learning' });
    });

    it('falls back to the second option when the code is unknown', () => {
      component.setSearch = { option: 'unknown', query: 'x' };
      component.ngOnChanges({ setSearch: new SimpleChange(null, component.setSearch, true) });
      expect(component.selectedOption.code).toBe('mrau');
    });

    it('does nothing when setSearch has no currentValue', () => {
      const before = component.selectedOption;
      component.ngOnChanges({});
      expect(component.selectedOption).toBe(before);
    });
  });

  describe('triggerSearch', () => {
    it('shows an error and does not emit for empty/whitespace input', () => {
      component.inputValue = '   ';
      let emitted = false;
      component.search.subscribe(() => (emitted = true));
      component.triggerSearch();
      expect(component.showError).toBeTrue();
      expect(emitted).toBeFalse();
    });

    it('shows an error for input with no significant alphabetic token', () => {
      component.inputValue = '1 2 !!';
      component.triggerSearch();
      expect(component.showError).toBeTrue();
    });

    it('normalizes whitespace and emits a valid search', () => {
      let emitted: any = null;
      component.search.subscribe((s: any) => (emitted = s));
      component.inputValue = '  machine   learning  ';
      component.triggerSearch();
      expect(component.showError).toBeFalse();
      expect(emitted).toEqual({ option: component.selectedOption.code, query: 'machine learning' });
    });
  });

  describe('onEnter', () => {
    it('triggers a search on Enter', () => {
      spyOn(component, 'triggerSearch');
      component.onEnter({ code: 'Enter' } as KeyboardEvent);
      expect(component.triggerSearch).toHaveBeenCalled();
    });

    it('does nothing for other keys', () => {
      spyOn(component, 'triggerSearch');
      component.onEnter({ code: 'Escape' } as KeyboardEvent);
      expect(component.triggerSearch).not.toHaveBeenCalled();
    });
  });

  describe('onClick', () => {
    it('folds the dropdown when clicking outside the dropdown container/button', () => {
      component.folded = false;
      const event = { target: document.createElement('div') } as unknown as MouseEvent;
      component.onClick(event);
      expect(component.folded).toBeTrue();
    });

    it('keeps the dropdown open when clicking inside the dropdown container', () => {
      component.folded = false;
      const container = document.createElement('div');
      container.className = 'dropdown-container';
      const inner = document.createElement('span');
      container.appendChild(inner);
      const event = { target: inner } as unknown as MouseEvent;
      component.onClick(event);
      expect(component.folded).toBeFalse();
    });
  });

  it('setOption updates selectedOption', () => {
    component.setOption(component.searchOptions[2]);
    expect(component.selectedOption.code).toBe('mrar');
  });
});
