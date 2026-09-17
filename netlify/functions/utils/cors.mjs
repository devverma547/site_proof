/**
 * Netlify Serverless Functions: CORS Origin & Header Helper
 * 
 * Replaces insecure wildcard Access-Control-Allow-Origin: '*'
 * with dynamic origin verification for production and local environments.
 */

const ALLOWED_ORIGINS = [
  'https://vibe-codding-site.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8888',
];

/**
 * Check if the given origin is allowed
 * @param {string} origin 
 * @returns {boolean}
 */
export function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  // Exact match in whitelist
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Allow Netlify branch deploy previews (e.g. https://<deploy-id>--vibe-codding-site.netlify.app)
  if (/^https:\/\/[a-z0-9-]+--vibe-codding-site\.netlify\.app$/i.test(origin)) {
    return true;
  }

  // Allow local development on any port
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Generate CORS headers for incoming request
 * @param {object} event - Netlify function event
 * @returns {object} CORS response headers
 */
export function getCorsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || '';
  
  // Determine allowed origin header
  const allowOrigin = isAllowedOrigin(origin) 
    ? origin 
    : 'https://vibe-codding-site.netlify.app';

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
