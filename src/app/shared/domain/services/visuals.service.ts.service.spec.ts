import { TestBed } from '@angular/core/testing';

import { VisualsService } from './visuals.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('VisualsServiceTsService', () => {
  let service: VisualsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    });

    service = TestBed.inject(VisualsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
