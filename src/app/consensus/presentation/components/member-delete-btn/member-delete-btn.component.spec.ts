import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';

import { MemberDeleteBtnComponent } from './member-delete-btn.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConsensusService } from 'src/app/consensus/domain/services/GetGroupDataService.service';
import { UserG } from 'src/app/group/domain/entities/user.interface';

describe('MemberDeleteBtnComponent', () => {
  let component: MemberDeleteBtnComponent;
  let fixture: ComponentFixture<MemberDeleteBtnComponent>;
  let consensusServiceSpy: jasmine.SpyObj<ConsensusService>;

  const makeMember = (id: string): UserG => ({
    id,
    first_name: 'A',
    last_name: 'B',
    email_institution: 'a@b.com',
    username: 'a@b.com',
    profile_picture: '',
    institution: 'X',
  });

  function configure(groupIdParam: string | null): void {
    TestBed.resetTestingModule();
    consensusServiceSpy = jasmine.createSpyObj('ConsensusService', ['removeMember']);

    TestBed.configureTestingModule({
      declarations: [MemberDeleteBtnComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: ConsensusService, useValue: consensusServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => groupIdParam } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(MemberDeleteBtnComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => configure('g-1'));

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('reads the groupId route param on init', () => {
    fixture.detectChanges();
    expect(component.groupId).toBe('g-1');
  });

  it('openModal/closeModal toggle showModal', () => {
    fixture.detectChanges();
    component.openModal();
    expect(component.showModal).toBeTrue();
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });

  describe('deleteMember', () => {
    it('does nothing when groupId is missing', () => {
      configure(null);
      fixture.detectChanges();
      component.member = makeMember('m-1');
      component.deleteMember();
      expect(consensusServiceSpy.removeMember).not.toHaveBeenCalled();
    });

    it('does nothing when member is null', () => {
      fixture.detectChanges();
      component.member = null;
      component.deleteMember();
      expect(consensusServiceSpy.removeMember).not.toHaveBeenCalled();
    });

    it('emits memberDeleted and closes the modal on success', () => {
      fixture.detectChanges();
      component.member = makeMember('m-1');
      component.showModal = true;
      consensusServiceSpy.removeMember.and.returnValue(of(null));
      const emitted: string[] = [];
      component.memberDeleted.subscribe((id) => emitted.push(id));

      component.deleteMember();

      expect(consensusServiceSpy.removeMember).toHaveBeenCalledWith('g-1', 'm-1');
      expect(emitted).toEqual(['m-1']);
      expect(component.showModal).toBeFalse();
    });

    it('logs an error and does not emit when the service call fails', () => {
      spyOn(console, 'error');
      fixture.detectChanges();
      component.member = makeMember('m-1');
      consensusServiceSpy.removeMember.and.returnValue(throwError(() => new Error('boom')));
      const emitted: string[] = [];
      component.memberDeleted.subscribe((id) => emitted.push(id));

      component.deleteMember();

      expect(console.error).toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });

    it('does not emit while the removal call is still pending', () => {
      fixture.detectChanges();
      component.member = makeMember('m-1');
      consensusServiceSpy.removeMember.and.returnValue(new Subject());
      const emitted: string[] = [];
      component.memberDeleted.subscribe((id) => emitted.push(id));

      component.deleteMember();

      expect(emitted).toEqual([]);
    });
  });
});
