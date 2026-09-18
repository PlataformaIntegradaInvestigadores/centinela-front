import { Component, Input } from '@angular/core';
import { Link } from '../../../d3';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: '[linkVisual]',
  template: `
    <ng-template #popTitle>Relation</ng-template>

    <ng-template #popContent>
      <b>Collaboration strength:</b> {{ link.strokeWidth / 5 }}
    </ng-template>

    <svg:line
      class="line"
      style="stroke-width:{{ link.strokeWidth }}; stroke: rgb(0, 0, 0)"
      [attr.x1]="link.source.x"
      [attr.y1]="link.source.y"
      [attr.x2]="link.target.x"
      [attr.y2]="link.target.y"
      [ngbPopover]="popContent"
      [popoverTitle]="popTitle"
      triggers="manual"
      #p1="ngbPopover"
      (click)="togglePopover(p1)"
      container="body"
    ></svg:line>
  `,
  styleUrls: ['./link-visual.component.css'],
})
export class LinkVisualComponent {
  @Input('linkVisual') link!: Link;

  togglePopover(popover: NgbPopover) {
    if (popover.isOpen()) {
      popover.close();
    } else {
      popover.open();
    }
  }
}
