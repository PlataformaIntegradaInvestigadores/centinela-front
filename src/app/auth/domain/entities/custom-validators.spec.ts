import { FormGroup, FormControl } from '@angular/forms';
import { passwordMatchValidator } from './custom-validators';

describe('passwordMatchValidator', () => {
  function buildForm(password: string, confirmPassword: string): FormGroup {
    return new FormGroup({
      password: new FormControl(password),
      confirm_password: new FormControl(confirmPassword),
    });
  }

  it('sets a mismatch error on confirm_password when values differ', () => {
    const form = buildForm('secret1', 'secret2');
    passwordMatchValidator(form);
    expect(form.get('confirm_password')?.errors).toEqual({ mismatch: true });
  });

  it('clears errors on confirm_password when values match', () => {
    const form = buildForm('secret1', 'secret1');
    passwordMatchValidator(form);
    expect(form.get('confirm_password')?.errors).toBeNull();
  });

  it('always returns null (errors are attached to confirm_password, not the group)', () => {
    const form = buildForm('a', 'b');
    expect(passwordMatchValidator(form)).toBeNull();
  });

  it('does nothing when confirm_password control is absent', () => {
    const form = new FormGroup({ password: new FormControl('secret1') });
    expect(() => passwordMatchValidator(form)).not.toThrow();
    expect(passwordMatchValidator(form)).toBeNull();
  });
});
