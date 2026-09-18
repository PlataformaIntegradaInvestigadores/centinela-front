import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'confirm-delete-modal',
  templateUrl: './confirm-delete-modal.component.html',
  styleUrls: ['./confirm-delete-modal.component.css'],
})
export class ConfirmDeleteModalComponent {
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(event: Event) {
    event.stopPropagation();
    this.confirm.emit();
  }

  onCancel(event: Event) {
    event.stopPropagation();
    this.cancel.emit();
  }
}
