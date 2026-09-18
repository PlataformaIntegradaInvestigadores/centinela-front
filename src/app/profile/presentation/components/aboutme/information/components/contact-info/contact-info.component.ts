import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ContactInfo } from 'src/app/profile/domain/entities/user.interfaces';

@Component({
  selector: 'app-contact-info',
  templateUrl: './contact-info.component.html',
  styleUrls: ['./contact-info.component.css'],
})
export class ContactInfoComponent implements OnChanges {
  @Input() contactInfo: ContactInfo[] = [];
  @Input() isOwnProfile?: boolean;
  @Output() saveContactInfo = new EventEmitter<ContactInfo[]>();
  @Output() toggleEdit = new EventEmitter<void>();

  isEditing: boolean = false;
  editableContactInfo: ContactInfo[] = [];
  newContactValue: string = '';
  saveMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactInfo']) {
      this.editableContactInfo = [...this.contactInfo];
    }
  }

  /**
   * Alterna el modo de edición del componente.
   */
  toggleEditContactInfo(): void {
    this.isEditing = !this.isEditing;
    this.toggleEdit.emit();
  }

  /**
   * Guarda la información de contacto y emite el evento correspondiente.
   */
  save(): void {
    this.saveContactInfo.emit(this.editableContactInfo);
    this.isEditing = false;
    this.displaySaveMessage();
  }

  /**
   * Cancela la edición y restablece la información original.
   */
  cancel(): void {
    this.isEditing = false;
    this.editableContactInfo = [...this.contactInfo];
  }

  /**
   * Añade una nueva información de contacto a la lista editable.
   */
  addContactInfo(): void {
    const type = this.detectContactType(this.newContactValue);
    if (type && this.newContactValue) {
      this.editableContactInfo.push({ type, value: this.newContactValue });
      this.newContactValue = '';
    }
  }

  /**
   * Elimina una información de contacto de la lista editable.
   * @param contact - La información de contacto a eliminar.
   */
  removeContactInfo(contact: ContactInfo): void {
    const index = this.editableContactInfo.indexOf(contact);
    if (index > -1) {
      this.editableContactInfo.splice(index, 1);
    }
  }

  /**
   * Detecta el tipo de contacto basado en el valor proporcionado.
   * @param value - El valor de contacto.
   * @returns El tipo de contacto detectado.
   */
  detectContactType(value: string): string {
    if (/facebook\.com/.test(value)) {
      return 'facebook';
    } else if (/twitter\.com/.test(value) || /x\.com/.test(value)) {
      return 'x';
    } else if (/linkedin\.com/.test(value)) {
      return 'linkedin';
    } else if (/github\.com/.test(value)) {
      return 'github';
    } else if (/youtube\.com\/@[\w-]+/.test(value)) {
      return 'youtube';
    } else if (/orcid\.org(\/\d{4}-\d{4}-\d{4}-\d{3}[0-9X])?/.test(value)) {
      return 'orcid';
    } else if (/^(http|https):\/\/[^\s$.?#].[^\s]*$/.test(value)) {
      return 'website';
    } else if (/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
      return 'email';
    } else if (/^\d{10}$/.test(value)) {
      return 'phone';
    } else {
      return 'other';
    }
  }

  /**
   * Verifica si un valor es una URL.
   * @param value - El valor a verificar.
   * @returns Verdadero si el valor es una URL, falso en caso contrario.
   */
  isUrl(value: string): boolean {
    const urlPattern = /^(http|https):\/\/[^\s$.?#].[^\s]*$/;
    const socialMediaPattern =
      /(facebook\.com|twitter\.com|x\.com|linkedin\.com|github\.com|youtube\.com|youtu\.be|orcid\.org)/;
    return urlPattern.test(value) || socialMediaPattern.test(value);
  }

  /**
   * Obtiene el ícono correspondiente al tipo de contacto.
   * @param type - El tipo de contacto.
   * @returns El nombre de la clase del ícono.
   */
  getContactIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'phone':
        return 'fa-solid fa-phone';
      case 'email':
        return 'fa-solid fa-envelope';
      case 'website':
        return 'fa-solid fa-link';
      case 'facebook':
        return 'fa-brands fa-facebook';
      case 'x':
        return 'fa-brands fa-x-twitter';
      case 'linkedin':
        return 'fa-brands fa-linkedin';
      case 'github':
        return 'fa-brands fa-github';
      case 'youtube':
        return 'fa-brands fa-youtube';
      case 'orcid':
        return 'fa-brands fa-orcid';
      default:
        return 'fa-solid fa-info-circle';
    }
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
