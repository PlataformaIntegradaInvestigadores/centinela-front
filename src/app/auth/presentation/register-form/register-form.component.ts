import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../domain/services/auth.service';
import { passwordMatchValidator } from '../../domain/entities/custom-validators';
import { User, UserType } from '../../domain/entities/interfaces';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css'],
})
export class RegisterFormComponent implements OnInit {
  @Output() registerSuccess = new EventEmitter<void>();
  @Input() userType: UserType = 'user';

  registerForm: FormGroup = new FormGroup({});
  errorMessages: string[] = [];
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  private commonWeakPasswords = [
    '12345678',
    '123456789',
    'password',
    'password123',
    'qwerty123',
    'admin123',
    'centinela123',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        username: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
        scopus_id: ['', Validators.pattern(/^[0-9]*$/)],
        agree_terms: [false, Validators.requiredTrue],
      },
      { validators: passwordMatchValidator },
    );
  }

  get passwordChecklist(): { label: string; passed: boolean }[] {
    const password = this.registerForm.get('password')?.value || '';
    const confirmPassword = this.registerForm.get('confirm_password')?.value || '';
    const normalizedPassword = this.normalizeValue(password);

    return [
      {
        label: 'At least 8 characters',
        passed: password.length >= 8,
      },
      {
        label: 'Not entirely numeric',
        passed: password.length > 0 && !/^\d+$/.test(password),
      },
      {
        label: 'Not a common password',
        passed: password.length > 0 && !this.commonWeakPasswords.includes(normalizedPassword),
      },
      {
        label: 'Not similar to your personal information',
        passed: password.length > 0 && !this.isSimilarToUserInfo(normalizedPassword),
      },
      {
        label: 'Passwords match',
        passed: password.length > 0 && password === confirmPassword,
      },
    ];
  }

  /**
   * Maneja el envío del formulario de registro.
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessages = ['Please fill in all required fields correctly.'];
      return;
    }

    this.isLoading = true;
    this.errorMessages = [];

    const formValues = { ...this.registerForm.value };

    // Eliminar campos que no se envían al backend
    delete formValues.confirm_password;
    delete formValues.agree_terms;

    const user: User = {
      ...formValues,
      password: formValues.password, // Enviar contraseña en texto plano - el backend se encarga del hasheo
      scopus_id: formValues.scopus_id ? formValues.scopus_id : null,
      id: null,
    };

    this.authService.register(user).subscribe({
      next: () => {
        this.isLoading = false;
        this.registerSuccess.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessages = error.message.split('\n');
      },
    });
  }

  /**
   * Evita la entrada de caracteres no alfabéticos.
   */
  preventNonAlphabetic(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    if (!/[a-zA-Z\s]/.test(char)) {
      event.preventDefault();
    }
  }

  /**
   * Capitaliza la primera letra de cada palabra en la entrada del usuario.
   */
  capitalizeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const words = input.value.split(' ');
    const capitalizedWords = words.map((word: string) => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    });
    input.value = capitalizedWords.join(' ');

    // Actualizar el valor del formulario
    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.registerForm.get(controlName)?.setValue(input.value);
    }
  }

  /**
   * Evita la entrada de caracteres no numéricos.
   */
  preventNonNumeric(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private isSimilarToUserInfo(normalizedPassword: string): boolean {
    const values = [
      this.registerForm.get('first_name')?.value,
      this.registerForm.get('last_name')?.value,
      this.registerForm.get('username')?.value?.split('@')[0],
      this.registerForm.get('scopus_id')?.value,
    ]
      .map((value) => this.normalizeValue(value || ''))
      .filter((value) => value.length >= 3);

    return values.some(
      (value) => normalizedPassword.includes(value) || value.includes(normalizedPassword),
    );
  }

  private normalizeValue(value: string): string {
    return value.toString().trim().toLowerCase();
  }
}
