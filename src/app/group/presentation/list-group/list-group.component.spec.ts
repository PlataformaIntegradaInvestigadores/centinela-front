import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ListGroupComponent } from './list-group.component';
import { GroupService } from 'src/app/group/domain/entities/group.service';
import { GetGroupsService } from 'src/app/group/domain/services/getGroupsUser.service';
import { LoadingService } from 'src/app/group/domain/services/loadingService.service';

describe('ListGroupComponent', () => {
  let component: ListGroupComponent;
  let groupServiceSpy: jasmine.SpyObj<GroupService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    groupServiceSpy = jasmine.createSpyObj('GroupService', [
      'getGroups',
      'getUserById',
      'deleteGroup',
      'leaveGroup',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [ListGroupComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GroupService, useValue: groupServiceSpy },
        { provide: GetGroupsService, useValue: {} },
        { provide: Router, useValue: routerSpy },
        { provide: LoadingService, useValue: { loading$: of(false) } },
      ],
    });
    component = TestBed.createComponent(ListGroupComponent).componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads groups when a userId is stored', () => {
      localStorage.setItem('userId', 'u-1');
      groupServiceSpy.getGroups.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.userId).toBe('u-1');
      expect(groupServiceSpy.getGroups).toHaveBeenCalled();
    });

    it('does not load groups without a stored userId', () => {
      component.ngOnInit();
      expect(groupServiceSpy.getGroups).not.toHaveBeenCalled();
    });
  });

  describe('loadGroups', () => {
    it('joins each group with its owner name and updates the owner map', () => {
      component.userId = 'u-1';
      groupServiceSpy.getGroups.and.returnValue(
        of([{ id: 'g-1', admin_id: 'u-1' } as any, { id: 'g-2', admin_id: 'u-2' } as any]),
      );
      groupServiceSpy.getUserById.and.callFake((id: string) =>
        of({ first_name: 'A', last_name: id } as any),
      );

      component.loadGroups();

      expect(component.groups.length).toBe(2);
      expect(component.groups[0].owner).toBe('A u-1');
      expect(component.isOwnerMap['g-1']).toBeTrue();
      expect(component.isOwnerMap['g-2']).toBeFalse();
    });

    it('logs an error when fetching groups fails', () => {
      spyOn(console, 'error');
      groupServiceSpy.getGroups.and.returnValue(throwError(() => new Error('boom')));
      component.loadGroups();
      expect(console.error).toHaveBeenCalled();
    });

    it('logs an error when fetching an owner fails', () => {
      spyOn(console, 'error');
      groupServiceSpy.getGroups.and.returnValue(of([{ id: 'g-1', admin_id: 'u-1' } as any]));
      groupServiceSpy.getUserById.and.returnValue(throwError(() => new Error('boom')));
      component.loadGroups();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('navigateToGroup', () => {
    it('navigates when the modal is closed', () => {
      component.userId = 'u-1';
      component.modalOpen = false;
      component.navigateToGroup('g-1');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/u-1/my-groups/g-1/consensus']);
    });

    it('does not navigate while the modal is open', () => {
      component.modalOpen = true;
      component.navigateToGroup('g-1');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  it('onModalOpenChange updates modalOpen', () => {
    component.onModalOpenChange(true);
    expect(component.modalOpen).toBeTrue();
  });

  describe('onGroupDeleted / onGroupLeave', () => {
    beforeEach(() => {
      component.userId = 'u-1';
      component.groups = [
        { id: 'g-1', admin_id: 'u-1' } as any,
        { id: 'g-2', admin_id: 'u-2' } as any,
      ];
    });

    it('onGroupDeleted removes the group and refreshes the owner map', () => {
      component.onGroupDeleted('g-1');
      expect(component.groups.map((g) => g.id)).toEqual(['g-2']);
    });

    it('onGroupLeave removes the group and refreshes the owner map', () => {
      component.onGroupLeave('g-2');
      expect(component.groups.map((g) => g.id)).toEqual(['g-1']);
    });
  });

  describe('deleteGroup', () => {
    it('removes the group locally on success', () => {
      component.groups = [{ id: 'g-1' } as any];
      groupServiceSpy.deleteGroup.and.returnValue(of({}));
      component.deleteGroup('g-1');
      expect(component.groups.length).toBe(0);
    });

    it('logs an error on failure', () => {
      spyOn(console, 'error');
      groupServiceSpy.deleteGroup.and.returnValue(throwError(() => new Error('boom')));
      component.deleteGroup('g-1');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('leaveGroup', () => {
    it('removes the group locally on success', () => {
      component.groups = [{ id: 'g-1' } as any];
      groupServiceSpy.leaveGroup.and.returnValue(of({}));
      component.leaveGroup('g-1');
      expect(component.groups.length).toBe(0);
    });

    it('logs an error on failure', () => {
      spyOn(console, 'error');
      groupServiceSpy.leaveGroup.and.returnValue(throwError(() => new Error('boom')));
      component.leaveGroup('g-1');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
