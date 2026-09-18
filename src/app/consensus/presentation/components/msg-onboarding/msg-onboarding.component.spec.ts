import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MsgOnboardingComponent } from './msg-onboarding.component';

describe('MsgOnboardingComponent', () => {
  let component: MsgOnboardingComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      declarations: [MsgOnboardingComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(MsgOnboardingComponent).componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('keeps the modal open by default', () => {
      component.ngOnInit();
      expect(component.showModalOnboarding).toBeTrue();
    });

    it('hides the modal when dontShowOnboarding is stored as "false"', () => {
      localStorage.setItem('dontShowOnboarding', 'false');
      component.ngOnInit();
      expect(component.showModalOnboarding).toBeFalse();
    });
  });

  it('currentMessage/currentImage reflect the current index', () => {
    expect(component.currentMessage).toBe(component.messages[0]);
    expect(component.currentImage).toBe(component.images[0]);
    component.nextMessage();
    expect(component.currentMessage).toBe(component.messages[1]);
  });

  describe('nextMessage / previousMessage', () => {
    it('advances up to the last message and stops', () => {
      const last = component.messages.length - 1;
      for (let i = 0; i < last + 3; i++) component.nextMessage();
      expect(component.currentIndexToModalOfOnboarding).toBe(last);
    });

    it('goes back down to 0 and stops', () => {
      component.nextMessage();
      component.previousMessage();
      component.previousMessage();
      expect(component.currentIndexToModalOfOnboarding).toBe(0);
    });
  });

  it('closeModalOnboarding hides the modal', () => {
    component.closeModalOnboarding();
    expect(component.showModalOnboarding).toBeFalse();
  });

  describe('nextOrClose', () => {
    it('advances while not on the last message', () => {
      component.nextOrClose();
      expect(component.currentIndexToModalOfOnboarding).toBe(1);
      expect(component.showModalOnboarding).toBeTrue();
    });

    it('closes the modal once on the last message', () => {
      component.currentIndexToModalOfOnboarding = component.messages.length - 1;
      component.nextOrClose();
      expect(component.showModalOnboarding).toBeFalse();
    });
  });

  it('dontShowAgain persists the preference and closes the modal', () => {
    component.dontShowAgain();
    expect(localStorage.getItem('dontShowOnboarding')).toBe('false');
    expect(component.showModalOnboarding).toBeFalse();
  });
});
