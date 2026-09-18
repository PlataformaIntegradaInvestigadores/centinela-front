import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

@Component({
  selector: 'admin-options',
  templateUrl: './admin-options.component.html',
  styleUrls: ['./admin-options.component.css'],
  standalone: true,
  imports: [MatExpansionModule, CommonModule],
})
export class AdminOptionsComponent implements OnInit {
  panelOpenState: boolean;
  showModal: boolean = false;
  @Input() userId: string | null = null;
  @Input() idOwnerGroup: string = '';
  @Input() groupId: string | null = null;
  private authenticatedUserId: string | null = null;
  showOptions: boolean = false;

  constructor(
    private authService: AuthService,
    private topicService: TopicService,
  ) {
    this.panelOpenState = false;
  }

  ngOnInit(): void {
    this.authenticatedUserId = this.authService.getUserId();
    this.updateShowOptions();
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.panelOpenState = false;
  }

  cancelRepeatWorkshop(): void {
    this.closeModal();
  }

  confirmRepeatWorkshop(): void {
    this.closeModal();
    this.topicService.changeUserPhase(this.groupId!, 0).subscribe(
      () => {},
      (error) => {
        console.error('Error: ', error);
      },
    );
  }

  updateShowOptions(): void {
    this.showOptions = this.authenticatedUserId === this.idOwnerGroup;
  }
}
