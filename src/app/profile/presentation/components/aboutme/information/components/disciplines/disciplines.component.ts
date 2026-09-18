import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-disciplines',
  templateUrl: './disciplines.component.html',
  styleUrls: ['./disciplines.component.css'],
})
export class DisciplinesComponent implements OnChanges {
  @Input() disciplines: string[] = [];
  @Input() isOwnProfile?: boolean;
  @Output() saveDisciplines = new EventEmitter<string[]>();
  @Output() toggleEdit = new EventEmitter<void>();

  isEditing: boolean = false;
  editableDisciplines: string[] = [];
  newDiscipline: string = '';
  saveMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disciplines']) {
      this.editableDisciplines = [...this.disciplines];
    }
  }

  /**
   * Alterna el modo de edición del componente.
   */
  toggleEditDisciplines(): void {
    this.isEditing = !this.isEditing;
    this.toggleEdit.emit();
  }

  /**
   * Guarda las disciplinas y emite el evento correspondiente.
   */
  save(): void {
    this.saveDisciplines.emit(this.editableDisciplines);
    this.isEditing = false;
    this.displaySaveMessage();
  }

  /**
   * Cancela la edición y restablece las disciplinas originales.
   */
  cancel(): void {
    this.isEditing = false;
    this.editableDisciplines = [...this.disciplines];
  }

  /**
   * Añade una nueva disciplina a la lista editable.
   */
  addDiscipline(): void {
    if (this.newDiscipline) {
      this.editableDisciplines.push(this.newDiscipline);
      this.newDiscipline = '';
    }
  }

  /**
   * Elimina una disciplina de la lista editable.
   * @param index - El índice de la disciplina a eliminar.
   */
  removeDiscipline(index: number): void {
    this.editableDisciplines.splice(index, 1);
  }

  /**
   * Muestra un mensaje de guardado exitoso.
   */
  displaySaveMessage(): void {
    this.saveMessage = 'Changes saved successfully!';
    setTimeout(() => {
      this.saveMessage = '';
    }, 3000); // Hide message after 3 seconds
  }
}
