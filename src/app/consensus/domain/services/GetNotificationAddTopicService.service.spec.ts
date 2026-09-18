import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GetNotificationAddTopicService } from './GetNotificationAddTopicService.service';
import { environment } from 'src/environments/environment';

describe('GetNotificationAddTopicService', () => {
  let service: GetNotificationAddTopicService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSocial}/v1/groups/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GetNotificationAddTopicService],
    });
    service = TestBed.inject(GetNotificationAddTopicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getNotificationsAddTopicByGroup GETs the group notifications endpoint', () => {
    service.getNotificationsAddTopicByGroup('g-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/notifications/`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getNotificationsPhaseTwo GETs the phase-two notifications endpoint', () => {
    service.getNotificationsPhaseTwo('g-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/notifications-phase-two/`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('formats a server error via handleError', (done) => {
    spyOn(console, 'error');
    service.getNotificationsAddTopicByGroup('g-1').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Server-side error: Not found');
        done();
      },
    });
    const req = httpMock.expectOne(`${apiUrl}g-1/notifications/`);
    req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });
});
