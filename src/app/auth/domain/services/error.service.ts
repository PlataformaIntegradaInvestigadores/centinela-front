import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  handleError(): never {
    throw new Error('Method not implemented.');
  }

  /**
   * Procesa los errores de la respuesta de la API y extrae los mensajes de error.
   * @param errors - Los errores de la respuesta de la API.
   * @returns Una lista de mensajes de error.
   */
  processErrors(errors: { error?: Record<string, unknown> }): string[] {
    const errorMessages: string[] = [];

    if (errors.error) {
      if (errors.error['detail']) {
        errorMessages.push(errors.error['detail'] as string);
      } else {
        for (const key in errors.error) {
          if (Object.prototype.hasOwnProperty.call(errors.error, key)) {
            const errorArray = errors.error[key];
            if (Array.isArray(errorArray)) {
              errorArray.forEach((err) => {
                errorMessages.push(err);
              });
            } else {
              errorMessages.push(errorArray as string);
            }
          }
        }
      }
    } else {
      errorMessages.push('Incorrect email or password.');
    }

    return errorMessages;
  }
}
