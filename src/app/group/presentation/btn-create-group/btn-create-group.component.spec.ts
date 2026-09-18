import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BtnCreateGroupComponent } from './btn-create-group.component';

describe('BtnCreateGroupComponent', () => {
  let component: BtnCreateGroupComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BtnCreateGroupComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(BtnCreateGroupComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts closed', () => {
    expect(component.isModalOpen).toBeFalse();
  });

  it('openModal opens it, closeModal closes it', () => {
    component.openModal();
    expect(component.isModalOpen).toBeTrue();
    component.closeModal();
    expect(component.isModalOpen).toBeFalse();
  });
});
