import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DashboardLoaderComponent } from './dashboard-loader.component';

describe('DashboardLoaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardLoaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardLoaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
