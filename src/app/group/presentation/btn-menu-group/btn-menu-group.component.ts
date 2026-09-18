import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ModalService } from '../../domain/services/modalService.service';
import { GroupService } from '../../domain/entities/group.service';

@Component({
  selector: 'btn-menu-group',
  templateUrl: './btn-menu-group.component.html',
  styleUrls: ['./btn-menu-group.component.css'],
})
export class BtnMenuGroupComponent {
  @Input() isOwner: boolean = false;
  @Input() groupId: string = '';
  @Output() groupDeleted = new EventEmitter<string>();
  @Output() groupLeaveed = new EventEmitter<string>();
  menuOpen: boolean = false;
  showConfirmLeaveModal = false;
  showDeleteGroupModal = false;
  modalOpen: boolean = false;

  constructor(
    private groupService: GroupService,
    private modalService: ModalService,
  ) {
    this.modalService.modalOpen$.subscribe((isOpen) => (this.modalOpen = isOpen));
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.modalService.setModalOpen(this.menuOpen);
  }

  deleteGroup() {
    this.showDeleteGroupModal = true;
    this.modalService.setModalOpen(true);
  }

  leaveGroup() {
    this.showConfirmLeaveModal = true;
    this.modalService.setModalOpen(true);
  }

  onConfirmLeave() {
    this.groupService.leaveGroup(this.groupId).subscribe(() => {
      this.showConfirmLeaveModal = false;
      this.modalService.setModalOpen(false);
      this.groupLeaveed.emit(this.groupId); // Emitir un evento para notificar al componente padre
      window.location.reload();
    });
  }

  onCancelLeave() {
    this.showConfirmLeaveModal = false;
    this.modalService.setModalOpen(false);
  }

  onConfirmDelete() {
    this.groupService.deleteGroup(this.groupId).subscribe(() => {
      this.showDeleteGroupModal = false;
      this.modalService.setModalOpen(false);
      this.groupDeleted.emit(this.groupId); // Emitir un evento para notificar al componente padre
      window.location.reload(); // Recargar la página después de eliminar el grupo
    });
  }

  onCancelDelete() {
    this.showDeleteGroupModal = false;
    this.modalService.setModalOpen(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen) {
      const targetElement = event.target as HTMLElement;
      if (!targetElement.closest('.relative')) {
        this.menuOpen = false;
        this.modalService.setModalOpen(false);
      }
    }
  }
}
