export const environment = {
  production: false,
  apiIdentity: '/api/identity',
  apiSocial: '/api/social',
  apiSearch: '/api/search',
  apiPredictive: '/api/predictive',
  apiAnalytics: '/api/analytics',
  wsUrl: `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws`,
};
