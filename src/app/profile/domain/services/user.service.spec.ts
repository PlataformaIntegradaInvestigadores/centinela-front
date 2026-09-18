import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUserById GETs the user endpoint', () => {
    service.getUserById('u-1').subscribe((user) => {
      expect(user).toEqual({ id: 'u-1' } as any);
    });
    const req = httpMock.expectOne(`${environment.apiIdentity}/users/u-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'u-1' });
  });
});
