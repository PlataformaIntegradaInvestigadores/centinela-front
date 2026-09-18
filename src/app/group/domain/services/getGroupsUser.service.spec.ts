import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { GetGroupsService } from './getGroupsUser.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { ErrorService } from 'src/app/auth/domain/services/error.service';
import { LoadingService } from './loadingService.service';

describe('GetGroupsService', () => {
  let service: GetGroupsService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let loadingServiceSpy: jasmine.SpyObj<LoadingService>;

  const apiUrl = `${environment.apiIdentity}/test/user/groups/`;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError']);
    loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GetGroupsService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
      ],
    });
    service = TestBed.inject(GetGroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGroupsByUserId', () => {
    it('shows loading, GETs groups with a bearer token, then hides loading', () => {
      authServiceSpy.getToken.and.returnValue(of('my-token'));
      const groups = [
        { id: '1', title: 'G', description: '', admin_id: 'a', users: [], voting_type: 'v' },
      ] as any;
      let result: any;
      service.getGroupsByUserId().subscribe((r) => (result = r));
      expect(loadingServiceSpy.show).toHaveBeenCalled();
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
      req.flush(groups);
      expect(result).toEqual(groups);
      expect(loadingServiceSpy.hide).toHaveBeenCalled();
    });

    it('hides loading and errors when there is no token', () => {
      authServiceSpy.getToken.and.returnValue(of(null));
      let err: any;
      service.getGroupsByUserId().subscribe({ error: (e) => (err = e) });
      expect(loadingServiceSpy.show).toHaveBeenCalled();
      expect(loadingServiceSpy.hide).toHaveBeenCalled();
      expect(err).toEqual(new Error('Error fetching groups: No authentication token found'));
      httpMock.expectNone(() => true);
    });

    it('hides loading and rethrows on an http error', () => {
      authServiceSpy.getToken.and.returnValue(of('t'));
      let err: any;
      service.getGroupsByUserId().subscribe({ error: (e) => (err = e) });
      httpMock
        .expectOne(apiUrl)
        .flush('fail', { status: 500, statusText: 'Server Error' });
      expect(loadingServiceSpy.hide).toHaveBeenCalled();
      expect(err.message).toContain('Error fetching groups:');
    });
  });

  describe('deleteGroup', () => {
    it('DELETEs with a bearer token', () => {
      authServiceSpy.getToken.and.returnValue(of('t'));
      service.deleteGroup('7').subscribe();
      const req = httpMock.expectOne(`${apiUrl}7/delet8e/`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer t');
      req.flush(null);
    });

    it('errors when there is no token', () => {
      authServiceSpy.getToken.and.returnValue(of(null));
      let err: any;
      service.deleteGroup('7').subscribe({ error: (e) => (err = e) });
      expect(err).toEqual(new Error('Error deleting group: No authentication token found'));
      httpMock.expectNone(() => true);
    });

    it('calls errorService and rethrows on an http error', () => {
      authServiceSpy.getToken.and.returnValue(of('t'));
      let err: any;
      service.deleteGroup('7').subscribe({ error: (e) => (err = e) });
      httpMock.expectOne(`${apiUrl}7/delet8e/`).flush('x', { status: 500, statusText: 'e' });
      expect(errorServiceSpy.handleError).toHaveBeenCalled();
      expect(err.message).toContain('Error deleting group:');
    });
  });

  describe('leaveGroup', () => {
    it('POSTs with a bearer token', () => {
      authServiceSpy.getToken.and.returnValue(of('t'));
      service.leaveGroup('7').subscribe();
      const req = httpMock.expectOne(`${apiUrl}7/leave7/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer t');
      req.flush(null);
    });

    it('errors when there is no token', () => {
      authServiceSpy.getToken.and.returnValue(of(null));
      let err: any;
      service.leaveGroup('7').subscribe({ error: (e) => (err = e) });
      expect(err).toEqual(new Error('Error leaving group: No authentication token found'));
      httpMock.expectNone(() => true);
    });

    it('calls errorService and rethrows on an http error', () => {
      authServiceSpy.getToken.and.returnValue(of('t'));
      let err: any;
      service.leaveGroup('7').subscribe({ error: (e) => (err = e) });
      httpMock.expectOne(`${apiUrl}7/leave7/`).flush('x', { status: 500, statusText: 'e' });
      expect(errorServiceSpy.handleError).toHaveBeenCalled();
      expect(err.message).toContain('Error leaving group:');
    });
  });
});
