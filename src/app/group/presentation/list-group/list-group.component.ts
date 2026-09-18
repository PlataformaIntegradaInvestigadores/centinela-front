import { AfterViewInit, Component, OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { Router } from '@angular/router';
import { Group } from '../../domain/entities/group.interface';
import { GetGroupsService } from '../../domain/services/getGroupsUser.service';
import { LoadingService } from '../../domain/services/loadingService.service';
import { GroupService } from '../../domain/entities/group.service';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'list-group',
  templateUrl: './list-group.component.html',
  styleUrls: ['./list-group.component.css'],
})
export class ListGroupComponent implements AfterViewInit, OnInit {
  userId: string | null = null;
  groups: Group[] = [];
  modalOpen: boolean = false;
  isOwnerMap: { [key: string]: boolean } = {};
  loading$ = this.loadingService.loading$;

  constructor(
    private groupService: GroupService,
    private getGroupService: GetGroupsService,
    private router: Router,
    private loadingService: LoadingService,
  ) {}

  ngAfterViewInit(): void {
    initFlowbite();
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');
    if (this.userId) {
      this.loadGroups();
    }
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        const groupRequests = groups.map((group) =>
          this.groupService.getUserById(group.admin_id).pipe(
            map((user) => ({
              ...group,
              owner: `${user.first_name} ${user.last_name}`,
              phase: '1/3',
            })),
          ),
        );

        forkJoin(groupRequests).subscribe(
          (groupsWithOwners) => {
            this.groups = groupsWithOwners;
            this.updateIsOwnerMap();
          },
          (error) => console.error('Error fetching group owners:', error),
        );
      },
      error: (error) => console.error('Error fetching groups:', error),
    });
  }

  updateIsOwnerMap(): void {
    if (this.userId) {
      this.groups.forEach((group) => {
        this.isOwnerMap[group.id] = this.userId === group.admin_id;
        //console.log(`Group ID: ${group.id},Auth ID: ${this.userId}, Admin ID: ${group.admin_id}, isOwner: ${this.isOwnerMap[group.id]}`);
      });
    }
  }

  navigateToGroup(groupId: string): void {
    if (!this.modalOpen) {
      //console.log(`Navigating to group DEPURARION: ${groupId}`); // Añadido para depuración
      this.router.navigate([`/profile/${this.userId}/my-groups/${groupId}/consensus`]);
    }
  }

  onModalOpenChange(open: boolean) {
    this.modalOpen = open;
  }

  onGroupDeleted(groupId: string) {
    this.groups = this.groups.filter((group) => group.id !== groupId);
    this.updateIsOwnerMap();
  }

  onGroupLeave(groupId: string) {
    this.groups = this.groups.filter((group) => group.id !== groupId);
    this.updateIsOwnerMap();
  }

  deleteGroup(groupId: string) {
    this.groupService.deleteGroup(groupId).subscribe(
      () => {
        this.onGroupDeleted(groupId); // Actualizar la lista localmente
      },
      (error) => {
        console.error('Error deleting group', error);
      },
    );
  }

  leaveGroup(groupId: string) {
    this.groupService.leaveGroup(groupId).subscribe(
      () => {
        //console.log('Left the group');
        this.onGroupLeave(groupId); // Actualizar la lista localmente
      },
      (error) => {
        console.error('Error leaving group', error);
      },
    );
  }
}
