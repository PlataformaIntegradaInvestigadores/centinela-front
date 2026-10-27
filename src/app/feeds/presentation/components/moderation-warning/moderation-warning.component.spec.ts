import { TestBed } from '@angular/core/testing';
import { ModerationWarningComponent } from './moderation-warning.component';

describe('ModerationWarningComponent', () => {
  it('shows the warning and emits reveal on click', () => {
    TestBed.configureTestingModule({ declarations: [ModerationWarningComponent] });
    const fixture = TestBed.createComponent(ModerationWarningComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('This content may be offensive');
    const spy = spyOn(fixture.componentInstance.reveal, 'emit');
    element.querySelector('button')?.click();
    expect(spy).toHaveBeenCalled();
  });
});
