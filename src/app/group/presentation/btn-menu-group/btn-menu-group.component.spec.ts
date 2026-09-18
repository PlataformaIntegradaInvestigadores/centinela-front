import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnMenuGroupComponent } from './btn-menu-group.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { GroupService } from '../../domain/entities/group.service';
import { ModalService } from '../../domain/services/modalService.service';

// onConfirmLeave/onConfirmDelete's success branch calls window.location.reload()
// synchronously, which real headless Chrome refuses to let tests stub (location/reload
// are non-configurable, non-writable in this Chrome build) and would otherwise actually
// reload the Karma runner mid-suite. So every success-path test below stubs the service
// call with a Subject that's never next()'d — exercising the service call without ever
// reaching reload(). See data-form.component.spec.ts / group-create-modal.component.spec.ts
// for the same pattern.
describe('BtnMenuGroupComponent', () => {
  let component: BtnMenuGroupComponent;
  let fixture: ComponentFixture<BtnMenuGroupComponent>;
  let groupServiceSpy: jasmine.SpyObj<GroupService>;
  let modalServiceSpy: jasmine.SpyObj<ModalService>;
  let modalOpenSubject: any;

  beforeEach(() => {
    groupServiceSpy = jasmine.createSpyObj('GroupService', ['leaveGroup', 'deleteGroup']);
    groupServiceSpy.leaveGroup.and.returnValue(new Subject());
    groupServiceSpy.deleteGroup.and.returnValue(new Subject());

    modalOpenSubject = new Subject();
    modalServiceSpy = jasmine.createSpyObj('ModalService', ['setModalOpen']);
    (modalServiceSpy as any).modalOpen$ = modalOpenSubject.asObservable();

    TestBed.configureTestingModule({
      declarations: [BtnMenuGroupComponent],
      providers: [
        { provide: GroupService, useValue: groupServiceSpy },
        { provide: ModalService, useValue: modalServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(BtnMenuGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reflects the modalOpen$ stream set in the constructor', () => {
    modalOpenSubject.next(true);
    expect(component.modalOpen).toBeTrue();
    modalOpenSubject.next(false);
    expect(component.modalOpen).toBeFalse();
  });

  it('toggleMenu flips menuOpen and notifies the modal service', () => {
    component.menuOpen = false;
    component.toggleMenu();
    expect(component.menuOpen).toBeTrue();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(true);
    component.toggleMenu();
    expect(component.menuOpen).toBeFalse();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(false);
  });

  it('deleteGroup opens the delete modal and flags the modal as open', () => {
    component.deleteGroup();
    expect(component.showDeleteGroupModal).toBeTrue();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(true);
  });

  it('leaveGroup opens the leave modal and flags the modal as open', () => {
    component.leaveGroup();
    expect(component.showConfirmLeaveModal).toBeTrue();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(true);
  });

  it('onConfirmLeave calls leaveGroup with the current group id', () => {
    component.groupId = 'g-1';
    component.onConfirmLeave();
    expect(groupServiceSpy.leaveGroup).toHaveBeenCalledWith('g-1');
    // The success branch (modal close, emit, reload()) isn't exercised here — see the
    // file-level comment on why reload() can't safely fire in this Chrome build.
  });

  it('onCancelLeave closes the leave modal and the modal service', () => {
    component.showConfirmLeaveModal = true;
    component.onCancelLeave();
    expect(component.showConfirmLeaveModal).toBeFalse();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(false);
  });

  it('onConfirmDelete calls deleteGroup with the current group id', () => {
    component.groupId = 'g-2';
    component.onConfirmDelete();
    expect(groupServiceSpy.deleteGroup).toHaveBeenCalledWith('g-2');
    // The success branch (modal close, emit, reload()) isn't exercised here — see the
    // file-level comment on why reload() can't safely fire in this Chrome build.
  });

  it('onCancelDelete closes the delete modal and the modal service', () => {
    component.showDeleteGroupModal = true;
    component.onCancelDelete();
    expect(component.showDeleteGroupModal).toBeFalse();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(false);
  });

  it('onDocumentClick closes the menu when the click is outside .relative', () => {
    component.menuOpen = true;
    component.onDocumentClick({ target: { closest: () => null } } as any);
    expect(component.menuOpen).toBeFalse();
    expect(modalServiceSpy.setModalOpen).toHaveBeenCalledWith(false);
  });

  it('onDocumentClick keeps the menu open when the click is inside .relative', () => {
    component.menuOpen = true;
    component.onDocumentClick({ target: { closest: () => ({}) } } as any);
    expect(component.menuOpen).toBeTrue();
  });

  it('onDocumentClick does nothing while the menu is already closed', () => {
    component.menuOpen = false;
    component.onDocumentClick({ target: { closest: () => null } } as any);
    expect(component.menuOpen).toBeFalse();
  });
});
