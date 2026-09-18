import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContactComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
