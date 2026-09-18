import { AuthModalService } from './auth-modal.service';

describe('AuthModalService', () => {
  let service: AuthModalService;

  beforeEach(() => {
    service = new AuthModalService();
  });

  it('starts closed with no type and default user type', () => {
    expect(service.getCurrentState()).toEqual({ isOpen: false, type: null, userType: 'user' });
  });

  it('opens the login modal defaulting to user type', () => {
    service.openLogin();
    expect(service.getCurrentState()).toEqual({ isOpen: true, type: 'login', userType: 'user' });
  });

  it('opens the login modal for a company', () => {
    service.openLogin('company');
    expect(service.getCurrentState()).toEqual({
      isOpen: true,
      type: 'login',
      userType: 'company',
    });
  });

  it('opens the register modal', () => {
    service.openRegister('company');
    expect(service.getCurrentState()).toEqual({
      isOpen: true,
      type: 'register',
      userType: 'company',
    });
  });

  it('closes the modal and resets to defaults', () => {
    service.openLogin('company');
    service.closeModal();
    expect(service.getCurrentState()).toEqual({ isOpen: false, type: null, userType: 'user' });
  });

  it('switches from login to register keeping user type', () => {
    service.openLogin('company');
    service.switchToRegister();
    expect(service.getCurrentState()).toEqual({
      isOpen: true,
      type: 'register',
      userType: 'company',
    });
  });

  it('switches from register to login keeping user type', () => {
    service.openRegister('company');
    service.switchToLogin();
    expect(service.getCurrentState()).toEqual({
      isOpen: true,
      type: 'login',
      userType: 'company',
    });
  });

  it('switches user type keeping modal open/type', () => {
    service.openLogin('user');
    service.switchUserType('company');
    expect(service.getCurrentState()).toEqual({
      isOpen: true,
      type: 'login',
      userType: 'company',
    });
  });

  it('emits state changes on modalState$', (done) => {
    const seen: boolean[] = [];
    service.modalState$.subscribe((state) => seen.push(state.isOpen));
    service.openLogin();
    service.closeModal();
    expect(seen).toEqual([false, true, false]);
    done();
  });
});
