import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserInfo } from 'src/app/profile/domain/entities/user.interfaces';

@Component({
  selector: 'app-about-me-profile',
  templateUrl: './about-me-profile.component.html',
  styleUrls: ['./about-me-profile.component.css'],
})
export class AboutMeProfileComponent implements OnChanges {
  @Input() userInfo: UserInfo = this.initializeUserInfo();
  @Input() isOwnProfile?: boolean;
  @Output() saveAboutMe = new EventEmitter<string>();
  @Output() toggleEdit = new EventEmitter<void>();

  isEditing: boolean = false;
  editableUserInfo: UserInfo = this.initializeUserInfo();
  saveMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userInfo'] && changes['userInfo'].currentValue) {
      this.editableUserInfo = { ...this.userInfo };
    }
  }

  private initializeUserInfo(): UserInfo {
    return { about_me: '', disciplines: [], contact_info: [] };
  }

  /**
   * Alterna el modo de edición del componente.
   */
  toggleEditAboutMe(): void {
    this.isEditing = !this.isEditing;
    this.toggleEdit.emit();
  }

  /**
   * Guarda la información de "Sobre mí" y emite el evento correspondiente.
   */
  save(): void {
    this.saveAboutMe.emit(this.editableUserInfo.about_me || '');
    this.isEditing = false;
    this.displaySaveMessage();
  }

  /**
   * Cancela la edición y restablece la información original.
   */
  cancel(): void {
    this.isEditing = false;
    this.editableUserInfo = { ...this.userInfo };
  }

  /**
   * Muestra un mensaje de guardado exitoso.
   */
  displaySaveMessage(): void {
    this.saveMessage = 'Changes saved successfully!';
    setTimeout(() => {
      this.saveMessage = '';
    }, 3000); // Oculta el mensaje después de 3 segundos
  }

  /**
   * Verifica si hay contenido en "Sobre mí".
   * @returns Verdadero si hay contenido, falso en caso contrario.
   */
  hasAboutMeContent(): boolean {
    return !!this.userInfo.about_me && this.userInfo.about_me.length > 0;
  }
}
