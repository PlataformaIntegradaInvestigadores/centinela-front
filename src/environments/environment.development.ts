export const environment = {
  production: false,
  apiIdentity: '/api/identity',
  apiSocial: '/api/social',
  apiSearch: '/api/search',
  apiPredictive: '/api/predictive',
  apiAnalytics: '/api/analytics',
  // ethical-recommender-service (FastAPI). gateway-service routes /api/recommender/* to
  // ethical-recommender-service:8007/api/v1/* (health: /api/recommender/health -> /health).
  // Local dev: proxy.conf.json mirrors that rewrite against uvicorn on http://localhost:8000.
  apiRecommender: '/api/recommender',
  wsUrl: `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws`,
};
