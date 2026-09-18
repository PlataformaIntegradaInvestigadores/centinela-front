import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnMailComponent } from './btn-mail.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BtnMailComponent', () => {
  let component: BtnMailComponent;
  let fixture: ComponentFixture<BtnMailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BtnMailComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(BtnMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
