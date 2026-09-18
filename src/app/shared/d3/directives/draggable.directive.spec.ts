import { ElementRef } from '@angular/core';
import { DraggableDirective } from './draggable.directive';
import { D3Service } from '../d3.service';

describe('DraggableDirective', () => {
  let nativeElement: any;
  let el: ElementRef;
  let d3ServiceSpy: jasmine.SpyObj<D3Service>;
  let directive: DraggableDirective;

  beforeEach(() => {
    nativeElement = {};
    el = { nativeElement } as ElementRef;
    d3ServiceSpy = jasmine.createSpyObj('D3Service', ['applyDraggableBehavior']);
    directive = new DraggableDirective(el, d3ServiceSpy);
  });

  it('applies the draggable behavior on init', () => {
    directive.dragOptions = { container: document.createElement('div') };
    directive.ngOnInit();
    expect(d3ServiceSpy.applyDraggableBehavior).toHaveBeenCalledWith(nativeElement);
  });

  it('works when dragOptions is undefined', () => {
    directive.dragOptions = undefined;
    directive.ngOnInit();
    expect(d3ServiceSpy.applyDraggableBehavior).toHaveBeenCalledWith(nativeElement);
  });
});
