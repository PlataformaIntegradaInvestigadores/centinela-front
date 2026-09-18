import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupService } from './group.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

describe('GroupService', () => {
  let service: GroupService;
  let httpMock: HttpTestingController;
  const authMock = jasmine.createSpyObj('AuthService', ['getToken']);

  const apiUrl = `${environment.apiIdentity}/groups/`;
  const apiUrl2 = `${environment.apiIdentity}/test/user/groups/`;
  const userOwnGroupApiUrl = `${environment.apiIdentity}/test/users/groups/`;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'token-123');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GroupService, { provide: AuthService, useValue: authMock }],
    });
    service = TestBed.inject(GroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('leaveGroup', () => {
    it('POSTs to the leave endpoint with the bearer token', () => {
      service.leaveGroup('5').subscribe();
      const req = httpMock.expectOne(`${apiUrl2}5/leave/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
      req.flush(null);
    });
  });

  describe('deleteGroup', () => {
    it('DELETEs to the delete endpoint with the bearer token', () => {
      service.deleteGroup('5').subscribe();
      const req = httpMock.expectOne(`${apiUrl2}5/delete/`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
      req.flush(null);
    });
  });

  describe('getGroups', () => {
    it('GETs and transforms groups (owner = admin_id, phase = 1/3)', () => {
      const raw = [
        { id: '1', title: 'T', description: 'D', admin_id: 'admin', users: [], voting_type: 'v' },
      ] as any;
      let result: any;
      service.getGroups().subscribe((r) => (result = r));
      const req = httpMock.expectOne(apiUrl2);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
      req.flush(raw);
      expect(result[0].owner).toBe('admin');
      expect(result[0].phase).toBe('1/3');
      expect(result[0].id).toBe('1');
    });
  });

  describe('getUserById', () => {
    it('GETs a user by id with the bearer token', () => {
      service.getUserById('42').subscribe();
      const req = httpMock.expectOne(`${userOwnGroupApiUrl}42/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
      req.flush({ id: '42' });
    });
  });

  describe('createGroup', () => {
    it('POSTs the group data with the bearer token', () => {
      const data = { title: 'New', description: 'Desc' };
      service.createGroup(data).subscribe();
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
      req.flush({ id: '9' });
    });
  });

  describe('handleError', () => {
    it('maps a server-side error with detail', () => {
      let err: any;
      service.getGroups().subscribe({ error: (e) => (err = e) });
      httpMock
        .expectOne(apiUrl2)
        .flush({ detail: 'nope' }, { status: 400, statusText: 'Bad' });
      expect(err.message).toContain('Server-side error: nope');
    });

    it('maps a client-side error', () => {
      let err: any;
      service.getGroups().subscribe({ error: (e) => (err = e) });
      const req = httpMock.expectOne(apiUrl2);
      req.error(new ErrorEvent('error', { message: 'network down' }));
      expect(err.message).toContain('Client-side error: network down');
    });
  });
});
