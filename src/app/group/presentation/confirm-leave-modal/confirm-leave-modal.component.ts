import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'confirm-leave-modal',
  templateUrl: './confirm-leave-modal.component.html',
  styleUrls: ['./confirm-leave-modal.component.css'],
  encapsulation: ViewEncapsulation.Emulated, // Esta es la opción por defecto, pero puedes asegurarte de que está configurada
})
export class ConfirmLeaveModalComponent {
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
