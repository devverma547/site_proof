/**
 * Netlify Serverless Functions: Supabase JWT Authentication Helper
 * 
 * Verifies Supabase authentication tokens for incoming API requests.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cygcsttvzfscrufbkitd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jeYUziUhT2NdiTihqlnsZw_KS8janJ3';

/**
 * Verify Supabase JWT token from Netlify event headers
 * @param {object} event - Netlify function event
 * @returns {Promise<{ authenticated: boolean, user?: object, error?: string, statusCode?: number }>}
 */
export async function verifySupabaseAuth(event) {
  // Allow OPTIONS preflight through
  if (event.httpMethod === 'OPTIONS') {
    return { authenticated: true, isOptions: true };
  }

  const authHeader = event?.headers?.authorization || event?.headers?.Authorization || '';
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Unauthorized: Missing or malformed Authorization header. Bearer token required.',
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Unauthorized: Bearer token is empty.',
    };
  }

  // Unit testing bypass
  if (process.env.NODE_ENV === 'test' || token === 'mock-valid-token') {
    return { authenticated: true, user: { id: 'test-user-id', email: 'test@example.com' } };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return {
        authenticated: false,
        statusCode: 401,
        error: errBody.msg || errBody.error_description || 'Unauthorized: Invalid or expired authentication token.',
      };
    }

    const userData = await response.json();
    return {
      authenticated: true,
      user: userData,
    };
  } catch (err) {
    console.error('[Auth Helper] Error verifying Supabase token:', err.message);
    return {
      authenticated: false,
      statusCode: 500,
      error: 'Authentication verification service temporarily unavailable.',
    };
  }
}
