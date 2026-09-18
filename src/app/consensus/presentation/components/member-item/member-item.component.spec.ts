import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberItemComponent } from './member-item.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserG } from 'src/app/group/domain/entities/user.interface';

describe('MemberItemComponent', () => {
  let component: MemberItemComponent;
  let fixture: ComponentFixture<MemberItemComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const makeMember = (id: string): UserG => ({
    id,
    first_name: 'A',
    last_name: 'B',
    email_institution: 'a@b.com',
    username: 'a@b.com',
    profile_picture: '',
    institution: 'X',
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(MemberItemComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    authServiceSpy.getUserId.and.returnValue(null);

    TestBed.configureTestingModule({
      declarations: [MemberItemComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    createComponent();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('does not recompute showDeleteButton when it starts false', () => {
    component.showDeleteButton = false;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeFalse();
  });

  it('leaves showDeleteButton unchanged when member is null', () => {
    component.member = null;
    component.showDeleteButton = true;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeTrue();
  });

  it('leaves showDeleteButton unchanged when there is no authenticated user', () => {
    authServiceSpy.getUserId.and.returnValue(null);
    component.member = makeMember('m-1');
    component.showDeleteButton = true;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeTrue();
  });

  it('hides the delete button when the owner views their own row', () => {
    authServiceSpy.getUserId.and.returnValue('owner-1');
    component.member = makeMember('owner-1');
    component.idOwnerGroup = 'owner-1';
    component.showDeleteButton = true;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeFalse();
  });

  it('shows the delete button when the owner views another member', () => {
    authServiceSpy.getUserId.and.returnValue('owner-1');
    component.member = makeMember('other-1');
    component.idOwnerGroup = 'owner-1';
    component.showDeleteButton = true;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeTrue();
  });

  it('hides the delete button for a non-owner viewing their own row', () => {
    authServiceSpy.getUserId.and.returnValue('self-1');
    component.member = makeMember('self-1');
    component.idOwnerGroup = 'someone-else';
    component.showDeleteButton = true;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeFalse();
  });

  it('hides the delete button for a non-owner viewing another member', () => {
    authServiceSpy.getUserId.and.returnValue('self-1');
    component.member = makeMember('other-1');
    component.idOwnerGroup = 'someone-else';
    component.showDeleteButton = true;
    fixture.detectChanges();
    expect(component.showDeleteButton).toBeFalse();
  });

  it('emits the member id through memberDeleted', () => {
    fixture.detectChanges();
    const emitted: string[] = [];
    component.memberDeleted.subscribe((id) => emitted.push(id));
    component.onMemberDeleted('m-1');
    expect(emitted).toEqual(['m-1']);
  });
});
