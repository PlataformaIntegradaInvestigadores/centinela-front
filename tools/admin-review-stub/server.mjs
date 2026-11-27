// Local test double for the admin review module. Synthetic data only; never point it at real data.
// It follows governance-service review-cases (ADR 0003, D6, ADR 0007) plus the proposed case list
// and RAG section described in docs/admin-review.md. Usage: node tools/admin-review-stub/server.mjs
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.STUB_PORT ?? 8099);
const TOKEN = 'stub-admin-token';
const HOUR = 3600 * 1000;
const RISK = new Set([
  'PARTIAL_GENERATION',
  'SOURCE_EVIDENCE_INCOMPLETE',
  'RAG_CITATION_WITHOUT_BLOCK',
]);

const articles = {
  'SYN-A01': {
    title: 'Reutilización de datos abiertos en universidades andinas (sintético)',
    abstract:
      'Encuesta a 412 investigadores. El 35 % declaró haber reutilizado datos abiertos en el último año. La barrera más citada fue la falta de metadatos descriptivos.',
  },
  'SYN-A02': {
    title: 'Revisión abierta en dos revistas regionales (sintético)',
    abstract:
      'Se compararon 180 manuscritos. El tiempo medio hasta la decisión fue de 92 días con revisión abierta y de 95 días con revisión ciega. El estudio no analiza costos de publicación.',
  },
  'SYN-A03': {
    title: 'Depósito de tesis y descargas (sintético)',
    abstract:
      'En una universidad, las tesis depositadas en el repositorio tuvieron 2,1 veces más descargas. El análisis no controla el área de conocimiento.',
  },
};

const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const policyQa = { policy_id: 'search-qa-review', version: 'draft-1' };

