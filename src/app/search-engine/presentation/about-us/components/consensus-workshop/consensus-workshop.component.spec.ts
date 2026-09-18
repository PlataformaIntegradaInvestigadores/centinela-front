import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConsensusWorkshopComponent } from './consensus-workshop.component';

describe('ConsensusWorkshopComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsensusWorkshopComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ConsensusWorkshopComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
