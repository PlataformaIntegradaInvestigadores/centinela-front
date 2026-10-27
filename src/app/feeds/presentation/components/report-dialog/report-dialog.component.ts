import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Dialog to report a post or comment with an optional reason.
 */
@Component({
  selector: 'app-report-dialog',
  templateUrl: './report-dialog.component.html',
})
export class ReportDialogComponent {
  @Input() open = false;
  @Input() subject = 'this post';
  @Input() isSubmitting = false;
  @Input() error: string | null = null;

  @Output() submitted = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';

  submit(): void {
    if (this.isSubmitting) return;
    this.submitted.emit(this.reason.trim());
  }

  cancel(): void {
    this.reason = '';
    this.cancelled.emit();
  }
}
