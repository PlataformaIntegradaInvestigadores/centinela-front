import { PhaseStateService } from './phaseState.service';

describe('PhaseStateService', () => {
  let service: PhaseStateService;

  beforeEach(() => {
    localStorage.clear();
    service = new PhaseStateService();
  });

  afterEach(() => localStorage.clear());

  it('phase$ starts at 0', (done) => {
    service.phase$.subscribe((value) => {
      expect(value).toBe(0);
      done();
    });
  });

  it('setPhase updates phase$ and persists per group id', (done) => {
    service.setPhase(2, 'g-1');
    expect(localStorage.getItem('phase_g-1')).toBe('2');
    service.phase$.subscribe((value) => {
      expect(value).toBe(2);
      done();
    });
  });

  describe('getPhase', () => {
    it('returns 0 when nothing is stored for that group', () => {
      expect(service.getPhase('unknown')).toBe(0);
    });

    it('returns the stored phase for that group', () => {
      service.setPhase(3, 'g-2');
      expect(service.getPhase('g-2')).toBe(3);
    });
  });
});
