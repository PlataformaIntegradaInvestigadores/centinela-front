import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { InformationComponent } from './information.component';
import { InformationService } from 'src/app/profile/domain/services/information.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';

describe('InformationComponent', () => {
  let component: InformationComponent;
  let infoServiceSpy: jasmine.SpyObj<InformationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    infoServiceSpy = jasmine.createSpyObj('InformationService', [
      'getPublicInformation',
      'updateInformation',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

    TestBed.configureTestingModule({
      declarations: [InformationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: InformationService, useValue: infoServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserDataService, useValue: jasmine.createSpyObj('UserDataService', ['getUser']) },
      ],
    });
    component = TestBed.createComponent(InformationComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('reads login state and fetches public info when a user is set', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      infoServiceSpy.getPublicInformation.and.returnValue(
        of({ disciplines: ['Math'], contact_info: [] }),
      );
      component.user = { id: 'u-1' } as any;

      component.ngOnInit();

      expect(component.isLoggedIn).toBeTrue();
      expect(infoServiceSpy.getPublicInformation).toHaveBeenCalledWith('u-1');
      expect(component.disciplines).toEqual(['Math']);
    });

    it('does not fetch info without a user', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      component.user = null;
      component.ngOnInit();
      expect(infoServiceSpy.getPublicInformation).not.toHaveBeenCalled();
    });
  });

  it('fetchPublicInformation defaults missing fields to empty', () => {
    infoServiceSpy.getPublicInformation.and.returnValue(of({} as any));
    component.fetchPublicInformation('u-1');
    expect(component.userInfo).toEqual({});
    expect(component.disciplines).toEqual([]);
    expect(component.contactInfo).toEqual([]);
  });

  it('saveAboutMe updates userInfo.about_me from the response', () => {
    infoServiceSpy.updateInformation.and.returnValue(of({ about_me: 'Hello' }));
    component.saveAboutMe('Hello');
    expect(component.userInfo.about_me).toBe('Hello');
  });

  it('saveDisciplines updates disciplines, defaulting to [] if absent', () => {
    infoServiceSpy.updateInformation.and.returnValue(of({}));
    component.saveDisciplines(['Math']);
    expect(component.disciplines).toEqual([]);
  });

  it('saveContactInfo updates contactInfo, defaulting to [] if absent', () => {
    infoServiceSpy.updateInformation.and.returnValue(of({ contact_info: [{ type: 'email', value: 'a@b.com' }] as any }));
    component.saveContactInfo([]);
    expect(component.contactInfo).toEqual([{ type: 'email', value: 'a@b.com' }] as any);
  });

  it('toggleEdit does not throw', () => {
    expect(() => component.toggleEdit()).not.toThrow();
  });
});
