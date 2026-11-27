import { CaseType, GovernanceError, ReviewOutcome, ReviewPlan } from './review.interface';

export const MAX_JUSTIFICATION_LENGTH = 2000;

/**
 * Codes that flag a defect: approving output that carries one overrides the
 * evaluator (ADR 0003). `RAG_CITATION_WITHOUT_BLOCK` follows the draft RAG contract.
 */
const RISK_REASON_CODES = new Set([
  'PARTIAL_GENERATION',
  'SOURCE_EVIDENCE_INCOMPLETE',
  'RAG_CITATION_WITHOUT_BLOCK',
]);

/** Mirrors the service: the UI asks early, the service still decides (422). */
export function justificationRequired(
  caseType: CaseType,
  outcome: ReviewOutcome,
  reasonCodes: string[],
): boolean {
  if (caseType === 'recommendation' || outcome !== 'approve') {
    return true;
  }
  return reasonCodes.some((code) => RISK_REASON_CODES.has(code));
}

/** ADR 0007: a different outcome or a different rank subset departs from the plan. */
export function departsFromPlan(
  plan: ReviewPlan,
  outcome: ReviewOutcome,
  ranks: number[] | null,
): boolean {
  if (outcome !== plan.outcome) {
    return true;
  }
  if (outcome !== 'modify') {
    return false;
  }
  const proposed = plan.retained_ranks;
  return !ranks || ranks.length !== proposed.length || ranks.some((r, i) => r !== proposed[i]);
}

/** Positions `[n]` cited in a RAG answer, in order of first appearance. */
export function citedPositions(answer: string): number[] {
  const positions: number[] = [];
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    const position = Number(match[1]);
    if (!positions.includes(position)) {
      positions.push(position);
    }
  }
  return positions;
}

const REASON_LABELS: Record<string, string> = {
  HUMAN_REVIEW_REQUIRED: 'La política exige revisión humana',
  PARTIAL_GENERATION: 'Generación parcial: faltan pares',
  SOURCE_EVIDENCE_INCOMPLETE: 'Alguna fuente no tiene identificador',
  FAIRNESS_DISABLED: 'Equidad desactivada',
  FAIRNESS_WEAKENED: 'Parámetros de equidad más laxos que R1',
  INSTITUTION_CONCENTRATION: 'Perfiles por encima del tope por institución',
  LOW_VISIBILITY_QUOTA_UNMET: 'Cuota de baja visibilidad incumplida',
  PROTECTED_ATTRIBUTE_UNKNOWN: 'Perfil sin metadatos',
  FAIRNESS_MONITOR_REVIEW: 'El monitor de ventanas pide revisión',
  INSTITUTION_CAP_RELAXED_REPORTED: 'Tope relajado e informado',
  LOW_VISIBILITY_SHORTFALL_REPORTED: 'Déficit de cuota informado',
  BASELINE_WITHOUT_FAIRNESS: 'Lista base sin equidad',
  RAG_CITATION_WITHOUT_BLOCK: 'Cita [n] sin bloque correspondiente',
};

export function reasonLabel(code: string): string {
  return REASON_LABELS[code] ?? code;
}

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  qa: 'Preguntas y respuestas',
  recommendation: 'Recomendador',
  rag: 'Gestión documental (RAG)',
};

export const OUTCOME_LABELS: Record<string, string> = {
  approve: 'Aprobado',
  modify: 'Modificado',
  reject: 'Rechazado',
  expired: 'Vencido',
  pending: 'Pendiente',
};

const ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: 'La sesión de administrador no está activa. Vuelve a iniciar sesión.',
  ADMIN_TOKEN_REJECTED:
    'El token de administrador venció o fue rechazado. Vuelve a iniciar sesión.',
  CASE_NOT_FOUND: 'No existe un expediente con ese identificador.',
  CASE_EXPIRED: 'El plazo de revisión venció: la salida queda denegada y no puede liberarse.',
  CASE_ALREADY_RESOLVED:
    'El expediente ya tiene otra resolución. Las resoluciones son definitivas.',
  JUSTIFICATION_REQUIRED: 'Esta decisión exige una justificación.',
  INVALID_RECOMMENDATION_RESOLUTION:
    'La selección no es válida: elige un subconjunto no vacío de rangos, en su orden original.',
  INVALID_REQUEST: 'La solicitud no es válida. Revisa los campos.',
  ADMIN_VERIFIER_UNAVAILABLE: 'El verificador de administrador no responde. Intenta más tarde.',
  SUPERVISION_NOT_CONFIGURED: 'La supervisión no está configurada en el servicio.',
  CASE_LIST_UNAVAILABLE:
    'El servicio todavía no publica el listado de expedientes. Abre un expediente por su ID.',
  NETWORK_ERROR: 'No hay conexión con el servicio de gobernanza.',
};

export function errorMessage(error: GovernanceError): string {
  return ERROR_MESSAGES[error.code] ?? `Error inesperado del servicio (${error.status}).`;
}

/** Time left before a case expires, in words; `null` once it is due. */
export function timeLeft(expiresAt: string, now: number): string | null {
  const minutes = Math.floor((Date.parse(expiresAt) - now) / 60000);
  if (minutes < 0) {
    return null;
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours} h ${minutes % 60} min`;
  }
  return `${Math.floor(hours / 24)} días`;
}

/** Less than this left: the inbox marks the case as urgent. */
export const URGENT_MS = 2 * 60 * 60 * 1000;

/** What each outcome does to the requester, by case type, in the reviewer's words. */
export const CONSEQUENCES: Record<CaseType, Record<ReviewOutcome, string>> = {
  qa: {
    approve: 'El usuario recibe la respuesta tal como está.',
    modify: 'El usuario recibe tu versión corregida de los pares.',
    reject: 'El usuario no recibe la respuesta.',
  },
  recommendation: {
    approve: 'El usuario recibe la lista completa, sin nombres.',
    modify: 'El usuario recibe la lista sin los perfiles que retires.',
    reject: 'El usuario no recibe ninguna recomendación.',
  },
  rag: {
    approve: 'El usuario recibe la respuesta y sus fuentes tal como están.',
    modify: 'El usuario recibe tu respuesta corregida.',
    reject: 'El usuario no recibe la respuesta.',
  },
};

export const OUTCOME_VERBS: Record<ReviewOutcome, string> = {
  approve: 'Aprobar',
  modify: 'Modificar',
  reject: 'Rechazar',
};

/** When the justification is required, said before the reviewer picks an outcome. */
export function justificationHint(caseType: CaseType, reasonCodes: string[]): string {
  return justificationRequired(caseType, 'approve', reasonCodes)
    ? 'obligatoria'
    : 'obligatoria para modificar o rechazar';
}

const SELECTION_LABELS: Record<string, string> = {
  relevance: 'Relevancia',
  quota: 'Cuota de baja visibilidad',
  cap_relaxed: 'Tope relajado',
};

export function selectionLabel(reason: string | undefined): string {
  return reason ? (SELECTION_LABELS[reason] ?? reason) : '—';
}

const METRIC_LABELS: Record<string, string> = {
  low_visibility_share: 'Baja visibilidad en la lista',
  pool_low_visibility_share: 'Baja visibilidad entre los candidatos',
  quota_picks: 'Perfiles elegidos por cuota',
  quota_shortfalls: 'Déficit de cuota informado',
  cap_relaxations: 'Relajaciones del tope',
  lambda_: 'Peso de la relevancia (λ)',
  max_per_institution: 'Tope por institución',
  min_protected_share: 'Cuota mínima de baja visibilidad',
  relevance_floor: 'Piso de relevancia',
  mode: 'Modo de reordenamiento',
};

export function metricLabel(key: string): string {
  return METRIC_LABELS[key] ?? key;
}
