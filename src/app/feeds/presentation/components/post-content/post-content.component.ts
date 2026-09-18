import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-post-content',
  templateUrl: './post-content.component.html',
  styleUrls: ['./post-content.component.css'],
})
export class PostContentComponent {
  @Input() content!: string;
  @Input() displayContent!: string;
  @Input() showFullContent: boolean = false;
  @Input() shouldTruncateContent: boolean = false;
  @Input() tags: string[] = [];

  @Output() toggleContent = new EventEmitter<void>();

  onToggleContent(): void {
    this.toggleContent.emit();
  }
}
