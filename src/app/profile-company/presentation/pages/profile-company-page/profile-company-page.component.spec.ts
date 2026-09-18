import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { CompanyProfilePageComponent } from './profile-company-page.component';
import { CompanyService } from 'src/app/profile-company/domain/services/company.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { Company } from 'src/app/profile-company/domain/entities/company.interface';

describe('CompanyProfilePageComponent', () => {
  let component: CompanyProfilePageComponent;
  let companyServiceSpy: jasmine.SpyObj<CompanyService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let paramsSubject: Subject<any>;

  const company: Company = { id: 'c1', company_name: 'Acme' } as Company;

  beforeEach(() => {
    companyServiceSpy = jasmine.createSpyObj('CompanyService', ['getMyProfile', 'getCompanyProfile']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCompanyId']);
    paramsSubject = new Subject();

    TestBed.configureTestingModule({
      declarations: [CompanyProfilePageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: { params: paramsSubject.asObservable() } },
      ],
    });
    component = TestBed.createComponent(CompanyProfilePageComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads the profile when the route id is present', () => {
      authServiceSpy.getCompanyId.and.returnValue('other');
      companyServiceSpy.getCompanyProfile.and.returnValue(of(company as any));
      component.ngOnInit();
      paramsSubject.next({ id: 'c1' });
      expect(component.companyId).toBe('c1');
      expect(companyServiceSpy.getCompanyProfile).toHaveBeenCalledWith('c1');
    });

    it('does not load a profile without a route id', () => {
      component.ngOnInit();
      paramsSubject.next({});
      expect(companyServiceSpy.getCompanyProfile).not.toHaveBeenCalled();
      expect(companyServiceSpy.getMyProfile).not.toHaveBeenCalled();
    });
  });

  describe('loadCompanyProfile', () => {
    it('does nothing without a companyId', () => {
      component.companyId = null;
      component.loadCompanyProfile();
      expect(companyServiceSpy.getMyProfile).not.toHaveBeenCalled();
      expect(companyServiceSpy.getCompanyProfile).not.toHaveBeenCalled();
    });

    it('uses getMyProfile when the route id matches the authenticated company', () => {
      component.companyId = 'c1';
      authServiceSpy.getCompanyId.and.returnValue('c1');
      companyServiceSpy.getMyProfile.and.returnValue(of(company as any));
      component.loadCompanyProfile();
      expect(companyServiceSpy.getMyProfile).toHaveBeenCalled();
      expect(companyServiceSpy.getCompanyProfile).not.toHaveBeenCalled();
      expect(component.company).toEqual(company as any);
      expect(component.loading).toBeFalse();
    });

    it('uses getCompanyProfile for a different company id', () => {
      component.companyId = 'c1';
      authServiceSpy.getCompanyId.and.returnValue('other');
      companyServiceSpy.getCompanyProfile.and.returnValue(of(company as any));
      component.loadCompanyProfile();
      expect(companyServiceSpy.getCompanyProfile).toHaveBeenCalledWith('c1');
      expect(companyServiceSpy.getMyProfile).not.toHaveBeenCalled();
    });

    it('logs on a getMyProfile failure', () => {
      spyOn(console, 'error');
      component.companyId = 'c1';
      authServiceSpy.getCompanyId.and.returnValue('c1');
      companyServiceSpy.getMyProfile.and.returnValue(throwError(() => new Error('boom')));
      component.loadCompanyProfile();
      expect(console.error).toHaveBeenCalled();
      expect(component.loading).toBeFalse();
    });

    it('logs on a getCompanyProfile failure', () => {
      spyOn(console, 'error');
      component.companyId = 'c1';
      authServiceSpy.getCompanyId.and.returnValue('other');
      companyServiceSpy.getCompanyProfile.and.returnValue(throwError(() => new Error('boom')));
      component.loadCompanyProfile();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('setActiveTab sets the tab', () => {
    component.setActiveTab('about');
    expect(component.activeTab).toBe('about');
  });

  describe('isCompanyOwner', () => {
    it('is true when the authenticated company matches the route id', () => {
      component.companyId = 'c1';
      authServiceSpy.getCompanyId.and.returnValue('c1');
      expect(component.isCompanyOwner()).toBeTrue();
    });

    it('is false otherwise', () => {
      component.companyId = 'c1';
      authServiceSpy.getCompanyId.and.returnValue('other');
      expect(component.isCompanyOwner()).toBeFalse();
    });
  });

  describe('edit modal', () => {
    it('openEditModal opens it', () => {
      component.openEditModal();
      expect(component.showEditModal).toBeTrue();
    });

    it('closeEditModal closes it', () => {
      component.showEditModal = true;
      component.closeEditModal();
      expect(component.showEditModal).toBeFalse();
    });
  });

  describe('onProfileUpdated', () => {
    it('replaces the company and closes the modal', () => {
      spyOn(console, 'log');
      component.company = { id: 'c1', company_name: 'Old' } as Company;
      component.showEditModal = true;
      const updated = { id: 'c1', company_name: 'New' } as Company;
      component.onProfileUpdated(updated);
      expect(component.company).toEqual(updated);
      expect(component.showEditModal).toBeFalse();
    });

    it('fills in the id from the existing company when missing', () => {
      component.company = { id: 'c1', company_name: 'Old' } as Company;
      const updated = { company_name: 'New' } as Company;
      component.onProfileUpdated(updated);
      expect(component.company?.id).toBe('c1');
    });
  });
});
