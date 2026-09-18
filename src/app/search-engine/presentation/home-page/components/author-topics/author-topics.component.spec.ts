import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorTopicsComponent } from './author-topics.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AuthorTopicsComponent', () => {
  let component: AuthorTopicsComponent;
  let fixture: ComponentFixture<AuthorTopicsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuthorTopicsComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AuthorTopicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
