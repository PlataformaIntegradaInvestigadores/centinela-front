import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminComponent } from './admin.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let authSpy: jasmine.SpyObj<AuthenticationService>;
  let navigateSpy: jasmine.Spy;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    authSpy = jasmine.createSpyObj('AuthenticationService', ['login']);
    TestBed.configureTestingModule({
      declarations: [AdminComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthenticationService, useValue: authSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stores the admin token from the login response and opens the dashboard', () => {
    authSpy.login.and.returnValue(of({ message: 'ok', token: 'adm-1', expires_in: 3600 }));
    component.username = 'admin';
    component.password = 'secret';

    component.login();

    expect(authSpy.login).toHaveBeenCalledWith('admin', 'secret');
    expect(sessionStorage.getItem('adminToken')).toBe('adm-1');
    expect(localStorage.getItem('authState')).toBe('authenticated');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('never keeps the password', () => {
    authSpy.login.and.returnValue(of({ message: 'ok', token: 'adm-1', expires_in: 3600 }));
    component.username = 'admin';
    component.password = 'secret';

    component.login();

    expect(JSON.stringify(sessionStorage)).not.toContain('secret');
    expect(JSON.stringify(localStorage)).not.toContain('secret');
  });

  it('still opens the dashboard against a backend that does not issue a token yet', () => {
    authSpy.login.and.returnValue(of({ message: 'Login Succesfull' }));

    component.login();

    expect(localStorage.getItem('authState')).toBe('authenticated');
    expect(sessionStorage.getItem('adminToken')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('shows the error message and stores nothing when the login fails', () => {
    authSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid Credentials' } })));

    component.login();

    expect(component.message).toBe('Invalid Credentials');
    expect(sessionStorage.getItem('adminToken')).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
