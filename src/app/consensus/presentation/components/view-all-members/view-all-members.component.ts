import { Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { UserG } from 'src/app/group/domain/entities/user.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'view-all-members',
  templateUrl: './view-all-members.component.html',
  styleUrls: ['./view-all-members.component.css'],
})
export class ViewAllMembersComponent implements OnInit {
  @Input() members: UserG[] | null = [];
  @Input() idOwnerGroup: string | null = null;
  @Output() memberDeleted = new EventEmitter<string>();
  private routerSubscription: Subscription | undefined;

  constructor(
    private renderer: Renderer2,
    private router: Router,
  ) {}

  ngOnInit(): void {
    initFlowbite();
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeModal();
      }
    });
  }

  onMemberDeleted(memberId: string): void {
    if (this.members) {
      this.members = this.members.filter((member) => member.id !== memberId);
    }
  }

  openModal(): void {
    const modal = document.getElementById('memberListModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  closeModal(): void {
    const modal = document.getElementById('memberListModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
}
