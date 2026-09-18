// group-create-modal.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { GroupService } from 'src/app/group/domain/entities/group.service';
import { User } from 'src/app/group/presentation/user.interface'; // Import the User interface

@Component({
  selector: 'app-group-create-modal',
  templateUrl: './group-create-modal.component.html',
  styleUrls: ['./group-create-modal.component.css'],
})
export class GroupCreateModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModalRequested = new EventEmitter<void>();
  groupForm: FormGroup;
  users: User[] = []; // Use the User interface
  filteredUsers: User[] = []; // Use the User interface
  selectedUsers: User[] = []; // Use the User interface
  searchQuery: string = '';
  isConfirmationModalOpen = false; // Track the state of the confirmation modal

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService,
    private authService: AuthService,
    private topicService: TopicService,
  ) {
    this.groupForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      userSearch: [''],
    });
  }

  ngOnInit() {
    this.loadUsers();
    const userSearchControl = this.groupForm.get('userSearch');
    if (userSearchControl) {
      userSearchControl.valueChanges.subscribe((value) => {
        this.searchQuery = value;
        this.filterUsers();
      });
    }
  }

  loadUsers() {
    if (!this.authService.isLoggedIn()) {
      this.users = [];
      this.filteredUsers = [];
      return;
    }
    this.authService.getUsers().subscribe(
      (users: User[]) => {
        // Use the User interface
        this.users = users;
        this.filteredUsers = users;
      },
      () => {
        this.users = [];
        this.filteredUsers = [];
      },
    );
  }

  filterUsers() {
    const filterValue = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(
      (user) =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(filterValue) &&
        !this.selectedUsers.includes(user),
    );
  }

  onUserSelect(user: User) {
    // Use the User interface
    if (!this.selectedUsers.includes(user)) {
      this.selectedUsers.push(user);
      const userSearchControl = this.groupForm.get('userSearch');
      if (userSearchControl) {
        userSearchControl.setValue('');
      }
      this.filterUsers();
    }
  }

  removeUser(user: User) {
    // Use the User interface
    this.selectedUsers = this.selectedUsers.filter((u) => u !== user);
    this.filterUsers();
  }

  openConfirmationModal() {
    if (this.groupForm.valid && this.selectedUsers.length > 0) {
      this.isConfirmationModalOpen = true;
    }
  }

  closeConfirmationModal() {
    this.isConfirmationModalOpen = false;
  }

  confirmCreateGroup() {
    if (this.groupForm.valid) {
      const groupData: { title: string; description: string; users?: string[] } = {
        title: this.groupForm.get('title')?.value,
        description: this.groupForm.get('description')?.value,
        // voting_type: this.groupForm.get('algorithm')?.value,
      };
      if (this.selectedUsers.length > 0) {
        groupData.users = this.selectedUsers.map((user) => user.id);
      }

      this.groupService.createGroup(groupData).subscribe(
        () => {
          window.location.reload();
        },
        (error) => {
          console.error('Error creating group', error);
        },
      );
    }
  }

  closeModal() {
    this.closeModalRequested.emit();
  }

  getControl(controlName: string) {
    return this.groupForm.get(controlName);
  }

  capitalizeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.charAt(0).toUpperCase() + input.value.slice(1);
  }
}
