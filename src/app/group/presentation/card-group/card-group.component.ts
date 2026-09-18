import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Group } from '../../domain/entities/group.interface';
import { ModalService } from '../../domain/services/modalService.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

@Component({
  selector: 'card-group',
  templateUrl: './card-group.component.html',
  styleUrls: ['./card-group.component.css'],
})
export class CardGroupComponent implements OnChanges {
  @Input() group: Group | undefined;
  @Input() isOwner: boolean = false;
  @Output() navigate = new EventEmitter<Group>();
  @Output() groupDeleted = new EventEmitter<string>();
  @Output() groupLeaveed = new EventEmitter<string>();
  modalOpen: boolean = false;

  currentPhase: string | null = null;

  constructor(
    private router: Router,
    private modalService: ModalService,
    private topicService: TopicService,
  ) {
    this.modalService.modalOpen$.subscribe((isOpen) => (this.modalOpen = isOpen));
  }

  ngOnChanges(): void {
    if (this.group) {
      this.getCurrentPhase(this.group.id);
    }
  }

  getCurrentPhase(groupId: string): void {
    this.topicService.getUserCurrentPhase(groupId).subscribe(
      (response) => {
        this.currentPhase = this.transformPhase(response.phase);
      },
      (error) => {
        console.error('Error fetching current phase:', error);
      },
    );
  }

  transformPhase(phase: number): string {
    switch (phase) {
      case 0:
        return '1 of 3';
      case 1:
        return '2 of 3';
      case 2:
        return '3 of 3 complete';
      default:
        return 'Unknown phase';
    }
  }

  onNavigate() {
    if (this.group && !this.modalOpen) {
      this.navigate.emit(this.group);
    }
  }

  onGroupDeleted(groupId: string) {
    this.groupDeleted.emit(groupId);
  }

  onGroupLeaveed(groupId: string) {
    this.groupLeaveed.emit(groupId);
  }
}
