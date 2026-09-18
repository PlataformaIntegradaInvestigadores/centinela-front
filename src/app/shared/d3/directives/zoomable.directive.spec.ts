import { ElementRef } from '@angular/core';
import { ZoomableDirective } from './zoomable.directive';
import { D3Service } from '../d3.service';

describe('ZoomableDirective', () => {
  let nativeElement: any;
  let el: ElementRef;
  let d3ServiceSpy: jasmine.SpyObj<D3Service>;
  let directive: ZoomableDirective;
  let zoomTarget: HTMLElement;

  beforeEach(() => {
    nativeElement = {};
    el = { nativeElement } as ElementRef;
    zoomTarget = document.createElement('svg');
    d3ServiceSpy = jasmine.createSpyObj('D3Service', ['applyZoomableBehaviour']);
    directive = new ZoomableDirective(d3ServiceSpy, el);
    directive.zoomableOf = zoomTarget;
  });

  it('applies the zoomable behaviour on init', () => {
    directive.ngOnInit();
    expect(d3ServiceSpy.applyZoomableBehaviour).toHaveBeenCalledWith(
      zoomTarget,
      nativeElement,
    );
  });
});
