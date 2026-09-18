import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Component({
  selector: 'app-data-form',
  templateUrl: './data-form.component.html',
  styleUrls: ['./data-form.component.css'],
})
export class DataFormComponent implements OnInit {
  @Input() user: any;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<void>(); // Añadir este evento
  errorMessage: string | null = null;
  errorMessages: any = {};
  selectedFile: File | null = null;
  formData = {
    first_name: '',
    last_name: '',
    scopus_id: '',
    institution: '',
    website: '',
    investigation_camp: '',
    interests: '',
    skills: '',
    profile_picture: '',
    email_institution: '',
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (this.user) {
      this.formData = {
        first_name: this.user.first_name || '',
        last_name: this.user.last_name || '',
        scopus_id: this.user.scopus_id || '',
        institution: this.user.institution || '',
        website: this.user.website || '',
        investigation_camp: this.user.investigation_camp || '',
        interests: this.user.interests || '',
        skills: this.user.skills || '',
        profile_picture: this.user.profile_picture || '',
        email_institution: this.user.email_institution || '',
      };
    }
  }

  /**
   * Maneja el envío del formulario.
   */
  onSubmit(): void {
    this.errorMessages = {};

    // Validar que los campos obligatorios no estén vacíos
    if (!this.formData.first_name.trim()) {
      this.errorMessages.first_name = 'First name is required.';
    }

    if (!this.formData.last_name.trim()) {
      this.errorMessages.last_name = 'Last name is required.';
    }

    // Validar y ajustar la URL del sitio web
    if (this.formData.website) {
      if (!this.isValidURL(this.formData.website)) {
        this.errorMessages.website = 'Invalid website URL.';
      } else {
        this.formData.website = this.adjustURL(this.formData.website);
      }
    }

    if (Object.keys(this.errorMessages).length > 0) {
      this.errorMessage = 'Please fix the errors in the form.';
      return;
    }

    const formData = new FormData();
    formData.append('first_name', this.formData.first_name);
    formData.append('last_name', this.formData.last_name);
    formData.append('scopus_id', this.formData.scopus_id || '');
    formData.append('institution', this.formData.institution || '');
    formData.append('website', this.formData.website || '');
    formData.append('investigation_camp', this.formData.investigation_camp || '');
    formData.append('interests', this.formData.interests || '');
    formData.append('skills', this.formData.skills || '');
    formData.append('email_institution', this.formData.email_institution || '');

    if (this.selectedFile) {
      formData.append('profile_picture', this.selectedFile, this.selectedFile.name);
      console.log('Profile picture:', this.selectedFile); // Asegúrate de que esto muestra la imagen seleccionada
    }

    this.authService.updateUser(formData).subscribe(
      (response) => {
        console.log('User updated successfully', response);
        this.formSubmitted.emit();
        this.errorMessage = null;
        window.location.reload();
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('There was an error updating the user!', error);
      },
    );
  }

  /**
   * Cierra el formulario emitiendo un evento.
   */
  closeForm(): void {
    this.formClosed.emit();
  }

  /**
   * Ajusta la URL agregando "http://" si falta.
   * @param url - La URL a ajustar.
   * @returns La URL ajustada.
   */
  adjustURL(url: string): string {
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    return url;
  }

  /**
   * Verifica si una URL es válida.
   * @param url - La URL a verificar.
   * @returns Verdadero si la URL es válida, falso en caso contrario.
   */
  isValidURL(url: string): boolean {
    const urlPattern = new RegExp(
      '^(https?:\\/\\/)?' +
        '((([a-zA-Z0-9\\-]+\\.)+[a-zA-Z]{2,})|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-zA-Z0-9@:%._\\+~#=]*)*' +
        '(\\?[;&a-zA-Z0-9@:%._\\+~#=]*)?' +
        '(\\#[-a-zA-Z0-9_]*)?$',
    );
    return urlPattern.test(url);
  }

  /**
   * Maneja la selección de un archivo.
   * @param event - El evento de selección de archivo.
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.profile_picture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Evita la entrada de caracteres no numéricos en el campo de ID de Scopus.
   * @param event - El evento del teclado.
   */
  preventNonNumeric(event: KeyboardEvent): void {
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }
}
