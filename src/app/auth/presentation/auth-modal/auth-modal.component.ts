import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthModalService, AuthModalState } from '../../domain/services/auth-modal.service';
import { UserType } from '../../domain/entities/interfaces';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css'],
})
export class AuthModalComponent implements OnInit, OnDestroy {
  modalState: AuthModalState = { isOpen: false, type: null, userType: 'user' };
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private authModalService: AuthModalService) {}
  ngOnInit(): void {
    this.authModalService.modalState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.modalState = state;

      // Prevent body scroll when modal is open
      if (state.isOpen) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        // Reset loading state when modal opens
        this.isLoading = false;
      } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    });

    // Listen for escape key
    document.addEventListener('keydown', this.handleEscapeKey);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Restore body scroll
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    // Remove escape key listener
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  /**
   * Handle escape key press to close modal
   */
  private handleEscapeKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.modalState.isOpen) {
      this.closeModal();
    }
  };

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.authModalService.closeModal();
  }

  /**
   * Maneja el click en el backdrop para cerrar el modal
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  /**
   * Cambia a modo registro
   */
  switchToRegister(): void {
    this.authModalService.switchToRegister();
  }
  /**
   * Cambia a modo login
   */
  switchToLogin(): void {
    this.authModalService.switchToLogin();
  }

  /**
   * Cambia el tipo de usuario
   */
  switchUserType(userType: UserType): void {
    this.authModalService.switchUserType(userType);
  }
}
