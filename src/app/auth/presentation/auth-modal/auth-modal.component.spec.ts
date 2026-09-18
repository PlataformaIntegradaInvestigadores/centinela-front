import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthModalComponent } from './auth-modal.component';
import { AuthModalService, AuthModalState } from 'src/app/auth/domain/services/auth-modal.service';

describe('AuthModalComponent', () => {
  let component: AuthModalComponent;
  let authModalSpy: jasmine.SpyObj<AuthModalService>;
  let modalState$: Subject<AuthModalState>;

  beforeEach(() => {
    document.body.className = '';
    document.body.style.overflow = '';
    modalState$ = new Subject<AuthModalState>();
    authModalSpy = jasmine.createSpyObj('AuthModalService', [
      'closeModal',
      'switchToRegister',
      'switchToLogin',
      'switchUserType',
    ]);
    (authModalSpy as any).modalState$ = modalState$.asObservable();

    TestBed.configureTestingModule({
      declarations: [AuthModalComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: AuthModalService, useValue: authModalSpy }],
    });
    component = TestBed.createComponent(AuthModalComponent).componentInstance;
  });

  afterEach(() => {
    // ngOnInit attaches a real document keydown listener; always detach it so
    // stale listeners from one test don't accumulate on `document` for the rest
    // of the suite.
    component.ngOnDestroy();
    document.body.className = '';
    document.body.style.overflow = '';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('locks body scroll and resets loading when the modal opens', () => {
      component.ngOnInit();
      component.isLoading = true;
      modalState$.next({ isOpen: true, type: 'login', userType: 'user' });
      expect(document.body.classList.contains('modal-open')).toBeTrue();
      expect(document.body.style.overflow).toBe('hidden');
      expect(component.isLoading).toBeFalse();
    });

    it('unlocks body scroll when the modal closes', () => {
      component.ngOnInit();
      modalState$.next({ isOpen: true, type: 'login', userType: 'user' });
      modalState$.next({ isOpen: false, type: null, userType: 'user' });
      expect(document.body.classList.contains('modal-open')).toBeFalse();
      expect(document.body.style.overflow).toBe('');
    });

    it('closes the modal on Escape while open', () => {
      component.ngOnInit();
      modalState$.next({ isOpen: true, type: 'login', userType: 'user' });
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(authModalSpy.closeModal).toHaveBeenCalled();
    });

    it('does nothing on Escape while closed', () => {
      component.ngOnInit();
      modalState$.next({ isOpen: false, type: null, userType: 'user' });
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(authModalSpy.closeModal).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy restores body scroll and removes the escape listener', () => {
    component.ngOnInit();
    modalState$.next({ isOpen: true, type: 'login', userType: 'user' });
    component.ngOnDestroy();
    expect(document.body.classList.contains('modal-open')).toBeFalse();
    expect(document.body.style.overflow).toBe('');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(authModalSpy.closeModal).not.toHaveBeenCalled();
  });

  it('setLoading updates isLoading', () => {
    component.setLoading(true);
    expect(component.isLoading).toBeTrue();
  });

  it('closeModal delegates to the service', () => {
    component.closeModal();
    expect(authModalSpy.closeModal).toHaveBeenCalled();
  });

  describe('onBackdropClick', () => {
    it('closes the modal when clicking exactly on the backdrop', () => {
      const el = document.createElement('div');
      component.onBackdropClick({ target: el, currentTarget: el } as unknown as Event);
      expect(authModalSpy.closeModal).toHaveBeenCalled();
    });

    it('does not close when the click bubbled from an inner element', () => {
      const backdrop = document.createElement('div');
      const inner = document.createElement('div');
      component.onBackdropClick({ target: inner, currentTarget: backdrop } as unknown as Event);
      expect(authModalSpy.closeModal).not.toHaveBeenCalled();
    });
  });

  it('switchToRegister/switchToLogin/switchUserType delegate to the service', () => {
    component.switchToRegister();
    component.switchToLogin();
    component.switchUserType('company');
    expect(authModalSpy.switchToRegister).toHaveBeenCalled();
    expect(authModalSpy.switchToLogin).toHaveBeenCalled();
    expect(authModalSpy.switchUserType).toHaveBeenCalledWith('company');
  });
});
