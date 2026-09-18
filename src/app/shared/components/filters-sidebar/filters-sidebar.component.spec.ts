import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FiltersSidebarComponent } from './filters-sidebar.component';

describe('FiltersSidebarComponent', () => {
  let fixture: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FiltersSidebarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(FiltersSidebarComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults all inputs', () => {
    const c = fixture.componentInstance;
    expect(c.title).toBe('FILTERS');
    expect(c.isFirstLoad).toBeFalse();
    expect(c.isLoading).toBeFalse();
    expect(c.isDisabled).toBeFalse();
  });
});
