import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './WebSocketService.service';
import { environment } from 'src/environments/environment';

// rxjs/webSocket's `webSocket` export can't be spied on directly (ESM named exports
// are non-configurable in this build), so we replace the global WebSocket constructor
// it calls internally instead — a plain mutable global, unlike the frozen module export.
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

describe('WebSocketService', () => {
  let service: WebSocketService;
  let originalWebSocket: any;

  beforeEach(() => {
    originalWebSocket = (window as any).WebSocket;
    FakeWebSocket.instances = [];
    (window as any).WebSocket = FakeWebSocket;
    TestBed.configureTestingModule({ providers: [WebSocketService] });
    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    (window as any).WebSocket = originalWebSocket;
  });

  function connectAndOpen(groupId: string): FakeWebSocket {
    service.connect(groupId);
    const sock = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
    sock.triggerOpen();
    return sock;
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connect', () => {
    it('opens a websocket to the groups endpoint and subscribes', () => {
      const sock = connectAndOpen('group-1');
      expect(sock.url).toBe(`${environment.wsUrl}/groups/group-1/`);
      expect(FakeWebSocket.instances.length).toBe(1);
    });

    it('reuses an existing open connection', () => {
      connectAndOpen('group-1');
      service.connect('group-1');
      expect(FakeWebSocket.instances.length).toBe(1);
    });

    it('reopens a closed connection', () => {
      const subject = service.connect('group-1');
      FakeWebSocket.instances[0].triggerOpen();
      (subject as any).closed = true;
      service.connect('group-1');
      expect(FakeWebSocket.instances.length).toBe(2);
    });
  });

  describe('message handling', () => {
    it('emits newTopicReceived for new_topic', () => {
      const sock = connectAndOpen('group-1');
      const payload = { type: 'new_topic', foo: 'bar' };
      let received: any;
      service.newTopicReceived.subscribe((m) => (received = m));
      sock.triggerMessage({ message: payload });
      expect(received).toEqual(payload);
    });

    [
      'topic_visited',
      'combined_search',
      'user_expertise',
      'consensus_completed',
      'debate_created',
      'debate_closed',
      'posture_created',
      'posture_updated',
    ].forEach((type) => {
      it(`emits notificationsReceived for ${type}`, () => {
        const sock = connectAndOpen('group-1');
        const payload = { type, data: 1 };
        let received: any;
        service.notificationsReceived.subscribe((m) => (received = m));
        sock.triggerMessage({ message: payload });
        expect(received).toEqual(payload);
      });
    });

    it('ignores connection_count without emitting', () => {
      const sock = connectAndOpen('group-1');
      let count = 0;
      service.notificationsReceived.subscribe(() => count++);
      sock.triggerMessage({ message: { type: 'connection_count' } });
      expect(count).toBe(0);
    });

    it('warns on an unknown message type', () => {
      spyOn(console, 'warn');
      const sock = connectAndOpen('group-1');
      sock.triggerMessage({ message: { type: 'mystery' } });
      expect(console.warn).toHaveBeenCalled();
    });

    it('warns on a malformed message', () => {
      spyOn(console, 'warn');
      const sock = connectAndOpen('group-1');
      sock.triggerMessage({});
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('sends on an open socket', () => {
      const sock = connectAndOpen('group-1');
      const msg = { hello: 'world' };
      service.sendMessage('group-1', msg);
      expect(sock.sent).toEqual([JSON.stringify(msg)]);
    });

    it('warns when there is no socket to send', () => {
      spyOn(console, 'warn');
      service.sendMessage('group-1', {});
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('completes and deletes an open socket', () => {
      connectAndOpen('group-1');
      service.close('group-1');
      expect((service as any).sockets['group-1']).toBeUndefined();
    });

    it('warns when there is no socket to close', () => {
      spyOn(console, 'warn');
      service.close('group-1');
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('closeAll', () => {
    it('closes every open socket', () => {
      connectAndOpen('group-1');
      connectAndOpen('group-2');
      service.closeAll();
      expect(Object.keys((service as any).sockets).length).toBe(0);
    });
  });
});
