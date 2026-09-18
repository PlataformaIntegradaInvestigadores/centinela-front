import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelevantAuthorsComponent } from './relevant-authors.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('RelevantAuthorsComponent', () => {
  let component: RelevantAuthorsComponent;
  let fixture: ComponentFixture<RelevantAuthorsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RelevantAuthorsComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(RelevantAuthorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
