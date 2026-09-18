import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ContactInfoComponent } from './contact-info.component';

describe('ContactInfoComponent', () => {
  let component: ContactInfoComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContactInfoComponent],
    });
    component = TestBed.createComponent(ContactInfoComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges clones contactInfo into editableContactInfo when it changes', () => {
    component.contactInfo = [{ type: 'email', value: 'a@b.com' }];
    component.ngOnChanges({ contactInfo: new SimpleChange(null, component.contactInfo, true) });
    expect(component.editableContactInfo).toEqual(component.contactInfo);
    expect(component.editableContactInfo).not.toBe(component.contactInfo);
  });

  it('ngOnChanges ignores unrelated changes', () => {
    component.editableContactInfo = [{ type: 'email', value: 'x' }];
    component.ngOnChanges({ isOwnProfile: new SimpleChange(false, true, false) });
    expect(component.editableContactInfo).toEqual([{ type: 'email', value: 'x' }]);
  });

  it('toggleEditContactInfo flips isEditing and emits toggleEdit', () => {
    let emitted = false;
    component.toggleEdit.subscribe(() => (emitted = true));
    component.toggleEditContactInfo();
    expect(component.isEditing).toBeTrue();
    expect(emitted).toBeTrue();
  });

  describe('save', () => {
    it('emits saveContactInfo, exits edit mode, and shows a save message', fakeAsync(() => {
      component.editableContactInfo = [{ type: 'email', value: 'a@b.com' }];
      component.isEditing = true;
      let emitted: any = null;
      component.saveContactInfo.subscribe((v) => (emitted = v));

      component.save();

      expect(emitted).toEqual(component.editableContactInfo);
      expect(component.isEditing).toBeFalse();
      expect(component.saveMessage).toBe('Changes saved successfully!');
      tick(3000);
      expect(component.saveMessage).toBe('');
    }));
  });

  it('cancel exits edit mode and restores from contactInfo', () => {
    component.contactInfo = [{ type: 'email', value: 'orig' }];
    component.editableContactInfo = [{ type: 'email', value: 'dirty' }];
    component.isEditing = true;
    component.cancel();
    expect(component.isEditing).toBeFalse();
    expect(component.editableContactInfo).toEqual([{ type: 'email', value: 'orig' }]);
  });

  describe('addContactInfo', () => {
    it('adds a detected contact and clears the input', () => {
      component.newContactValue = 'a@b.com';
      component.addContactInfo();
      expect(component.editableContactInfo).toEqual([{ type: 'email', value: 'a@b.com' }]);
      expect(component.newContactValue).toBe('');
    });

    it('does nothing for a blank value', () => {
      component.newContactValue = '';
      component.addContactInfo();
      expect(component.editableContactInfo).toEqual([]);
    });
  });

  it('removeContactInfo removes the given entry', () => {
    const contact = { type: 'email', value: 'a@b.com' };
    component.editableContactInfo = [contact, { type: 'phone', value: '1234567890' }];
    component.removeContactInfo(contact);
    expect(component.editableContactInfo).toEqual([{ type: 'phone', value: '1234567890' }]);
  });

  it('removeContactInfo is a no-op for an entry not present', () => {
    const contact = { type: 'email', value: 'a@b.com' };
    component.editableContactInfo = [{ type: 'phone', value: '1234567890' }];
    component.removeContactInfo(contact);
    expect(component.editableContactInfo.length).toBe(1);
  });

  describe('detectContactType', () => {
    const cases: [string, string][] = [
      ['https://facebook.com/user', 'facebook'],
      ['https://twitter.com/user', 'x'],
      ['https://x.com/user', 'x'],
      ['https://linkedin.com/in/user', 'linkedin'],
      ['https://github.com/user', 'github'],
      ['https://youtube.com/@user', 'youtube'],
      ['https://orcid.org/0000-0001-2345-6789', 'orcid'],
      ['https://example.com', 'website'],
      ['user@example.com', 'email'],
      ['1234567890', 'phone'],
      ['not a recognized value', 'other'],
    ];

    cases.forEach(([value, expected]) => {
      it(`detects "${value}" as ${expected}`, () => {
        expect(component.detectContactType(value)).toBe(expected);
      });
    });
  });

  describe('isUrl', () => {
    it('recognizes a plain http(s) url', () => {
      expect(component.isUrl('https://example.com')).toBeTrue();
    });

    it('recognizes a known social media host even without a scheme, via the social-media pattern', () => {
      expect(component.isUrl('linkedin.com/in/user')).toBeTrue();
    });

    it('rejects a non-url value', () => {
      expect(component.isUrl('not a url')).toBeFalse();
    });
  });

  describe('getContactIcon', () => {
    it('maps each known type to its icon class', () => {
      expect(component.getContactIcon('phone')).toBe('fa-solid fa-phone');
      expect(component.getContactIcon('EMAIL')).toBe('fa-solid fa-envelope');
      expect(component.getContactIcon('website')).toBe('fa-solid fa-link');
      expect(component.getContactIcon('facebook')).toBe('fa-brands fa-facebook');
      expect(component.getContactIcon('x')).toBe('fa-brands fa-x-twitter');
      expect(component.getContactIcon('linkedin')).toBe('fa-brands fa-linkedin');
      expect(component.getContactIcon('github')).toBe('fa-brands fa-github');
      expect(component.getContactIcon('youtube')).toBe('fa-brands fa-youtube');
      expect(component.getContactIcon('orcid')).toBe('fa-brands fa-orcid');
    });

    it('falls back to a generic icon for an unknown type', () => {
      expect(component.getContactIcon('unknown')).toBe('fa-solid fa-info-circle');
    });
  });
});
