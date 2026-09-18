import { ElementRef } from '@angular/core';
import { DraggableNodeDirective } from './draggableNode.directive';
import { D3Service } from '../d3.service';
import { Node, ForceDirectedGraph } from '../models';

describe('DraggableNodeDirective', () => {
  let nativeElement: any;
  let el: ElementRef;
  let d3ServiceSpy: jasmine.SpyObj<D3Service>;
  let directive: DraggableNodeDirective;

  const popover: any = { enablePopover: false };
  const node = new Node('1', 10, 'Label', popover, 5, 'role', 2);
  const graph = {
    simulation: { alphaTarget: () => ({ restart: () => {} }) },
  } as unknown as ForceDirectedGraph;

  beforeEach(() => {
    nativeElement = {};
    el = { nativeElement } as ElementRef;
    d3ServiceSpy = jasmine.createSpyObj('D3Service', ['applyDraggableNodeBehaviour']);
    directive = new DraggableNodeDirective(d3ServiceSpy, el);
    directive.draggableNode = node;
    directive.draggableInGraph = graph;
  });

  it('applies the draggable node behaviour on init with node and graph', () => {
    directive.ngOnInit();
    expect(d3ServiceSpy.applyDraggableNodeBehaviour).toHaveBeenCalledWith(
      nativeElement,
      node,
      graph,
    );
  });
});
