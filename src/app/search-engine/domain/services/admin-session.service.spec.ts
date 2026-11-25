import { TestBed } from '@angular/core/testing';
import { AdminSessionService } from './admin-session.service';

describe('AdminSessionService', () => {
  let service: AdminSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    service = TestBed.inject(AdminSessionService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('has no token before the admin logs in', () => {
    expect(service.token()).toBeNull();
  });

  it('stores the token in sessionStorage and marks the admin as authenticated', () => {
    service.start('tok-1', 3600);

    expect(service.token()).toBe('tok-1');
    expect(sessionStorage.getItem('adminToken')).toBe('tok-1');
    expect(localStorage.getItem('authState')).toBe('authenticated');
  });

  it('never stores the token in localStorage', () => {
    service.start('tok-1', 3600);

    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('drops an expired token and clears the session', () => {
    service.start('tok-1', 3600);
    sessionStorage.setItem('adminTokenExpiresAt', String(Date.now() - 1));

    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('authState')).toBeNull();
  });

  it('treats a token without expiry as invalid', () => {
    sessionStorage.setItem('adminToken', 'tok-1');

    expect(service.token()).toBeNull();
  });

  it('clear removes the token and the authenticated flag', () => {
    service.start('tok-1', 3600);

    service.clear();

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('authState')).toBeNull();
  });
});
