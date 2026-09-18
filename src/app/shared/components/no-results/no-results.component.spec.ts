import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoResultsComponent } from './no-results.component';

describe('NoResultsComponent', () => {
  let fixture: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NoResultsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(NoResultsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults title and isServerOnline', () => {
    expect(fixture.componentInstance.title).toBe('No results found');
    expect(fixture.componentInstance.isServerOnline).toBeTrue();
  });

  it('accepts custom inputs', () => {
    fixture.componentInstance.title = 'Server down';
    fixture.componentInstance.isServerOnline = false;
    expect(fixture.componentInstance.title).toBe('Server down');
    expect(fixture.componentInstance.isServerOnline).toBeFalse();
  });
});
