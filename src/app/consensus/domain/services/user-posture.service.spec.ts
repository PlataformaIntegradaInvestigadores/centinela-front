import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserPostureService } from './user-posture.service';
import { environment } from 'src/environments/environment';
import { UserPosture } from '../entities/user-posture.interface';

describe('UserPostureService', () => {
  let service: UserPostureService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSocial}/v1/postures`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserPostureService],
    });
    service = TestBed.inject(UserPostureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUserPostureByDebate GETs the debate-scoped endpoint', () => {
    service.getUserPostureByDebate(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/debate/3/`);
    expect(req.request.method).toBe('GET');
    req.flush({} as UserPosture);
  });

  it('getUserPosture GETs the same debate-scoped endpoint', () => {
    service.getUserPosture(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/debate/3/`);
    expect(req.request.method).toBe('GET');
    req.flush({} as UserPosture);
  });

  it('createUserPosture POSTs to the collection endpoint', () => {
    const posture = { debate: 1, posture: 'agree' } as unknown as UserPosture;
    service.createUserPosture(posture).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(posture);
    req.flush(posture);
  });

  it('updateUserPosture PATCHes the posture id endpoint', () => {
    service.updateUserPosture(7, { posture: 'disagree' } as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/7/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
