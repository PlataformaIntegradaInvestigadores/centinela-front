import { Component, EventEmitter, Input, Output } from '@angular/core';

export const BLOCKED_PLACEHOLDER = 'Contenido bloqueado por moderación.';

/**
 * Advertencia que tapa un post o comentario ocultado por moderación.
 * El contenido sigue disponible: el usuario decide si lo ve.
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
