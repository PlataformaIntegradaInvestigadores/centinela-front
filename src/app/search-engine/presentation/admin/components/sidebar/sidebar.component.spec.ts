import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SidebarDashboardComponent } from './sidebar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SidebarDashboardComponent', () => {
  let component: SidebarDashboardComponent;
  let fixture: ComponentFixture<SidebarDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SidebarDashboardComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(SidebarDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('logout clears the admin session and goes back to the admin login', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    sessionStorage.setItem('adminToken', 'adm-1');
    localStorage.setItem('authState', 'authenticated');

    component.logout();

    expect(sessionStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('authState')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });
});
