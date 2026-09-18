import { LoadingService } from './loadingService.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    service = new LoadingService();
  });

  it('starts hidden', (done) => {
    service.loading$.subscribe((value) => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('show() emits true', (done) => {
    service.show();
    service.loading$.subscribe((value) => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('hide() emits false after show()', (done) => {
    service.show();
    service.hide();
    service.loading$.subscribe((value) => {
      expect(value).toBeFalse();
      done();
    });
  });
});
