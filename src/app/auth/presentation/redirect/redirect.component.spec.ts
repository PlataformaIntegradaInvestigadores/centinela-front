import { TestBed } from '@angular/core/testing';
import { RedirectComponent } from './redirect.component';

describe('RedirectComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RedirectComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RedirectComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
