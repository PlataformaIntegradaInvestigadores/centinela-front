import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';
import { GroupCreateModalComponent } from './group-create-modal.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { GroupService } from 'src/app/group/domain/entities/group.service';

describe('GroupCreateModalComponent', () => {
  let component: GroupCreateModalComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let groupServiceSpy: jasmine.SpyObj<GroupService>;

  const users = [
    { id: '1', first_name: 'Ana', last_name: 'Perez' },
    { id: '2', first_name: 'Bob', last_name: 'Diaz' },
  ] as any[];

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsers']);
    groupServiceSpy = jasmine.createSpyObj('GroupService', ['createGroup']);
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUsers.and.returnValue(of(users));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [GroupCreateModalComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: GroupService, useValue: groupServiceSpy },
        { provide: TopicService, useValue: {} },
      ],
    });
    component = TestBed.createComponent(GroupCreateModalComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadUsers', () => {
    it('loads users when logged in and wires the search control', () => {
      component.ngOnInit();
      expect(component.users.length).toBe(2);
      component.groupForm.get('userSearch')?.setValue('ana');
      expect(component.searchQuery).toBe('ana');
      expect(component.filteredUsers.length).toBe(1);
    });

    it('clears users when not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      component.loadUsers();
      expect(component.users).toEqual([]);
      expect(component.filteredUsers).toEqual([]);
      expect(authServiceSpy.getUsers).not.toHaveBeenCalled();
    });

    it('clears users on a getUsers error', () => {
      authServiceSpy.getUsers.and.returnValue(throwError(() => new Error('boom')));
      component.loadUsers();
      expect(component.users).toEqual([]);
      expect(component.filteredUsers).toEqual([]);
    });
  });

  describe('filterUsers', () => {
    beforeEach(() => component.loadUsers());

    it('filters by name, case-insensitively', () => {
      component.searchQuery = 'BOB';
      component.filterUsers();
      expect(component.filteredUsers.map((u) => u.id)).toEqual(['2']);
    });

    it('excludes already-selected users', () => {
      component.selectedUsers = [users[0]];
      component.searchQuery = '';
      component.filterUsers();
      expect(component.filteredUsers.map((u) => u.id)).toEqual(['2']);
    });
  });

  describe('onUserSelect / removeUser', () => {
    beforeEach(() => component.loadUsers());

    it('adds a user once and clears the search field', () => {
      component.groupForm.get('userSearch')?.setValue('ana');
      component.onUserSelect(users[0]);
      component.onUserSelect(users[0]);
      expect(component.selectedUsers.length).toBe(1);
      expect(component.groupForm.get('userSearch')?.value).toBe('');
    });

    it('removes a selected user and refreshes the filtered list', () => {
      component.selectedUsers = [users[0]];
      component.removeUser(users[0]);
      expect(component.selectedUsers.length).toBe(0);
      expect(component.filteredUsers.map((u) => u.id)).toContain('1');
    });
  });

  describe('confirmation modal', () => {
    it('openConfirmationModal only opens when form is valid and a user is selected', () => {
      component.openConfirmationModal();
      expect(component.isConfirmationModalOpen).toBeFalse();

      component.groupForm.setValue({ title: 'T', description: 'D', userSearch: '' });
      component.selectedUsers = [users[0]];
      component.openConfirmationModal();
      expect(component.isConfirmationModalOpen).toBeTrue();
    });

    it('closeConfirmationModal closes it', () => {
      component.isConfirmationModalOpen = true;
      component.closeConfirmationModal();
      expect(component.isConfirmationModalOpen).toBeFalse();
    });
  });

  // confirmCreateGroup's success branch calls window.location.reload()
  // synchronously; real headless Chrome refuses to let tests stub
  // location/reload (non-configurable, non-writable in this Chrome build),
  // so success-path tests stub createGroup with a Subject that's never
  // next()'d, exercising payload-building without ever reaching reload().
  describe('confirmCreateGroup', () => {
    it('does nothing for an invalid form', () => {
      component.confirmCreateGroup();
      expect(groupServiceSpy.createGroup).not.toHaveBeenCalled();
    });

    it('creates the group with the built payload for selected users', () => {
      component.groupForm.setValue({ title: 'T', description: 'D', userSearch: '' });
      component.selectedUsers = [users[0]];
      groupServiceSpy.createGroup.and.returnValue(new Subject());

      component.confirmCreateGroup();

      const payload = groupServiceSpy.createGroup.calls.mostRecent().args[0] as any;
      expect(payload.title).toBe('T');
      expect(payload.users).toEqual(['1']);
    });

    it('omits users when none are selected', () => {
      component.groupForm.setValue({ title: 'T', description: 'D', userSearch: '' });
      groupServiceSpy.createGroup.and.returnValue(new Subject());
      component.confirmCreateGroup();
      const payload = groupServiceSpy.createGroup.calls.mostRecent().args[0] as any;
      expect(payload.users).toBeUndefined();
    });

    it('logs an error on failure', () => {
      spyOn(console, 'error');
      component.groupForm.setValue({ title: 'T', description: 'D', userSearch: '' });
      groupServiceSpy.createGroup.and.returnValue(throwError(() => new Error('boom')));
      component.confirmCreateGroup();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('closeModal emits closeModalRequested', () => {
    let emitted = false;
    component.closeModalRequested.subscribe(() => (emitted = true));
    component.closeModal();
    expect(emitted).toBeTrue();
  });

  it('getControl returns the named form control', () => {
    expect(component.getControl('title')).toBe(component.groupForm.get('title'));
  });

  it('capitalizeInput capitalizes the first character', () => {
    const input = document.createElement('input');
    input.value = 'hello world';
    component.capitalizeInput({ target: input } as unknown as Event);
    expect(input.value).toBe('Hello world');
  });
});
