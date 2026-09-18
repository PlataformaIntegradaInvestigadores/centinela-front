import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnaliticaComponent } from './analitica.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AnaliticaComponent', () => {
  let component: AnaliticaComponent;
  let fixture: ComponentFixture<AnaliticaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnaliticaComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AnaliticaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
