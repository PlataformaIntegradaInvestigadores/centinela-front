import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDebateComponent } from './create-debate.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CreateDebateComponent', () => {
  let component: CreateDebateComponent;
  let fixture: ComponentFixture<CreateDebateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateDebateComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(CreateDebateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
