import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SidebarDashboardComponent } from './sidebar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

describe('SidebarDashboardComponent', () => {
  let component: SidebarDashboardComponent;
  let fixture: ComponentFixture<SidebarDashboardComponent>;
  let moderationServiceSpy: jasmine.SpyObj<ModerationService>;

  const setup = (adminSession: boolean, isModerator: boolean) => {
    if (adminSession) {
      localStorage.setItem('authState', 'authenticated');
    } else {
      localStorage.removeItem('authState');
    }
    moderationServiceSpy = jasmine.createSpyObj('ModerationService', ['isModerator']);
    moderationServiceSpy.isModerator.and.returnValue(of(isModerator));
    TestBed.configureTestingModule({
      declarations: [SidebarDashboardComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: ModerationService, useValue: moderationServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(SidebarDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => localStorage.removeItem('authState'));

  it('shows admin sections and moderation to an admin who is also a moderator', () => {
    setup(true, true);
    const text = fixture.nativeElement.textContent;
    expect(component.isAdmin).toBeTrue();
    expect(text).toContain('Logger');
    expect(text).toContain('Moderation');
  });

  it('shows only the moderation section to a moderator without admin session', () => {
    setup(false, true);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Moderation');
    expect(text).toContain('Back to Centinela');
    expect(text).not.toContain('Logger');
    expect(text).not.toContain('log out');
  });

  it('hides moderation from admins that are not moderators', () => {
    setup(true, false);
    expect(fixture.nativeElement.textContent).not.toContain('Moderation');
  });

  it('clears the admin session on logout', () => {
    setup(true, false);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.logout();
    expect(localStorage.getItem('authState')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });
});
