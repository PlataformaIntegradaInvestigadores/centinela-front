import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UpdateCentinelaComponent } from './update-centinela.component';
import { UpdateCentinelaService } from 'src/app/search-engine/domain/services/update-centinela.service';

describe('UpdateCentinelaComponent', () => {
  let component: UpdateCentinelaComponent;

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('UpdateCentinelaService', [
      'updateAuthorsCentinela',
      'searchArticlesCentinela',
    ]);
    TestBed.configureTestingModule({
      declarations: [UpdateCentinelaComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: UpdateCentinelaService, useValue: serviceSpy }],
    });
    component = TestBed.createComponent(UpdateCentinelaComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with no integration status and loading false', () => {
    expect(component.integrationStatus).toBeUndefined();
    expect(component.loading).toBeFalse();
  });
});
