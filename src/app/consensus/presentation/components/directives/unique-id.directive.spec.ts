import { ElementRef } from '@angular/core';
import { UniqueIDDirective } from './unique-id.directive';

describe('UniqueIDDirective', () => {
  let nativeElement: any;
  let el: ElementRef;
  let directive: UniqueIDDirective;

  beforeEach(() => {
    nativeElement = { setAttribute: jasmine.createSpy('setAttribute') };
    el = { nativeElement } as ElementRef;
    (UniqueIDDirective as any).count = 0;
    directive = new UniqueIDDirective(el);
  });

  it('assigns a unique id on init', () => {
    directive.ngOnInit();
    expect(nativeElement.id).toBe('unique-id-0');
  });

  it('sets the data-modal-target and data-modal-toggle attributes', () => {
    directive.ngOnInit();
    expect(nativeElement.setAttribute).toHaveBeenCalledWith('data-modal-target', 'unique-id-0');
    expect(nativeElement.setAttribute).toHaveBeenCalledWith('data-modal-toggle', 'unique-id-0');
  });

  it('increments the counter so each instance gets a distinct id', () => {
    const secondNative: any = { setAttribute: jasmine.createSpy('setAttribute') };
    const second = new UniqueIDDirective({ nativeElement: secondNative } as ElementRef);
    directive.ngOnInit();
    second.ngOnInit();
    expect(nativeElement.id).toBe('unique-id-0');
    expect(secondNative.id).toBe('unique-id-1');
  });
});
