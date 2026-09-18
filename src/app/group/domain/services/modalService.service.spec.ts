import { ModalService } from './modalService.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    service = new ModalService();
  });

  it('starts closed', (done) => {
    service.modalOpen$.subscribe((value) => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('setModalOpen(true) opens the modal', (done) => {
    service.setModalOpen(true);
    service.modalOpen$.subscribe((value) => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('setModalOpen(false) closes the modal', (done) => {
    service.setModalOpen(true);
    service.setModalOpen(false);
    service.modalOpen$.subscribe((value) => {
      expect(value).toBeFalse();
      done();
    });
  });
});
