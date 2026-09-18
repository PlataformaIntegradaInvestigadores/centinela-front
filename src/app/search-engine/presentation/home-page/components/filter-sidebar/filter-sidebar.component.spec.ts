import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSidebarComponent } from './filter-sidebar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FilterSidebarComponent', () => {
  let component: FilterSidebarComponent;
  let fixture: ComponentFixture<FilterSidebarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FilterSidebarComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(FilterSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds a checked year and emits the updated selection', () => {
    const emitted: number[][] = [];
    component.yearsSelected.subscribe((years) => emitted.push(years));
    component.onYearChange(2020, true);
    expect(component.selectedYears).toEqual([2020]);
    expect(emitted).toEqual([[2020]]);
  });

  it('removes an unchecked year from the selection', () => {
    component.selectedYears = [2020, 2021];
    component.onYearChange(2020, false);
    expect(component.selectedYears).toEqual([2021]);
  });

  it('unchecking a year not in the selection is a no-op', () => {
    component.selectedYears = [2021];
    component.onYearChange(2020, false);
    expect(component.selectedYears).toEqual([2021]);
  });

  it('yearSelected updates the years input', () => {
    component.yearSelected([2019, 2020]);
    expect(component.years).toEqual([2019, 2020]);
  });
});
