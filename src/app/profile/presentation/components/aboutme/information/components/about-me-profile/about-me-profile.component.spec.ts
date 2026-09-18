import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { AboutMeProfileComponent } from './about-me-profile.component';

describe('AboutMeProfileComponent', () => {
  let component: AboutMeProfileComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AboutMeProfileComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(AboutMeProfileComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults userInfo/editableUserInfo to an empty shape', () => {
    expect(component.userInfo).toEqual({ about_me: '', disciplines: [], contact_info: [] });
    expect(component.editableUserInfo).toEqual({ about_me: '', disciplines: [], contact_info: [] });
  });

  it('ngOnChanges copies userInfo into editableUserInfo when it changes to a truthy value', () => {
    component.userInfo = { about_me: 'Hi' };
    component.ngOnChanges({ userInfo: new SimpleChange(null, component.userInfo, true) });
    expect(component.editableUserInfo).toEqual({ about_me: 'Hi' });
    expect(component.editableUserInfo).not.toBe(component.userInfo);
  });

  it('ngOnChanges ignores a falsy currentValue', () => {
    component.editableUserInfo = { about_me: 'kept' };
    component.ngOnChanges({ userInfo: new SimpleChange(null, null, true) });
    expect(component.editableUserInfo).toEqual({ about_me: 'kept' });
  });

  it('toggleEditAboutMe flips isEditing and emits toggleEdit', () => {
    let emitted = false;
    component.toggleEdit.subscribe(() => (emitted = true));
    component.toggleEditAboutMe();
    expect(component.isEditing).toBeTrue();
    expect(emitted).toBeTrue();
  });

  describe('save', () => {
    it('emits about_me, stops editing, and shows then hides a save message', fakeAsync(() => {
      let emitted: string | undefined;
      component.saveAboutMe.subscribe((v: string) => (emitted = v));
      component.editableUserInfo = { about_me: 'New bio' };
      component.isEditing = true;

      component.save();

      expect(emitted).toBe('New bio');
      expect(component.isEditing).toBeFalse();
      expect(component.saveMessage).toBe('Changes saved successfully!');
      tick(3000);
      expect(component.saveMessage).toBe('');
    }));

    it('emits an empty string when about_me is unset', () => {
      let emitted: string | undefined;
      component.saveAboutMe.subscribe((v: string) => (emitted = v));
      component.editableUserInfo = {};
      component.save();
      expect(emitted).toBe('');
    });
  });

  it('cancel stops editing and restores the original userInfo', () => {
    component.userInfo = { about_me: 'Original' };
    component.editableUserInfo = { about_me: 'Edited' };
    component.isEditing = true;
    component.cancel();
    expect(component.isEditing).toBeFalse();
    expect(component.editableUserInfo).toEqual({ about_me: 'Original' });
  });

  describe('hasAboutMeContent', () => {
    it('is false for empty/missing about_me', () => {
      component.userInfo = { about_me: '' };
      expect(component.hasAboutMeContent()).toBeFalse();
      component.userInfo = {};
      expect(component.hasAboutMeContent()).toBeFalse();
    });

    it('is true when about_me has content', () => {
      component.userInfo = { about_me: 'Hello' };
      expect(component.hasAboutMeContent()).toBeTrue();
    });
  });
});
