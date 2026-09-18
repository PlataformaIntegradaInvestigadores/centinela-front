import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterDashboardComponent } from './footer.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FooterDashboardComponent', () => {
  let component: FooterDashboardComponent;
  let fixture: ComponentFixture<FooterDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FooterDashboardComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(FooterDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
