import { Directive, Input, ElementRef, OnInit } from '@angular/core';
import { Node, ForceDirectedGraph } from '../models';
import { D3Service } from '../d3.service';

@Directive({
  selector: '[draggableNode]',
})
export class DraggableNodeDirective implements OnInit {
  @Input() draggableNode!: Node;
  @Input() draggableInGraph!: ForceDirectedGraph;

  constructor(
    private d3Service: D3Service,
    private _element: ElementRef,
  ) {}

  ngOnInit() {
    this.d3Service.applyDraggableNodeBehaviour(
      this._element.nativeElement,
      this.draggableNode,
      this.draggableInGraph,
    );
  }
}
