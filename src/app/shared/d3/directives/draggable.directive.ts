import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { D3Service } from '../d3.service';

@Directive({
  selector: '[draggable]',
})
export class DraggableDirective implements OnInit {
  @Input() dragOptions: { container: HTMLElement } | undefined;

  constructor(
    private el: ElementRef,
    private d3Service: D3Service,
  ) {}

  ngOnInit(): void {
    this.d3Service.applyDraggableBehavior(this.el.nativeElement);
  }
}
