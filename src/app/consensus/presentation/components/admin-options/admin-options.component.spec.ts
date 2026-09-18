import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminOptionsComponent } from './admin-options.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

describe('AdminOptionsComponent', () => {
  let component: AdminOptionsComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['changeUserPhase']);

    TestBed.configureTestingModule({
      imports: [AdminOptionsComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TopicService, useValue: topicServiceSpy },
      ],
    });

    component = TestBed.createComponent(AdminOptionsComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / updateShowOptions', () => {
    it('shows options when the authenticated user is the group owner', () => {
      authServiceSpy.getUserId.and.returnValue('u-1');
      component.idOwnerGroup = 'u-1';
      component.ngOnInit();
      expect(component.showOptions).toBeTrue();
    });

    it('hides options when the authenticated user is not the owner', () => {
      authServiceSpy.getUserId.and.returnValue('u-2');
      component.idOwnerGroup = 'u-1';
      component.ngOnInit();
      expect(component.showOptions).toBeFalse();
    });
  });

  it('openModal shows the modal', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
  });

  it('closeModal hides the modal and collapses the panel', () => {
    component.openModal();
    component.panelOpenState = true;
    component.closeModal();
    expect(component.showModal).toBeFalse();
    expect(component.panelOpenState).toBeFalse();
  });

  it('cancelRepeatWorkshop just closes the modal', () => {
    component.openModal();
    component.cancelRepeatWorkshop();
    expect(component.showModal).toBeFalse();
  });

  describe('confirmRepeatWorkshop', () => {
    it('closes the modal and resets the group phase', () => {
      component.groupId = 'g-1';
      topicServiceSpy.changeUserPhase.and.returnValue(of({}));
      component.confirmRepeatWorkshop();
      expect(component.showModal).toBeFalse();
      expect(topicServiceSpy.changeUserPhase).toHaveBeenCalledWith('g-1', 0);
    });

    it('logs an error when the phase reset fails', () => {
      spyOn(console, 'error');
      component.groupId = 'g-1';
      topicServiceSpy.changeUserPhase.and.returnValue(throwError(() => new Error('boom')));
      component.confirmRepeatWorkshop();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
