import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MembersConsensusComponent } from './members-consensus.component';
import { Group } from 'src/app/group/domain/entities/group.interface';
import { UserG } from 'src/app/group/domain/entities/user.interface';

describe('MembersConsensusComponent', () => {
  let component: MembersConsensusComponent;
  let fixture: ComponentFixture<MembersConsensusComponent>;

  const makeUser = (id: string): UserG => ({
    id,
    first_name: 'A',
    last_name: 'B',
    email_institution: 'a@b.com',
    username: 'a@b.com',
    profile_picture: '',
    institution: 'X',
  });

  const makeGroup = (users: UserG[], adminId = 'admin-1'): Group => ({
    id: 'g-1',
    title: 'T',
    description: 'D',
    admin_id: adminId,
    users,
    voting_type: 'majority',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MembersConsensusComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(MembersConsensusComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit does not throw', () => {
    expect(() => component.ngOnInit()).not.toThrow();
  });

  describe('ngOnChanges', () => {
    it('selects the first user and sets idOwnerGroup when group changes', () => {
      component.group = makeGroup([makeUser('u1'), makeUser('u2')]);
      component.ngOnChanges({
        group: { currentValue: component.group, previousValue: null, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(component.selectedUser?.id).toBe('u1');
      expect(component.idOwnerGroup).toBe('admin-1');
    });

    it('does nothing when group is not part of the changes', () => {
      component.group = makeGroup([makeUser('u1')]);
      component.ngOnChanges({} as any);
      expect(component.selectedUser).toBeNull();
      expect(component.idOwnerGroup).toBeNull();
    });

    it('falls back to null idOwnerGroup when group is null', () => {
      component.group = null;
      component.ngOnChanges({
        group: { currentValue: null, previousValue: null, firstChange: true, isFirstChange: () => true },
      } as any);
      expect(component.idOwnerGroup).toBeNull();
    });
  });

  describe('selectUser', () => {
    it('sets selectedUser to null when group is null', () => {
      component.group = null;
      component.selectUser();
      expect(component.selectedUser).toBeNull();
    });

    it('sets selectedUser to null when group has no users array', () => {
      component.group = { ...makeGroup([]), users: undefined as any };
      component.selectUser();
      expect(component.selectedUser).toBeNull();
    });

    it('sets selectedUser to the first user when users exist', () => {
      const first = makeUser('u1');
      component.group = makeGroup([first, makeUser('u2')]);
      component.selectUser();
      expect(component.selectedUser).toBe(first);
    });
  });

  describe('onMemberDeleted', () => {
    it('does nothing when group is null', () => {
      component.group = null;
      component.onMemberDeleted('u1');
      expect(component.successMessage).toBeNull();
    });

    it('does nothing when group has no users array', () => {
      component.group = { ...makeGroup([]), users: undefined as any };
      component.onMemberDeleted('u1');
      expect(component.successMessage).toBeNull();
    });

    it('filters the member out, sets a success message, and clears it after 3s', fakeAsync(() => {
      component.group = makeGroup([makeUser('u1'), makeUser('u2')]);
      component.onMemberDeleted('u1');
      expect(component.group.users.map((u) => u.id)).toEqual(['u2']);
      expect(component.successMessage).toBe('Member has been removed successfully.');
      tick(3000);
      expect(component.successMessage).toBeNull();
    }));
  });
});
