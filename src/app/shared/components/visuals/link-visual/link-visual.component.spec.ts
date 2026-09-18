import { LinkVisualComponent } from './link-visual.component';

describe('LinkVisualComponent', () => {
  let component: LinkVisualComponent;

  beforeEach(() => {
    component = new LinkVisualComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('togglePopover closes an open popover', () => {
    const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
    popover.isOpen.and.returnValue(true);
    component.togglePopover(popover);
    expect(popover.close).toHaveBeenCalled();
    expect(popover.open).not.toHaveBeenCalled();
  });

  it('togglePopover opens a closed popover', () => {
    const popover = jasmine.createSpyObj('NgbPopover', ['isOpen', 'open', 'close']);
    popover.isOpen.and.returnValue(false);
    component.togglePopover(popover);
    expect(popover.open).toHaveBeenCalled();
    expect(popover.close).not.toHaveBeenCalled();
  });
});
