import { Component, Input, OnDestroy } from '@angular/core';
import {
  faArrowDown,
  faArrowUp,
  faBuildingColumns,
  faCheck,
  faEnvelope,
  faEye,
  faMinus,
  faScaleBalanced,
  faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { RecommendedProfile } from '../../../domain/entities/team-recommendation.interface';

export interface CandidateBadge {
  label: string;
  tooltip: string;
  icon: IconDefinition;
  classes: string;
}

/** Tiempo que permanece visible el aviso «Enlace copiado…». */
export const INVITE_FEEDBACK_MS = 3500;

/** idle = sin acción; copied = enlace en el portapapeles; manual = modal para copiarlo a mano. */
export type InviteState = 'idle' | 'copied' | 'manual';

/**
 * Tarjeta de un candidato recomendado: rango, movimiento vs. línea base, relevancia y badges.
 * «Invitar al equipo» es un MOCK: copia un enlace de registro con el ID Scopus del candidato
 * (sin API de invitaciones todavía); si el portapapeles no está disponible abre un modal.
 */
@Component({
  selector: 'app-recommended-candidate-card',
  templateUrl: './recommended-candidate-card.component.html',
  styleUrls: ['./recommended-candidate-card.component.css'],
})
export class RecommendedCandidateCardComponent implements OnDestroy {
  @Input({ required: true }) candidate!: RecommendedProfile;
  /** Con el re-ranking desactivado no se muestra el movimiento respecto a la línea base. */
  @Input() fairnessEnabled = true;

  readonly faBuildingColumns = faBuildingColumns;
  readonly faArrowUp = faArrowUp;
  readonly faArrowDown = faArrowDown;
  readonly faMinus = faMinus;
  readonly faEnvelope = faEnvelope;
  readonly faCheck = faCheck;

  inviteState: InviteState = 'idle';
  private feedbackTimer?: ReturnType<typeof setTimeout>;

  ngOnDestroy(): void {
    clearTimeout(this.feedbackTimer);
  }

  /** Sin dato de cuenta (mock) se asume que puede invitarse; se oculta solo si ya la tiene. */
  get canInvite(): boolean {
    return this.candidate.has_account !== true;
  }

  /** Enlace de invitación (mock): registro en Centinela con el ID Scopus del candidato. */
  get inviteLink(): string {
    const params = new URLSearchParams({ invite: this.candidate.author_id, ref: 'team-builder' });
    return `${window.location.origin}/register?${params.toString()}`;
  }

  get inviteMessage(): string {
    return `Enlace copiado para invitar a ${this.displayName}`;
  }

  /**
   * Copia el enlace al portapapeles. Promise.resolve envuelve la promesa nativa del navegador
   * para que el callback corra dentro de la zona de Angular (detección de cambios).
   */
  invite(): Promise<void> {
    clearTimeout(this.feedbackTimer);
    if (!navigator.clipboard?.writeText) {
      this.inviteState = 'manual';
      return Promise.resolve();
    }
    return Promise.resolve(navigator.clipboard.writeText(this.inviteLink)).then(
      () => {
        this.inviteState = 'copied';
        this.feedbackTimer = setTimeout(() => (this.inviteState = 'idle'), INVITE_FEEDBACK_MS);
      },
      () => {
        this.inviteState = 'manual';
      },
    );
  }

  closeInvite(): void {
    clearTimeout(this.feedbackTimer);
    this.inviteState = 'idle';
  }

  get displayName(): string {
    return this.candidate.name?.trim() || `Autor Scopus ${this.candidate.author_id}`;
  }

  get initials(): string {
    const letters = this.displayName
      .replace(/[^\p{L}\s-]/gu, ' ')
      .split(/[\s-]+/)
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase());
    return letters.slice(0, 2).join('') || '?';
  }

  /** Posiciones ganadas (>0) o perdidas (<0) frente al orden por relevancia pura. */
  get movement(): number {
    return this.candidate.baseline_rank - this.candidate.rank;
  }

  get movementLabel(): string {
    const steps = Math.abs(this.movement);
    if (steps === 0) {
      return 'Sin cambio';
    }
    const noun = steps === 1 ? 'puesto' : 'puestos';
    return this.movement > 0 ? `Sube ${steps} ${noun}` : `Baja ${steps} ${noun}`;
  }

  get movementIcon(): IconDefinition {
    if (this.movement > 0) {
      return faArrowUp;
    }
    return this.movement < 0 ? faArrowDown : faMinus;
  }

  /** Relevancia normalizada (0–100) dentro del grupo de candidatos K-NN. */
  get relevancePercent(): number {
    const value = Number.isFinite(this.candidate.relevance_norm)
      ? this.candidate.relevance_norm
      : 0;
    return Math.round(Math.min(1, Math.max(0, value)) * 100);
  }

  get badges(): CandidateBadge[] {
    const badges: CandidateBadge[] = [];
    if (this.candidate.low_visibility) {
      badges.push({
        label: 'Baja visibilidad',
        tooltip: 'Perfil con pocas publicaciones o coautorías en el corpus (grupo protegido).',
        icon: faEye,
        classes: 'bg-amber-50 text-amber-800 ring-amber-200',
      });
    }
    if (this.candidate.selection_reason === 'quota') {
      badges.push({
        label: 'Priorizado por equidad',
        tooltip:
          'Promovido por la cuota mínima de perfiles de baja visibilidad del re-ranking R1 (20 %).',
        icon: faScaleBalanced,
        classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
      });
    }
    if (this.candidate.selection_reason === 'cap_relaxed') {
      badges.push({
        label: 'Cupo institucional relajado',
        tooltip: 'Se superó el tope de 3 investigadores por institución por falta de candidatos.',
        icon: faSitemap,
        classes: 'bg-sky-50 text-sky-800 ring-sky-200',
      });
    }
    return badges;
  }
}