const cases = [
  {
    case_id: 'qa-0001-revision-abierta',
    assessment_id: randomUUID(),
    created_at: iso(now - 3 * HOUR),
    expires_at: iso(now + 21 * HOUR),
    policy: policyQa,
    reason_codes: ['HUMAN_REVIEW_REQUIRED'],
    qa_pairs: [
      {
        question: '¿Cuántos manuscritos se compararon?',
        answer: 'Se compararon 180 manuscritos de dos revistas regionales.',
      },
      {
        question: '¿Qué efecto tuvo la revisión abierta?',
        answer: 'La revisión abierta redujo el tiempo de decisión de forma notable.',
      },
      {
        question: '¿Cuál fue el tiempo con revisión ciega?',
        answer: 'Con revisión ciega, la decisión tardó en promedio 95 días.',
      },
    ],
    source_article_ids: ['SYN-A02'],
  },
  {
    case_id: 'qa-0002-fuente-incompleta',
    assessment_id: randomUUID(),
    created_at: iso(now - 22.5 * HOUR),
    expires_at: iso(now + 1.5 * HOUR),
    policy: policyQa,
    reason_codes: ['HUMAN_REVIEW_REQUIRED', 'SOURCE_EVIDENCE_INCOMPLETE'],
    qa_pairs: [
      {
        question: '¿Qué porcentaje reutilizó datos abiertos?',
        answer: 'El 35 % de los investigadores encuestados.',
      },
      {
        question: '¿Cuál fue la barrera principal?',
        answer: 'La falta de metadatos descriptivos.',
      },
      {
        question: '¿Cuántas personas respondieron?',
        answer: 'Respondieron 412 investigadores.',
      },
    ],
    source_article_ids: ['SYN-A01', 'SYN-X99'],
  },
  {
    case_id: 'reco-0001-sin-metadatos',
    assessment_id: randomUUID(),
    created_at: iso(now - 5 * HOUR),
    expires_at: iso(now + 19 * HOUR),
    policy: { policy_id: 'ethical-recommender', version: 'reco-draft-3' },
    reason_codes: ['PROTECTED_ATTRIBUTE_UNKNOWN'],
    recommendation: {
      model: 'r1',
      recommendations: [1, 2, 3, 4, 5].map((rank) => ({
        rank,
        author_id: `author-${rank}`,
        institution:
          rank === 5
            ? 'UNKNOWN'
            : ['Inst. Norte', 'Inst. Sur', 'Inst. Costa', 'Inst. Sierra'][rank - 1],
        low_visibility: rank === 4,
        selection_reason: rank === 4 ? 'quota' : 'relevance',
        relevance_norm: Number((1 - rank * 0.08).toFixed(3)),
        institution_novelty: rank % 2 ? 1 : 0.5,
        final_score: Number((0.8 * (1 - rank * 0.08) + 0.2 * (rank % 2 ? 1 : 0.5)).toFixed(3)),
      })),
      fairness_metrics: {
        low_visibility_share: 0.2,
        pool_low_visibility_share: 0.06,
        quota_picks: 1,
      },
      diagnostics: { quota_shortfalls: 0, cap_relaxations: 0 },
      parameters: {
        rerank: {
          lambda_: 0.8,
          max_per_institution: 3,
          min_protected_share: 0.2,
          relevance_floor: 0.5,
          mode: 'prefix',
        },
      },
    },
    review_plan: { outcome: 'modify', retained_ranks: [1, 2, 3, 4] },
  },
  {
    case_id: 'rag-0001-cita-sin-bloque',
    assessment_id: randomUUID(),
    created_at: iso(now - 1 * HOUR),
    expires_at: iso(now + 23 * HOUR),
    policy: { policy_id: 'rag-ask-review', version: 'draft-1' },
    reason_codes: ['HUMAN_REVIEW_REQUIRED', 'RAG_CITATION_WITHOUT_BLOCK'],
    rag: {
      query: '¿Depositar la tesis aumenta su visibilidad?',
      answer_text:
        'En una universidad, las tesis depositadas tuvieron 2,1 veces más descargas [1].\n\nEste efecto se repite en todas las universidades del país [3].',
      blocks: [
        {
          cite_id: 'SYN-A03',
          title: articles['SYN-A03'].title,
          text: articles['SYN-A03'].abstract,
        },
        {
          cite_id: 'SYN-A01',
          title: articles['SYN-A01'].title,
          text: articles['SYN-A01'].abstract,
        },
      ],
      cited_positions: [1, 3],
    },
  },
  {
    case_id: 'qa-0003-vencido',
    assessment_id: randomUUID(),
    created_at: iso(now - 30 * HOUR),
    expires_at: iso(now - 6 * HOUR),
    policy: policyQa,
    reason_codes: ['HUMAN_REVIEW_REQUIRED', 'PARTIAL_GENERATION'],
    qa_pairs: [{ question: '¿Cuántas descargas más?', answer: '3,5 veces más descargas.' }],
    source_article_ids: ['SYN-A03'],
  },
];

const resolutions = new Map();

function caseType(c) {
  return c.recommendation ? 'recommendation' : c.rag ? 'rag' : 'qa';
}

function status(c) {
  const r = resolutions.get(c.case_id);
  if (r) return r.outcome;
  return Date.now() >= Date.parse(c.expires_at) ? 'expired' : 'pending';
}

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

const fail = (res, code, errorCode) => send(res, code, { code: errorCode, trace_id: randomUUID() });

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve(null);
      }
    });
  });
}

