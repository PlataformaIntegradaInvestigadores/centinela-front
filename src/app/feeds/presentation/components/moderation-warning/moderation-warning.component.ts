import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Text social-service puts in `content` when a blocked post/comment is redacted
 * for non-moderators. It is a protocol sentinel (must match the backend), never
 * shown to users: the warning below renders its own English message instead.
 */
export const BLOCKED_PLACEHOLDER = 'Contenido bloqueado por moderación.';

/**
 * Soft-censorship warning covering a post or comment hidden by moderation.
 * The content is still available: the user decides whether to see it.
 */
@Component({
  selector: 'app-moderation-warning',
  templateUrl: './moderation-warning.component.html',
})
export class ModerationWarningComponent {
  @Input() blocked = false;
  @Input() canReveal = true;
  @Input() compact = false;

  @Output() reveal = new EventEmitter<void>();
}
