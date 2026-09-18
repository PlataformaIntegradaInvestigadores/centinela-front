import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-create-debate',
  templateUrl: './create-debate.component.html',
  styleUrls: ['./create-debate.component.css'],
})
export class CreateDebateComponent {
  @Input() debateTitle!: string;
  @Input() debateDescription!: string;
  @Input() durationHours!: number;
  @Input() durationMinutes!: number;

  @Output() closeModalRequested = new EventEmitter<void>();
  @Output() submitDebate = new EventEmitter<void>();

  onSubmit(): void {
    this.submitDebate.emit();
  }

  closeModal(): void {
    this.closeModalRequested.emit();
  }
}
