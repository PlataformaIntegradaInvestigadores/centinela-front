import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../domain/services/auth.service';
import { ErrorService } from '../../domain/services/error.service';
import { LoginCredentials, UserType } from '../../domain/entities/interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
})
export class LoginFormComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();
  @Input() userType: UserType = 'user';

  loginForm: FormGroup;
  errorMessages: string[] = [];
  isLoading: boolean = false;
  authStep: 'credentials' | 'enrollment' | 'verify' = 'credentials';
  mfaChallenge: string | null = null;
  mfaExpiresIn = 300;
  showPassword: boolean = false;

  private failedCredentialAttempts = 0;
  private readonly credentialWarningThreshold = 3;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private errorService: ErrorService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Reset form and errors when component initializes
    this.loginForm.reset();
    this.errorMessages = [];
    this.resetMfaState();
  }

  /**
   * Maneja el envío del formulario de inicio de sesión.
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessages = [];

      const formData = this.loginForm.value;

      // Enviar contraseña en texto plano - el backend se encarga del hasheo
      const loginData: LoginCredentials = {
        username: formData.username,
        password: formData.password,
      };

      this.authService.login(loginData, this.userType).subscribe({
        next: (response) => {
          this.isLoading = false;

          if (this.authService.isMfaChallengeResponse(response)) {
            this.failedCredentialAttempts = 0;
            this.mfaChallenge = response.mfa_challenge;
            this.mfaExpiresIn = response.expires_in || 300;
            this.authStep = response.status === 'mfa_enrollment_required' ? 'enrollment' : 'verify';
            return;
          }

          this.failedCredentialAttempts = 0;
          this.completeLogin();
        },
        error: (error) => {
          this.isLoading = false;
          this.processErrors(error);
        },
      });
    } else {
      this.errorMessages = ['Please fill in all required fields correctly.'];
    }
  }

  onMfaCompleted(): void {
    this.completeLogin();
  }

  backToCredentials(message?: string): void {
    this.resetMfaState();
    this.loginForm.get('password')?.reset();
    this.errorMessages = message ? [message] : [];
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Procesa los errores de la respuesta de la API y actualiza los mensajes de error.
   */
  private processErrors(errors: HttpErrorResponse): void {
    this.failedCredentialAttempts += 1;
    this.errorMessages = this.errorService.processErrors(errors);
    if (this.failedCredentialAttempts >= this.credentialWarningThreshold) {
      this.errorMessages = [
        ...this.errorMessages,
        'Too many failed attempts may temporarily block sign-in. Wait a few minutes before trying again.',
      ];
    }
    console.error('Error logging in', this.errorMessages);
  }

  private completeLogin(): void {
    const userId =
      this.userType === 'company' ? this.authService.getCompanyId() : this.authService.getUserId();
    if (userId) {
      this.loginSuccess.emit();
      // Pequeño delay para que el modal se cierre antes de navegar
      setTimeout(() => {
        if (this.userType === 'company') {
          // Navegar al perfil de empresa
          this.router.navigate([`/company/${userId}`]);
        } else {
          this.router.navigate([`/profile/${userId}/about-me`]);
        }
      }, 100);
    }
  }

  private resetMfaState(): void {
    this.authStep = 'credentials';
    this.mfaChallenge = null;
    this.mfaExpiresIn = 300;
  }
}
