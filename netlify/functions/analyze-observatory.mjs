/**
 * Netlify Serverless Function: /.netlify/functions/analyze-observatory
 *
 * Server-side proxy for the MDN / Mozilla HTTP Observatory v2 API.
 * Bypasses any browser CORS or strict corporate proxy limitations.
 */

import { getCorsHeaders } from './utils/cors.mjs';
import { verifySupabaseAuth } from './utils/auth.mjs';

export const handler = async (event) => {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
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
    let host = payload.host || payload.url || '';

    if (!host) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing host or url parameter' }),
      };
    }

    // Clean hostname
    host = host
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '')
      .trim()
      .toLowerCase();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const apiUrl = `https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(host)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SiteProof-Security-Auditor/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Mozilla Observatory API error: HTTP ${response.status}`,
          details: errorText,
          host,
        }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('[Analyze Observatory] Error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to contact Mozilla Observatory API',
        message: err.message,
      }),
    };
  }
};
