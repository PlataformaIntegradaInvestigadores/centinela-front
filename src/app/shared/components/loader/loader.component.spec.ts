import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let component: LoaderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(LoaderComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults rows to 5', () => {
    expect(component.rows).toBe(5);
    expect(component.getRowsArray().length).toBe(5);
  });

  it('getRowsArray reflects a custom rows input', () => {
    component.rows = 2;
    expect(component.getRowsArray().length).toBe(2);
  });
});
