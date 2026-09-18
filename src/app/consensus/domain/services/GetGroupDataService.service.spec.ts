import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsensusService } from './GetGroupDataService.service';
import { environment } from 'src/environments/environment';

describe('ConsensusService', () => {
  let service: ConsensusService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSocial}/groups/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsensusService],
    });
    service = TestBed.inject(ConsensusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getGroupById GETs the group endpoint', () => {
    service.getGroupById('g-1').subscribe((group) => {
      expect(group).toEqual({ id: 'g-1' } as any);
    });
    const req = httpMock.expectOne(`${apiUrl}g-1/`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'g-1' });
  });

  it('getGroupById formats a server error via handleError', (done) => {
    spyOn(console, 'error');
    service.getGroupById('g-1').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Server-side error: Group not found');
        done();
      },
    });
    const req = httpMock.expectOne(`${apiUrl}g-1/`);
    req.flush({ detail: 'Group not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('removeMember DELETEs the remove-member endpoint', () => {
    service.removeMember('g-1', 'm-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/remove-member/m-1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('removeMember formats an unknown error when no detail is present', (done) => {
    spyOn(console, 'error');
    service.removeMember('g-1', 'm-1').subscribe({
      error: (err: Error) => {
        expect(err.message).toContain('Server-side error');
        done();
      },
    });
    const req = httpMock.expectOne(`${apiUrl}g-1/remove-member/m-1/`);
    req.flush('plain text', { status: 500, statusText: 'Server Error' });
  });
});
