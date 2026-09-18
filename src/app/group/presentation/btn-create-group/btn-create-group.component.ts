import { Component } from '@angular/core';

@Component({
  selector: 'btn-create-group',
  templateUrl: './btn-create-group.component.html',
  styleUrls: ['./btn-create-group.component.css'],
})
export class BtnCreateGroupComponent {
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
