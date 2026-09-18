import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DebateService } from './debate.service';
import { environment } from 'src/environments/environment';
import { Debate } from '../entities/debate.interface';

// rxjs/webSocket's WebSocketSubject can't be spied on directly (ESM named exports are
// non-configurable in this build), so we replace the global WebSocket constructor it
// calls internally instead — a plain mutable global, unlike the frozen module export.
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: ((ev?: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  onclose: ((ev?: any) => void) | null = null;
  readyState = 0;
  sent: string[] = [];

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.({ wasClean: true, code: 1000, reason: '' });
  }
  triggerOpen() {
    this.readyState = 1;
    this.onopen?.({});
  }
  triggerMessage(payload: any) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

describe('DebateService', () => {
  let service: DebateService;
  let httpMock: HttpTestingController;
  let originalWebSocket: any;
  const apiUrl = `${environment.apiSocial}/v1/groups/`;

  beforeEach(() => {
    localStorage.clear();
    originalWebSocket = (window as any).WebSocket;
    FakeWebSocket.instances = [];
    (window as any).WebSocket = FakeWebSocket;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DebateService],
    });
    service = TestBed.inject(DebateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    (window as any).WebSocket = originalWebSocket;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDebates', () => {
    it('throws for an empty/blank groupId without hitting the API', () => {
      expect(() => service.getDebates('   ')).toThrowError(
        'El groupId es requerido para obtener los debates.',
      );
      httpMock.expectNone(() => true);
    });

    it('GETs the group debates endpoint', () => {
      service.getDebates('g-1').subscribe();
      const req = httpMock.expectOne(`${apiUrl}g-1/debates/`);
      expect(req.request.method).toBe('GET');
      req.flush([] as Debate[]);
    });
  });

  it('createDebate POSTs to the group debates endpoint', () => {
    service.createDebate('g-1', { title: 'Topic' } as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/debates/`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getDebateDetails GETs the specific debate', () => {
    service.getDebateDetails('g-1', 5).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/debates/5/`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  describe('validateDebateStatus', () => {
    it('maps the open-debate detail message to is_open: true', (done) => {
      service.validateDebateStatus('g-1', 5).subscribe((res) => {
        expect(res).toEqual({ is_open: true });
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}g-1/debates/5/validate-status/`);
      req.flush({ detail: 'El debate está abierto.' });
    });

    it('maps any other detail message to is_open: false', (done) => {
      service.validateDebateStatus('g-1', 5).subscribe((res) => {
        expect(res).toEqual({ is_open: false });
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}g-1/debates/5/validate-status/`);
      req.flush({ detail: 'El debate está cerrado.' });
    });
  });

  it('closeDebate POSTs to the close endpoint', () => {
    service.closeDebate('g-1', 5).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/debates/5/close/`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('triggerValidateDebateStatus emits on validateDebateStatus$', (done) => {
    service.validateDebateStatus$.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });
    service.triggerValidateDebateStatus();
  });

  it('getCountdown starts at null', (done) => {
    service.getCountdown().subscribe((value) => {
      expect(value).toBeNull();
      done();
    });
  });

  it('getDebateClosedStatus starts at false', (done) => {
    service.getDebateClosedStatus().subscribe((value) => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('connect() aborts without an access token', () => {
    spyOn(console, 'error');
    service.connect(1);
    expect(console.error).toHaveBeenCalledWith(
      'No access token found. WebSocket connection aborted.',
    );
  });

  it('startCountdown/closeDebateManually/disconnect are no-ops without an open socket', () => {
    expect(() => service.startCountdown()).not.toThrow();
    expect(() => service.closeDebateManually()).not.toThrow();
    expect(() => service.disconnect()).not.toThrow();
  });

  describe('with an active connection', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'tok');
    });

    function connectAndOpen(): FakeWebSocket {
      service.connect(1);
      const sock = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
      sock.triggerOpen();
      return sock;
    }

    it('opens a socket and does not reconnect on a second call', () => {
      connectAndOpen();
      expect(FakeWebSocket.instances.length).toBe(1);
      service.connect(1);
      expect(FakeWebSocket.instances.length).toBe(1);
    });

    it('updates the countdown on a countdown message', (done) => {
      const sock = connectAndOpen();
      service.getCountdown().subscribe((value) => {
        if (value !== null) {
          expect(value).toBe(30);
          done();
        }
      });
      sock.triggerMessage({ type: 'countdown', time_left: 30 });
    });

    it('flags the debate closed and alerts on a debate_closed message', () => {
      spyOn(window, 'alert');
      const sock = connectAndOpen();
      let closed = false;
      service.getDebateClosedStatus().subscribe((value) => (closed = value));

      sock.triggerMessage({ type: 'debate_closed', message: 'closed now' });

      expect(closed).toBeTrue();
      expect(window.alert).toHaveBeenCalledWith('closed now');
    });

    it('ignores unrecognised message types', () => {
      const sock = connectAndOpen();
      expect(() => sock.triggerMessage({ type: 'mystery' })).not.toThrow();
    });

    it('sends a start_countdown action', () => {
      const sock = connectAndOpen();
      service.startCountdown(45);
      expect(sock.sent).toEqual([JSON.stringify({ action: 'start_countdown', duration: 45 })]);
    });

    it('sends a close_debate action', () => {
      const sock = connectAndOpen();
      service.closeDebateManually();
      expect(sock.sent).toEqual([JSON.stringify({ action: 'close_debate' })]);
    });

    it('disconnect completes and clears the socket', () => {
      connectAndOpen();
      service.disconnect();
      expect(() => service.startCountdown()).not.toThrow();
      // A subsequent connect() opens a brand new socket since the old one was cleared.
      connectAndOpen();
      expect(FakeWebSocket.instances.length).toBe(2);
    });
  });
});
