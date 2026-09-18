import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserType } from '../entities/interfaces';

export interface AuthModalState {
  isOpen: boolean;
  type: 'login' | 'register' | null;
  userType: UserType;
}

@Injectable({
  providedIn: 'root',
})
export class AuthModalService {
  private modalStateSubject = new BehaviorSubject<AuthModalState>({
    isOpen: false,
    type: null,
    userType: 'user',
  });

  public modalState$ = this.modalStateSubject.asObservable();

  /**
   * Abre el modal de login para investigadores
   */
  openLogin(userType: UserType = 'user'): void {
    this.modalStateSubject.next({
      isOpen: true,
      type: 'login',
      userType,
    });
  }

  /**
   * Abre el modal de registro para investigadores
   */
  openRegister(userType: UserType = 'user'): void {
    this.modalStateSubject.next({
      isOpen: true,
      type: 'register',
      userType,
    });
  }

  /**
   * Cierra cualquier modal
   */
  closeModal(): void {
    this.modalStateSubject.next({
      isOpen: false,
      type: null,
      userType: 'user',
    });
  }

  /**
   * Cambia entre login y register manteniendo el tipo de usuario
   */
  switchToRegister(): void {
    const currentState = this.modalStateSubject.value;
    this.modalStateSubject.next({
      ...currentState,
      type: 'register',
    });
  }

  /**
   * Cambia entre register y login manteniendo el tipo de usuario
   */
  switchToLogin(): void {
    const currentState = this.modalStateSubject.value;
    this.modalStateSubject.next({
      ...currentState,
      type: 'login',
    });
  } /**
   * Cambia el tipo de usuario
   */
  switchUserType(userType: UserType): void {
    const currentState = this.modalStateSubject.value;
    this.modalStateSubject.next({
      ...currentState,
      userType,
    });
  }

  /**
   * Obtiene el estado actual del modal
   */
  getCurrentState(): AuthModalState {
    return this.modalStateSubject.value;
  }
}
