/**
 * Netlify Serverless Function: /api/analyze
 *
 * SECURE server-side function. Supports legacy single requests as well as
 * action-based dispatching ('pagespeed' or 'code').
 *
 * For parallel scanning, frontend invokes:
 *   - /.netlify/functions/analyze-pagespeed
 *   - /.netlify/functions/analyze-code
 */

import { handler as pagespeedHandler } from './analyze-pagespeed.mjs';
import { handler as codeHandler } from './analyze-code.mjs';
import { getCorsHeaders } from './utils/cors.mjs';
import { verifySupabaseAuth } from './utils/auth.mjs';

export const handler = async (event) => {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Verify Supabase JWT Authentication
  const auth = await verifySupabaseAuth(event);
  if (!auth.authenticated) {
    return {
      statusCode: auth.statusCode || 401,
      headers,
      body: JSON.stringify({ error: auth.error || 'Unauthorized' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { action } = payload;

    // Dispatch based on action parameter
    if (action === 'pagespeed') {
      return await pagespeedHandler(event);
    }
    if (action === 'code') {
      return await codeHandler(event);
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Invalid or missing action parameter. Specify action: "pagespeed" or action: "code".',
      }),
    };
  } catch (err) {
    console.error('[Analyze] Unexpected error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error. Please try again later.' }),
    };
  }
};
