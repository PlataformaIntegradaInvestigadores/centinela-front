import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DebateChatService } from './debate-chat.service';
import { environment } from 'src/environments/environment';

describe('DebateChatService', () => {
  let service: DebateChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DebateChatService],
    });
    service = TestBed.inject(DebateChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('connect() aborts without a stored token', () => {
    spyOn(console, 'error');
    service.connect('g-1', 'd-1');
    expect(console.error).toHaveBeenCalledWith('El token no está disponible en localStorage.');
  });

  it('sendMessage is a no-op before connect()', () => {
    expect(() => service.sendMessage({ text: 'hi', posture: 'agree' })).not.toThrow();
  });

  it('disconnect() is a no-op before connect()', () => {
    expect(() => service.disconnect()).not.toThrow();
  });

  describe('getMessageHistory', () => {
    it('throws when there is no stored token', () => {
      spyOn(console, 'error');
      expect(() => service.getMessageHistory(1)).toThrowError(
        'No se puede autenticar la solicitud sin token.',
      );
    });

    it('GETs the message-history endpoint with the auth header', () => {
      localStorage.setItem('accessToken', 'tok-1');
      service.getMessageHistory(1).subscribe();
      const req = httpMock.expectOne(`${environment.apiSocial}/v1/messages/1/`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
      req.flush([]);
    });
  });
});
