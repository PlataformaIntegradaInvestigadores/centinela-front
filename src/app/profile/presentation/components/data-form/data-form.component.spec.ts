import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { DataFormComponent } from './data-form.component';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

// onSubmit's success branch calls window.location.reload() synchronously,
// which real headless Chrome refuses to let tests stub (location/reload are
// non-configurable, non-writable in this Chrome build) and would otherwise
// actually reload the Karma runner mid-suite. So every "success" scenario
// below stubs the service call with a Subject that's never next()'d —
// exercising validation/payload-building without ever reaching reload().
describe('DataFormComponent', () => {
  let component: DataFormComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['updateUser']);

    TestBed.configureTestingModule({
      declarations: [DataFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    component = TestBed.createComponent(DataFormComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('populates formData from the input user', () => {
      component.user = { first_name: 'Ana', last_name: 'Perez', website: 'example.com' };
      component.ngOnInit();
      expect(component.formData.first_name).toBe('Ana');
      expect(component.formData.last_name).toBe('Perez');
      expect(component.formData.website).toBe('example.com');
      expect(component.formData.scopus_id).toBe('');
    });

    it('leaves the default formData when there is no user', () => {
      component.user = undefined;
      component.ngOnInit();
      expect(component.formData.first_name).toBe('');
    });
  });

  describe('onSubmit', () => {
    it('requires first and last name', () => {
      component.formData.first_name = '';
      component.formData.last_name = '';
      component.onSubmit();
      expect(component.errorMessages.first_name).toBeDefined();
      expect(component.errorMessages.last_name).toBeDefined();
      expect(component.errorMessage).toBe('Please fix the errors in the form.');
      expect(authServiceSpy.updateUser).not.toHaveBeenCalled();
    });

    it('flags an invalid website url', () => {
      component.formData.first_name = 'Ana';
      component.formData.last_name = 'Perez';
      component.formData.website = 'not a url###';
      component.onSubmit();
      expect(component.errorMessages.website).toBe('Invalid website URL.');
    });

    it('adjusts a valid website url missing a scheme', () => {
      component.formData.first_name = 'Ana';
      component.formData.last_name = 'Perez';
      component.formData.website = 'example.com';
      authServiceSpy.updateUser.and.returnValue(new Subject());
      component.onSubmit();
      expect(component.formData.website).toBe('http://example.com');
    });

    it('calls updateUser with the built FormData for a valid submission', () => {
      component.formData.first_name = 'Ana';
      component.formData.last_name = 'Perez';
      authServiceSpy.updateUser.and.returnValue(new Subject());

      component.onSubmit();

      expect(authServiceSpy.updateUser).toHaveBeenCalled();
      const submitted = authServiceSpy.updateUser.calls.mostRecent().args[0] as FormData;
      expect(submitted.get('first_name')).toBe('Ana');
      expect(submitted.get('last_name')).toBe('Perez');
    });

    it('includes the selected file in the submitted FormData', () => {
      component.formData.first_name = 'Ana';
      component.formData.last_name = 'Perez';
      component.selectedFile = new File(['x'], 'pic.png');
      authServiceSpy.updateUser.and.returnValue(new Subject());

      component.onSubmit();

      const submitted = authServiceSpy.updateUser.calls.mostRecent().args[0] as FormData;
      expect(submitted.get('profile_picture')).toBeTruthy();
    });

    it('surfaces the backend error message on failure', () => {
      spyOn(console, 'error');
      component.formData.first_name = 'Ana';
      component.formData.last_name = 'Perez';
      authServiceSpy.updateUser.and.returnValue(throwError(() => ({ message: 'boom' })));

      component.onSubmit();

      expect(component.errorMessage).toBe('boom');
    });
  });

  it('closeForm emits formClosed', () => {
    let emitted = false;
    component.formClosed.subscribe(() => (emitted = true));
    component.closeForm();
    expect(emitted).toBeTrue();
  });

  describe('adjustURL', () => {
    it('leaves an already-schemed url unchanged', () => {
      expect(component.adjustURL('https://example.com')).toBe('https://example.com');
    });

    it('prefixes a schemeless url with http://', () => {
      expect(component.adjustURL('example.com')).toBe('http://example.com');
    });

    it('leaves an empty url as-is', () => {
      expect(component.adjustURL('')).toBe('');
    });
  });

  describe('isValidURL', () => {
    it('accepts a well-formed url', () => {
      expect(component.isValidURL('https://example.com/path?x=1')).toBeTrue();
    });

    it('rejects a malformed url', () => {
      expect(component.isValidURL('not a url###')).toBeFalse();
    });
  });

  describe('onFileSelected', () => {
    it('reads the selected file as a data url', (done) => {
      const file = new File(['hello'], 'pic.png', { type: 'image/png' });
      const event = { target: { files: [file] } } as unknown as Event;

      component.onFileSelected(event);

      expect(component.selectedFile).toBe(file);
      setTimeout(() => {
        expect(component.formData.profile_picture).toContain('data:');
        done();
      }, 50);
    });

    it('does nothing when no file is selected', () => {
      const event = { target: { files: [] } } as unknown as Event;
      component.onFileSelected(event);
      expect(component.selectedFile).toBeNull();
    });
  });

  describe('preventNonNumeric', () => {
    it('prevents default for a non-digit key', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy() } as any;
      component.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('allows a digit key', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy() } as any;
      component.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
