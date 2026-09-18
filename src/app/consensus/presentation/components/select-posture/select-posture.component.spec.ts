import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SelectPostureComponent } from './select-posture.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserPostureService } from 'src/app/consensus/domain/services/user-posture.service';
import { DebateService } from 'src/app/consensus/domain/services/debate.service';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';
import { ConsensusService } from 'src/app/consensus/domain/services/GetGroupDataService.service';

describe('SelectPostureComponent', () => {
  let component: SelectPostureComponent;
  let fixture: ComponentFixture<SelectPostureComponent>;

  let authService: any;
  let postureService: any;
  let debateService: any;
  let debateStatisticsService: any;
  let consensusService: any;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getUserId']);
    authService.getUserId.and.returnValue('1');

    postureService = jasmine.createSpyObj('UserPostureService', [
      'getUserPosture',
      'updateUserPosture',
      'createUserPosture',
    ]);

    debateService = jasmine.createSpyObj('DebateService', [
      'triggerValidateDebateStatus',
      'closeDebate',
    ]);

    debateStatisticsService = jasmine.createSpyObj('DebateStatisticsService', [
      'sendDebateId',
    ]);

    consensusService = jasmine.createSpyObj('ConsensusService', ['getGroupById']);
    consensusService.getGroupById.and.returnValue(of({ admin_id: '1' }));

    postureService.getUserPosture.and.returnValue(of({ id: 1, posture: 'agree' }));

    TestBed.configureTestingModule({
      declarations: [SelectPostureComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserPostureService, useValue: postureService },
        { provide: DebateService, useValue: debateService },
        { provide: DebateStatisticsService, useValue: debateStatisticsService },
        { provide: ConsensusService, useValue: consensusService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(SelectPostureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check debate id and admin status on group input', () => {
    consensusService.getGroupById.and.returnValue(of({ admin_id: '1' }));
    component.groupIdInput = '123';
    expect(component.isAdmin).toBeTrue();
  });

  it('should not be admin when admin_id differs', () => {
    consensusService.getGroupById.and.returnValue(of({ admin_id: '2' }));
    component.debateIdInput = 5;
    component.groupIdInput = '123';
    expect(component.isAdmin).toBeFalse();
  });

  it('should error when group id missing in checkAdminStatus', () => {
    spyOn(console, 'error');
    component.groupId = '';
    component.checkAdminStatus();
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle checkAdminStatus error', () => {
    spyOn(console, 'error');
    consensusService.getGroupById.and.returnValue(throwError(() => new Error('e')));
    component.groupId = '123';
    component.checkAdminStatus();
    expect(component).toBeTruthy();
  });

  it('should checkDebateId when values present', () => {
    postureService.getUserPosture.and.returnValue(of({ id: 9, posture: 'agree' }));
    component.debateIdInput = 5;
    component.groupIdInput = '123';
    expect(component.existingPostureId).toBe(9);
  });

  it('should error in checkDebateId when values missing', () => {
    spyOn(console, 'error');
    component.debateIdInput = null;
    expect(component).toBeTruthy();
  });

  it('should find existing posture', () => {
    postureService.getUserPosture.and.returnValue(of({ id: 9, posture: 'agree' }));
    component.debateId = 5;
    component.checkExistingPosture();
    expect(component.existingPostureId).toBe(9);
  });

  it('should handle no existing posture', () => {
    postureService.getUserPosture.and.returnValue(throwError(() => new Error('404')));
    component.debateId = 5;
    component.checkExistingPosture();
    expect(component.existingPosture).toBeNull();
  });

  it('should trigger action', () => {
    component.onAction();
    expect(debateService.triggerValidateDebateStatus).toHaveBeenCalled();
  });

  it('should close debate and emit', () => {
    let closed = false;
    component.closeModal.subscribe(() => (closed = true));
    component.debateId = 5;
    component.groupId = '123';
    debateService.closeDebate.and.returnValue(of({ id: 5 }));
    component.closeDebate();
    expect(closed).toBeTrue();
    expect(debateService.triggerValidateDebateStatus).toHaveBeenCalled();
  });

  it('should not close debate without debateId', () => {
    spyOn(console, 'error');
    component.debateId = null;
    component.closeDebate();
    expect(debateService.closeDebate).not.toHaveBeenCalled();
  });

  it('should handle closeDebate error', () => {
    spyOn(console, 'error');
    component.debateId = 5;
    component.groupId = '123';
    debateService.closeDebate.and.returnValue(throwError(() => new Error('e')));
    component.closeDebate();
    expect(component).toBeTruthy();
  });

  it('should submit existing posture', () => {
    let emitted = false;
    component.postureSelected.subscribe(() => (emitted = true));
    component.selectedPosture = 'agree';
    component.existingPostureId = 5;
    postureService.updateUserPosture.and.returnValue(of({ id: 5, posture: 'agree' }));
    component.submitPosture();
    expect(emitted).toBeTrue();
    expect(component.showDiscussionPrompt).toBeTrue();
  });

  it('should submit new posture', () => {
    let emitted = false;
    component.postureSelected.subscribe(() => (emitted = true));
    component.selectedPosture = 'agree';
    component.existingPostureId = null;
    postureService.createUserPosture.and.returnValue(of({ id: 7, posture: 'agree' }));
    component.submitPosture();
    expect(emitted).toBeTrue();
    expect(component.showDiscussionPrompt).toBeTrue();
  });

  it('should close discussion prompt', () => {
    component.showDiscussionPrompt = true;
    component.closeDiscussionPrompt();
    expect(component.showDiscussionPrompt).toBeFalse();
  });

  it('should update posture', () => {
    let closed = false;
    let emitted = false;
    component.closeModal.subscribe(() => (closed = true));
    component.postureSelected.subscribe(() => (emitted = true));
    component.existingPostureId = 5;
    component.selectedPosture = 'agree';
    postureService.updateUserPosture.and.returnValue(of({ id: 5, posture: 'agree' }));
    component.updatePosture();
    expect(closed).toBeTrue();
    expect(emitted).toBeTrue();
    expect(debateStatisticsService.sendDebateId).toHaveBeenCalled();
  });

  it('should not update posture without existing id', () => {
    spyOn(console, 'error');
    component.existingPostureId = null;
    component.updatePosture();
    expect(console.error).toHaveBeenCalled();
  });

  it('should open update posture view', () => {
    component.openUpdatePosture();
    expect(component.isModalOpenPostureSelection).toBeTrue();
    expect(component.isModalOpenExistingPosture).toBeFalse();
  });

  it('should open chat modal and emit', () => {
    let opened = false;
    component.openChat.subscribe(() => (opened = true));
    component.debateId = 5;
    component.groupId = '123';
    component.openChatModal();
    expect(opened).toBeTrue();
    expect(component.showDiscussionPrompt).toBeFalse();
  });

  it('should not open chat modal without values', () => {
    spyOn(console, 'error');
    component.debateId = null;
    component.groupId = '';
    component.openChatModal();
    expect(component).toBeTruthy();
  });

  it('should set existing posture', () => {
    let emitted = false;
    component.postureSelected.subscribe(() => (emitted = true));
    component.existingPostureId = 5;
    component.existingPosture = null;
    postureService.updateUserPosture.and.returnValue(of({ id: 5, posture: 'agree' }));
    component.setPosture('agree');
    expect(emitted).toBeTrue();
    expect(debateStatisticsService.sendDebateId).toHaveBeenCalled();
  });

  it('should set new posture', () => {
    let emitted = false;
    component.postureSelected.subscribe(() => (emitted = true));
    component.existingPostureId = null;
    postureService.createUserPosture.and.returnValue(of({ id: 8, posture: 'neutral' }));
    component.setPosture('neutral');
    expect(emitted).toBeTrue();
    expect(component.existingPosture).toBeDefined();
  });

  it('should trigger send debate id', () => {
    component.debateId = 5;
    component.triggerSendDebateId();
    expect(debateStatisticsService.sendDebateId).toHaveBeenCalledWith(5);
  });

  it('should error when debate id null on triggerSendDebateId', () => {
    spyOn(console, 'error');
    component.debateId = null;
    component.triggerSendDebateId();
    expect(console.error).toHaveBeenCalled();
  });
});
