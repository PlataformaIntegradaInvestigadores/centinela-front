import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserG } from 'src/app/group/domain/entities/user.interface';

@Component({
  selector: 'member-item',
  templateUrl: './member-item.component.html',
  styleUrls: ['./member-item.component.css'],
})
export class MemberItemComponent implements OnInit {
  @Input() member: UserG | null = null;
  @Input() idOwnerGroup: string | null = null;
  @Input() showDeleteButton: boolean = false;
  @Output() memberDeleted = new EventEmitter<string>();
  private authenticatedUserId: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    initFlowbite();
    this.authenticatedUserId = this.authService.getUserId();
    if (this.showDeleteButton) {
      this.updateShowDeleteButton();
    }
  }

  private updateShowDeleteButton(): void {
    if (this.member && this.authenticatedUserId) {
      if (this.idOwnerGroup == this.authenticatedUserId) {
        this.showDeleteButton =
          !(this.member.id === this.authenticatedUserId) &&
          this.idOwnerGroup == this.authenticatedUserId;
      } else {
        this.showDeleteButton =
          this.member.id === this.authenticatedUserId &&
          this.idOwnerGroup == this.authenticatedUserId;
      }
    }
    //console.log('Authenticated: ', this.authenticatedUserId, 'Member: ', this.member?.id, 'Owner: ', this.idOwnerGroup, 'Show: ', this.showDeleteButton);
  }

  onMemberDeleted(memberId: string): void {
    this.memberDeleted.emit(memberId);
  }
}
