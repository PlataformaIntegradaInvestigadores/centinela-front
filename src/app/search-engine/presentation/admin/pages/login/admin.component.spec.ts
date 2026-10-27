import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminComponent } from './admin.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let moderationServiceSpy: jasmine.SpyObj<ModerationService>;

  const setup = (isModerator: boolean) => {
    moderationServiceSpy = jasmine.createSpyObj('ModerationService', ['isModerator']);
    moderationServiceSpy.isModerator.and.returnValue(of(isModerator));
    TestBed.configureTestingModule({
      declarations: [AdminComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: ModerationService, useValue: moderationServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', () => {
    setup(false);
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Open moderation queue');
  });

  it('offers moderators a shortcut to the moderation queue', () => {
    setup(true);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[href="/admin/dashboard/moderation"]',
    );
    expect(link.textContent).toContain('Open moderation queue');
  });
});
