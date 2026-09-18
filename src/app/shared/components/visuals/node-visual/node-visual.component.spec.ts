import { NodeVisualComponent } from './node-visual.component';

describe('NodeVisualComponent', () => {
  let component: NodeVisualComponent;
  let routerSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    component = new NodeVisualComponent(routerSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('togglePopover', () => {
    it('calls onSelect, then opens a closed popover when popovers are enabled', () => {
      const onSelect = jasmine.createSpy('onSelect');
      component.node = { popover: { enablePopover: true, onSelect } } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
      popover.isOpen.and.returnValue(false);

      component.togglePopover(popover);

      expect(onSelect).toHaveBeenCalled();
      expect(popover.open).toHaveBeenCalled();
      expect(popover.close).not.toHaveBeenCalled();
    });

    it('closes an open popover when popovers are enabled', () => {
      component.node = { popover: { enablePopover: true } } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
      popover.isOpen.and.returnValue(true);

      component.togglePopover(popover);

      expect(popover.close).toHaveBeenCalled();
      expect(popover.open).not.toHaveBeenCalled();
    });

    it('closes an open popover when popovers are disabled, without opening it', () => {
      component.node = { popover: { enablePopover: false } } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
      popover.isOpen.and.returnValue(true);

      component.togglePopover(popover);

      expect(popover.close).toHaveBeenCalled();
      expect(popover.open).not.toHaveBeenCalled();
    });

    it('does nothing when popovers are disabled and already closed', () => {
      component.node = { popover: { enablePopover: false } } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
      popover.isOpen.and.returnValue(false);

      component.togglePopover(popover);

      expect(popover.close).not.toHaveBeenCalled();
      expect(popover.open).not.toHaveBeenCalled();
    });

    it('tolerates a missing onSelect callback', () => {
      component.node = { popover: { enablePopover: false } } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
      popover.isOpen.and.returnValue(false);
      expect(() => component.togglePopover(popover)).not.toThrow();
    });
  });

  describe('onExpand', () => {
    it('closes the popover and calls onExpand', () => {
      const onExpand = jasmine.createSpy('onExpand');
      component.node = { popover: { onExpand } } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['close']);

      component.onExpand(popover);

      expect(popover.close).toHaveBeenCalled();
      expect(onExpand).toHaveBeenCalled();
    });

    it('tolerates a missing onExpand callback', () => {
      component.node = { popover: {} } as any;
      const popover = jasmine.createSpyObj('NgbPopover', ['close']);
      expect(() => component.onExpand(popover)).not.toThrow();
    });
  });

  it('navigate routes to the author page for this node', () => {
    component.node = { id: 'n-1' } as any;
    component.navigate();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['author', 'n-1']);
  });
});
