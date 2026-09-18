import { FormGroup } from '@angular/forms';

/**
 * Obtiene los errores de validación del formulario.
 * @param form - El formulario del cual se obtienen los errores de validación.
 * @returns Una lista de mensajes de error.
 */
export function getFormValidationErrors(form: FormGroup): string[] {
  const messages: string[] = [];
  Object.keys(form.controls).forEach((key) => {
    const controlErrors = form.get(key)?.errors;
    if (controlErrors) {
      Object.keys(controlErrors).forEach((keyError) => {
        switch (keyError) {
          case 'required':
            messages.push(`${getControlLabel(key)} is required.`);
            break;
          case 'minlength':
            messages.push(`${getControlLabel(key)} must be at least 8 characters long.`);
            break;
          case 'pattern':
            if (key === 'password') {
              messages.push(
                `${getControlLabel(key)} must contain at least one uppercase letter, one lowercase letter, one number, and one special character.`,
              );
            } else if (key === 'scopus_id') {
              messages.push(`${getControlLabel(key)} must be a positive number.`);
            }
            break;
          case 'mismatch':
            messages.push(`Passwords do not match.`);
            break;
          case 'minAge':
            messages.push(`You must be at least 18 years old to register.`);
            break;
          default:
            messages.push(`Invalid value in ${getControlLabel(key)}.`);
            break;
        }
      });
    }
  });
  return messages;
}

/**
 * Obtiene la etiqueta de un control de formulario basado en su nombre.
 * @param controlName - El nombre del control de formulario.
 * @returns La etiqueta del control de formulario.
 */
function getControlLabel(controlName: string): string {
  const controlLabels: { [key: string]: string } = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    birthday: 'Birthday',
    scopus_id: 'Scopus ID',
    agree_terms: 'Agree to Terms',
  };
  return controlLabels[controlName] || controlName;
}
