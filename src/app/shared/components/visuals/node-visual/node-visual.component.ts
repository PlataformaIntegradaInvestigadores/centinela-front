import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Node } from '../../../d3';

@Component({
  selector: '[nodeVisual]',
  template: `
    <ng-template #popTitle>
      <div class="d-flex justify-content-between align-items-center" style="min-width: 160px;">
        <span>{{ node.popover.title }}</span>
        <button
          type="button"
          aria-label="Close"
          (click)="p1.close()"
          style="background: none; border: none; font-size: 1.2rem; line-height: 1; padding: 0 4px; cursor: pointer; color: #666;"
        >
          &times;
        </button>
      </div>
    </ng-template>
    <ng-template #popContent>
      <div class="mb-1"><b>Name:</b> {{ node.popover.content }}</div>
      <div><b>Degree:</b> {{ node.degree }}</div>
      <div *ngIf="node.weight"><b>Relevance:</b> {{ node.weight }}</div>
      <div class="mt-2 pt-1 border-top" *ngIf="node.popover.link || node.popover.expandable">
        <a
          *ngIf="node.popover.link"
          [routerLink]="['/profile', node.id]"
          class="btn btn-sm btn-outline-primary text-center d-block w-100 mb-1"
          >View profile</a
        >
        <button
          *ngIf="node.popover.expandable"
          type="button"
          (click)="onExpand(p1)"
          [disabled]="node.isExpanded"
          class="btn btn-sm w-100"
          [ngClass]="node.isExpanded ? 'btn-secondary cursor-not-allowed' : 'btn-primary'"
        >
          {{ node.isExpanded ? 'Already expanded' : 'Expand network' }}
        </button>
      </div>
    </ng-template>

    <svg:g
      [attr.transform]="'translate(' + node.x + ',' + node.y + ')'"
      [ngbPopover]="popContent"
      [popoverTitle]="popTitle"
      triggers="manual"
      #p1="ngbPopover"
      (click)="togglePopover(p1)"
      style="cursor: pointer;"
      container="body"
    >
      <svg:circle
        *ngIf="node.isSelected"
        cx="0"
        cy="0"
        [attr.r]="node.r + 8"
        fill="none"
        stroke="#2563eb"
        stroke-width="3.5"
        stroke-dasharray="8,4"
      ></svg:circle>
      <svg:circle
        class="node"
        [attr.fill]="node.color"
        [attr.stroke]="node.isSelected ? '#ffffff' : 'white'"
        [attr.stroke-width]="node.isSelected ? '3.5' : '0.25'"
        cx="0"
        cy="0"
        [attr.r]="node.r"
      ></svg:circle>
      <svg:text class="node-name" [attr.font-size]="node.fontSize">
        {{ node.label ? node.label : node.id }}
      </svg:text>
    </svg:g>
  `,
  styleUrls: ['./node-visual.component.css'],
})
export class NodeVisualComponent {
  @Input('nodeVisual') node!: Node;

  constructor(private router: Router) {}

  togglePopover(popover: NgbPopover) {
    this.node.popover.onSelect?.();
    if (this.node.popover.enablePopover) {
      if (popover.isOpen()) {
        popover.close();
      } else {
        popover.open();
      }
    } else if (popover.isOpen()) {
      popover.close();
    }
  }

  onExpand(popover: NgbPopover) {
    popover.close();
    this.node.popover.onExpand?.();
  }

  navigate() {
    this.router.navigate(['author', this.node.id]);
  }
}
