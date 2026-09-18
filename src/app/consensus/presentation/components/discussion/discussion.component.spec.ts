import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { DiscussionComponent } from './discussion.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DebateChatService } from 'src/app/consensus/domain/services/debate-chat.service';
import { ReactionService } from 'src/app/consensus/domain/services/reaction.service';
import { UserPostureService } from 'src/app/consensus/domain/services/user-posture.service';

describe('DiscussionComponent', () => {
  let component: DiscussionComponent;
  let fixture: ComponentFixture<DiscussionComponent>;

  let chatService: any;
  let reactionService: any;
  let userPostureService: any;
  let messagesSubject: Subject<any>;

  function setToken(): void {
    const payload = btoa(JSON.stringify({ username: 'bob' }));
    localStorage.setItem('accessToken', `header.${payload}.sig`);
  }

  beforeEach(() => {
    setToken();
    messagesSubject = new Subject<any>();

    chatService = jasmine.createSpyObj('DebateChatService', [
      'connect',
      'getMessages',
      'sendMessage',
      'getMessageHistory',
      'disconnect',
    ]);
    chatService.getMessages.and.returnValue(messagesSubject.asObservable());
    chatService.getMessageHistory.and.returnValue(of([]));

    reactionService = jasmine.createSpyObj('ReactionService', ['addReaction']);
    reactionService.addReaction.and.returnValue(of({ ok: true }));

    userPostureService = jasmine.createSpyObj('UserPostureService', [
      'getUserPostureByDebate',
    ]);
    userPostureService.getUserPostureByDebate.and.returnValue(of({ posture: 'agree' }));

    TestBed.configureTestingModule({
      declarations: [DiscussionComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: DebateChatService, useValue: chatService },
        { provide: ReactionService, useValue: reactionService },
        { provide: UserPostureService, useValue: userPostureService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(DiscussionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize on ngOnInit when debateId present', () => {
    userPostureService.getUserPostureByDebate.and.returnValue(of({ posture: 'agree' }));
    chatService.getMessageHistory.and.returnValue(of([]));
    component.debateIdInput = 5;
    component.groupIdInput = '123';
    component.ngOnInit();
    expect(component.currentUser).toBe('bob');
    expect(chatService.connect).toHaveBeenCalled();
  });

  it('should error when debateId missing on ngOnInit', () => {
    spyOn(console, 'error');
    component.debateIdInput = undefined as any;
    component.ngOnInit();
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle ngOnChanges without debateId change', () => {
    component.ngOnChanges({} as any);
    expect(component).toBeTruthy();
  });

  it('should add messages and replies from websocket', () => {
    component.debateIdInput = 5;
    component.groupIdInput = '123';
    component.ngOnInit();
    component.messages = [{ id: 1, replies: [] }] as any;
    messagesSubject.next({ id: 2, text: 'hi' });
    messagesSubject.next({ id: 3, parent: 1, text: 'reply' });
    expect(component.messages.length).toBe(2);
  });

  it('should initialize current user without token', () => {
    spyOn(console, 'error');
    localStorage.removeItem('accessToken');
    (component as any).initializeCurrentUser();
    expect(console.error).toHaveBeenCalled();
  });

  it('should fetch user posture', () => {
    userPostureService.getUserPostureByDebate.and.returnValue(of({ posture: 'agree' }));
    component.debateIdInput = 5;
    (component as any).fetchUserPosture();
    expect(component.userPosture).toBe('agree');
  });

  it('should default posture on fetch error', () => {
    spyOn(console, 'error');
    userPostureService.getUserPostureByDebate.and.returnValue(throwError(() => new Error('e')));
    component.debateIdInput = 5;
    (component as any).fetchUserPosture();
    expect(component.userPosture).toBe('neutral');
  });

  it('should load message history', () => {
    chatService.getMessageHistory.and.returnValue(
      of([{ user: 'a', created_at: '2020-01-01', replies: [] }]),
    );
    component.debateIdInput = 5;
    (component as any).loadMessageHistory();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].timestamp).toBeDefined();
  });

  it('should handle loadMessageHistory with no debateId', () => {
    spyOn(console, 'error');
    component.debateIdInput = undefined as any;
    (component as any).loadMessageHistory();
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle loadMessageHistory error', () => {
    spyOn(console, 'error');
    chatService.getMessageHistory.and.returnValue(throwError(() => new Error('e')));
    component.debateIdInput = 5;
    (component as any).loadMessageHistory();
    expect(component.messages).toEqual([]);
  });

  it('should send a normal message', () => {
    component.newMessage = 'hello';
    component.userPosture = 'agree';
    component.containsBadWords = false;
    component.sendMessage();
    expect(chatService.sendMessage).toHaveBeenCalled();
    expect(component.newMessage).toBe('');
  });

  it('should block message with bad words', () => {
    spyOn(window, 'alert');
    component.containsBadWords = true;
    component.newMessage = 'bad';
    component.sendMessage();
    expect(window.alert).toHaveBeenCalled();
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should detect message changes', () => {
    component.newMessage = 'hello';
    component.onMessageChange();
    expect(component.containsBadWords).toBeFalse();
    component.newMessage = '';
    component.onMessageChange();
    expect(component.containsBadWords).toBeFalse();
  });

  it('should format messages and detect links', () => {
    const result = component.formatMessage('see https://example.com now');
    expect(result).toBeDefined();
    expect((component as any).detectLinks('http://x.com')).toContain('<a');
  });

  it('should get parent message text', () => {
    component.messages = [{ id: 1, text: 'hi' }] as any;
    component.currentParentId = 1;
    expect(component.getParentMessageText()).toBe('hi');
    component.currentParentId = 99;
    expect(component.getParentMessageText()).toBe('Mensaje');
    component.currentParentId = null;
    expect(component.getParentMessageText()).toBe('');
  });

  it('should reply to a message', () => {
    component.replyToMessage(7);
    expect(component.currentParentId).toBe(7);
  });

  it('should add a reaction', () => {
    component.addReaction(1);
    expect(reactionService.addReaction).toHaveBeenCalledWith({ message: 1 });
  });

  it('should close the modal', () => {
    let closed = false;
    component.closeChat.subscribe(() => (closed = true));
    component.closeModal();
    expect(closed).toBeTrue();
  });

  it('should assign and retrieve user colors', () => {
    (component as any).assignColorToUser('bob');
    const first = component.getUserColor('bob');
    expect(first).toContain('hsl');
    (component as any).assignColorToUser('bob');
    component.getUserColor('unknown');
    expect(component.getUserColor('unknown')).toBe('#000000');
  });

  it('should unsubscribe on destroy', () => {
    component.debateIdInput = 5;
    component.groupIdInput = '123';
    component.ngOnInit();
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });
});
