import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedDecision {
  hasUnsavedDecision(): boolean;
}

export const UNSAVED_DECISION_MESSAGE =
  'Tienes una decisión sin enviar en este expediente. Si sales, se perderá. ¿Salir de todos modos?';

/** Asks before leaving a case with a decision or justification not yet sent. */
export const unsavedDecisionGuard: CanDeactivateFn<HasUnsavedDecision> = (component) =>
  !component.hasUnsavedDecision() || window.confirm(UNSAVED_DECISION_MESSAGE);
