import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appUniqueID]',
})
export class UniqueIDDirective implements OnInit {
  private static count = 0;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const uniqueId = `unique-id-${UniqueIDDirective.count++}`;
    this.el.nativeElement.id = uniqueId;
    this.el.nativeElement.setAttribute('data-modal-target', uniqueId);
    this.el.nativeElement.setAttribute('data-modal-toggle', uniqueId);
  }
}
