import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ReportDialogComponent } from './report-dialog.component';

describe('ReportDialogComponent', () => {
  let component: ReportDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ReportDialogComponent],
    });
    const fixture = TestBed.createComponent(ReportDialogComponent);
    component = fixture.componentInstance;
    component.open = true;
    fixture.detectChanges();
  });

  it('emits the trimmed reason on submit', () => {
    const spy = spyOn(component.submitted, 'emit');
    component.reason = '  ofensivo  ';
    component.submit();
    expect(spy).toHaveBeenCalledWith('ofensivo');
  });

  it('ignores submit while a report is in flight', () => {
    const spy = spyOn(component.submitted, 'emit');
    component.isSubmitting = true;
    component.submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('clears the reason and emits cancelled', () => {
    const spy = spyOn(component.cancelled, 'emit');
    component.reason = 'x';
    component.cancel();
    expect(component.reason).toBe('');
    expect(spy).toHaveBeenCalled();
  });
});
