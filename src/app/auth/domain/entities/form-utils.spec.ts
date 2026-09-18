import { FormGroup, FormControl } from '@angular/forms';
import { getFormValidationErrors } from './form-utils';

describe('getFormValidationErrors', () => {
  function controlWithError(errors: Record<string, unknown>): FormControl {
    const control = new FormControl('');
    control.setErrors(errors);
    return control;
  }

  it('returns an empty list for a form with no errors', () => {
    const form = new FormGroup({ first_name: new FormControl('Ada') });
    expect(getFormValidationErrors(form)).toEqual([]);
  });

  it('maps a required error using the friendly control label', () => {
    const form = new FormGroup({ first_name: controlWithError({ required: true }) });
    expect(getFormValidationErrors(form)).toEqual(['First Name is required.']);
  });

  it('maps a minlength error', () => {
    const form = new FormGroup({ password: controlWithError({ minlength: true }) });
    expect(getFormValidationErrors(form)).toEqual([
      'Password must be at least 8 characters long.',
    ]);
  });

  it('maps a pattern error differently for password vs scopus_id', () => {
    const passwordForm = new FormGroup({ password: controlWithError({ pattern: true }) });
    expect(getFormValidationErrors(passwordForm)[0]).toContain('uppercase letter');

    const scopusForm = new FormGroup({ scopus_id: controlWithError({ pattern: true }) });
    expect(getFormValidationErrors(scopusForm)).toEqual(['Scopus ID must be a positive number.']);
  });

  it('maps a mismatch error', () => {
    const form = new FormGroup({ confirm_password: controlWithError({ mismatch: true }) });
    expect(getFormValidationErrors(form)).toEqual(['Passwords do not match.']);
  });

  it('maps a minAge error', () => {
    const form = new FormGroup({ birthday: controlWithError({ minAge: true }) });
    expect(getFormValidationErrors(form)).toEqual([
      'You must be at least 18 years old to register.',
    ]);
  });

  it('falls back to a generic message for an unknown error key', () => {
    const form = new FormGroup({ email: controlWithError({ weirdError: true }) });
    expect(getFormValidationErrors(form)).toEqual(['Invalid value in Email.']);
  });

  it('falls back to the raw control name when there is no friendly label', () => {
    const form = new FormGroup({ custom_field: controlWithError({ required: true }) });
    expect(getFormValidationErrors(form)).toEqual(['custom_field is required.']);
  });

  it('collects errors across multiple controls', () => {
    const form = new FormGroup({
      first_name: controlWithError({ required: true }),
      password: controlWithError({ minlength: true }),
    });
    expect(getFormValidationErrors(form).length).toBe(2);
  });
});
