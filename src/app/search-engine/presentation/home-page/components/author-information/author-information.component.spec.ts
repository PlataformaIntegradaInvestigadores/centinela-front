import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorInformationComponent } from './author-information.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AuthorInformationComponent', () => {
  let component: AuthorInformationComponent;
  let fixture: ComponentFixture<AuthorInformationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuthorInformationComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AuthorInformationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
