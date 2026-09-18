import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { Group } from 'src/app/group/domain/entities/group.interface';
import { UserG } from 'src/app/group/domain/entities/user.interface';

@Component({
  selector: 'members-consensus',
  templateUrl: './members-consensus.component.html',
  styleUrls: ['./members-consensus.component.css'],
})
export class MembersConsensusComponent implements OnInit, OnChanges {
  @Input() group: Group | null = null;
  idOwnerGroup: string | null = null;
  selectedUser: UserG | null = null; // Para almacenar el usuario seleccionado
  successMessage: string | null = null; // Añadir successMessage

  ngOnInit(): void {
    initFlowbite();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group']) {
      this.selectUser(); // Llamar a selectUser cada vez que group cambie
      this.idOwnerGroup = this.group?.admin_id ?? null;
    }
  }

  selectUser(): void {
    if (this.group && this.group.users && this.group.users.length >= 0) {
      this.selectedUser = this.group.users[0];
    } else {
      this.selectedUser = null;
    }
  }

  onMemberDeleted(memberId: string): void {
    if (this.group && this.group.users) {
      this.group.users = this.group.users.filter((member) => member.id !== memberId);
      this.successMessage = 'Member has been removed successfully.';
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    }
  }
}
