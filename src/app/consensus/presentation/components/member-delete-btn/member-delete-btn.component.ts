import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { ConsensusService } from 'src/app/consensus/domain/services/GetGroupDataService.service';
import { UserG } from 'src/app/group/domain/entities/user.interface';

@Component({
  selector: 'member-delete-btn',
  templateUrl: './member-delete-btn.component.html',
  styleUrls: ['./member-delete-btn.component.css'],
})
export class MemberDeleteBtnComponent implements OnInit {
  @Input() member: UserG | null = null;
  groupId: string | null = null;
  @Output() memberDeleted = new EventEmitter<string>(); // Emitir el ID del miembro eliminado
  showModal: boolean = false;

  constructor(
    private consensusService: ConsensusService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    initFlowbite();
    this.groupId = this.activatedRoute.snapshot.paramMap.get('groupId');
  }

  openModal(): void {
    // const modal = document.getElementById(`deleteModal-${this.member?.id}`);
    // if (modal) {
    //   modal.classList.remove('hidden');
    // }
    this.showModal = true;
  }

  closeModal(): void {
    // const modal = document.getElementById(`deleteModal-${this.member?.id}`);
    // if (modal) {
    //   modal.classList.add('hidden');
    // }
    this.showModal = false;
  }

  deleteMember(): void {
    if (this.groupId && this.member?.id) {
      this.consensusService.removeMember(this.groupId, this.member.id).subscribe(
        () => {
          this.memberDeleted.emit(this.member?.id ?? ''); // Emitir el evento con un valor predeterminado
          this.closeModal();
        },
        (error) => {
          // Maneja los errores
          console.error('Error removing member:', error);
        },
      );
    }
  }
}