function resolve(c, body) {
  const type = caseType(c);
  const outcome = body.outcome;
  const justification = typeof body.justification === 'string' ? body.justification.trim() : '';
  if (!['approve', 'modify', 'reject'].includes(outcome) || justification.length > 2000) {
    return [422, 'INVALID_REQUEST'];
  }
  const existing = resolutions.get(c.case_id);
  if (existing)
    return [409, existing.outcome === 'expired' ? 'CASE_EXPIRED' : 'CASE_ALREADY_RESOLVED'];
  if (Date.now() >= Date.parse(c.expires_at)) {
    resolutions.set(c.case_id, {
      resolution_id: randomUUID(),
      outcome: 'expired',
      resolved_at: iso(Date.now()),
      supervisor: null,
      justification: null,
    });
    return [409, 'CASE_EXPIRED'];
  }
  let departed;
  if (type === 'recommendation') {
    const ranks = body.retained_ranks;
    const all = c.recommendation.recommendations.map((p) => p.rank);
    if ((outcome === 'modify') !== Array.isArray(ranks))
      return [422, 'INVALID_RECOMMENDATION_RESOLUTION'];
    if (ranks && (!ranks.length || ranks.join() !== all.filter((r) => ranks.includes(r)).join())) {
      return [422, 'INVALID_RECOMMENDATION_RESOLUTION'];
    }
    if (!justification) return [422, 'JUSTIFICATION_REQUIRED'];
    const plan = c.review_plan;
    departed =
      outcome !== plan.outcome ||
      (outcome === 'modify' && ranks.join() !== plan.retained_ranks.join());
  } else {
    const needs = outcome !== 'approve' || c.reason_codes.some((code) => RISK.has(code));
    if (needs && !justification) return [422, 'JUSTIFICATION_REQUIRED'];
    const edit = type === 'rag' ? body.answer_text : body.qa_pairs;
    if ((outcome === 'modify') !== (edit !== undefined)) return [422, 'INVALID_REQUEST'];
  }
  const resolution = {
    resolution_id: randomUUID(),
    outcome,
    resolved_at: iso(Date.now()),
    supervisor: { identity_id: 'admin', display_name: 'Administrador de Centinela' },
    justification: justification || null,
    ...(type === 'recommendation'
      ? { proposed_outcome: c.review_plan.outcome, departed_from_plan: departed }
      : {}),
  };
  resolutions.set(c.case_id, resolution);
  return [201, { case_id: c.case_id, ...resolution }];
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'POST' && path === '/api/search/v1/auth/login/') {
    return send(res, 200, { token: TOKEN, expires_in: 3600 });
  }
  const article = path.match(/^\/api\/search\/v2\/articles\/([^/]+)$/);
  if (req.method === 'GET' && article) {
    const found = articles[decodeURIComponent(article[1])];
    return found
      ? send(res, 200, { scopus_id: article[1], citations: 0, ...found })
      : send(res, 404, { detail: 'Not found' });
  }
  if (!path.startsWith('/api/governance/review-cases')) {
    return send(res, 404, { detail: 'Not Found' });
  }
  const token = req.headers['x-admin-token'];
  if (!token) return fail(res, 401, 'AUTHENTICATION_REQUIRED');
  if (token !== TOKEN) return fail(res, 403, 'ADMIN_TOKEN_REJECTED');

  if (req.method === 'GET' && path === '/api/governance/review-cases/') {
    const wanted = url.searchParams.get('status') ?? 'pending';
    const type = url.searchParams.get('case_type');
    const items = cases
      .filter((c) => status(c) === wanted && (!type || caseType(c) === type))
      .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))
      .map((c) => ({
        case_id: c.case_id,
        case_type: caseType(c),
        created_at: c.created_at,
        expires_at: c.expires_at,
        status: status(c),
        policy: c.policy,
        reason_codes: c.reason_codes,
      }));
    return send(res, 200, { items, next_cursor: null });
  }
  const match = path.match(/^\/api\/governance\/review-cases\/([^/]+)(\/resolution)?$/);
  const found = match && cases.find((c) => c.case_id === decodeURIComponent(match[1]));
  if (!found) return fail(res, 404, 'CASE_NOT_FOUND');
  if (req.method === 'GET' && !match[2]) {
    const { ...view } = found;
    return send(res, 200, {
      ...view,
      status: status(found),
      resolution: resolutions.get(found.case_id) ?? null,
    });
  }
  if (req.method === 'POST' && match[2]) {
    const body = await readBody(req);
    if (!body) return fail(res, 422, 'INVALID_REQUEST');
    const [code, result] = resolve(found, body);
    return typeof result === 'string' ? fail(res, code, result) : send(res, code, result);
  }
  return send(res, 405, { detail: 'Method Not Allowed' });
}).listen(PORT, '127.0.0.1', () => console.log(`admin review stub on http://127.0.0.1:${PORT}`));
