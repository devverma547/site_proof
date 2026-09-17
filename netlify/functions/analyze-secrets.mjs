/**
 * Netlify Serverless Function: /.netlify/functions/analyze-secrets
 *
 * Scans a target website's public HTML and JavaScript bundles for leaked
 * API keys, secret tokens, and service-role credentials.
 *
 * NO external API keys required — runs entirely on regex pattern matching.
 *
 * Flow:
 *   1. Fetch the target site's HTML (server-side, avoids CORS)
 *   2. Extract all <script src="..."> tags
 *   3. Download up to 5 JS bundles in parallel (max 2MB each)
 *   4. Scan bundle content against 10+ high-precision secret signatures
 *   5. Redact all findings — never return raw keys
 *   6. Return structured JSON with findings, severity, and remediation
 */

import { lookup } from 'node:dns/promises';
import { getCorsHeaders } from './utils/cors.mjs';
import { verifySupabaseAuth } from './utils/auth.mjs';

// ─── Secret Signature Patterns ────────────────────────────────────────────────
// Each pattern: { id, name, regex, severity, prefix (for fast pre-filter), remediation }
// REDOS PROTECTION: Every pattern uses fixed-length quantifiers or simple character classes.
// The `prefix` field enables O(1) indexOf pre-filtering before regex runs.
const SECRET_PATTERNS = [
  {
    id: 'openai-api-key',
    name: 'OpenAI API Key',
    regex: /sk-proj-[a-zA-Z0-9_-]{48,120}/g,
    prefixes: ['sk-proj-'],
    severity: 'critical',
    platform: 'OpenAI',
    remediation: 'Revoke this key immediately at https://platform.openai.com/api-keys. Move all OpenAI API calls to a serverless function (Netlify/Vercel) and store the key in environment variables.',
  },
  {
    id: 'openai-api-key-legacy',
    name: 'OpenAI API Key (Legacy)',
    regex: /sk-[a-zA-Z0-9]{20,60}/g,
    prefixes: ['sk-'],
    severity: 'critical',
    platform: 'OpenAI',
    remediation: 'Revoke this key immediately at https://platform.openai.com/api-keys. Move all OpenAI API calls to a serverless function (Netlify/Vercel) and store the key in environment variables.',
  },
  {
    id: 'stripe-secret-key',
    name: 'Stripe Secret Key',
    regex: /sk_live_[0-9a-zA-Z]{24,50}/g,
    prefixes: ['sk_live_'],
    severity: 'critical',
    platform: 'Stripe',
    remediation: 'Revoke this key immediately at https://dashboard.stripe.com/apikeys. Use only Stripe Publishable Keys (pk_live_) on the client. All secret operations must happen server-side.',
  },
  {
    id: 'stripe-restricted-key',
    name: 'Stripe Restricted Key',
    regex: /rk_live_[0-9a-zA-Z]{24,50}/g,
    prefixes: ['rk_live_'],
    severity: 'critical',
    platform: 'Stripe',
    remediation: 'Revoke this key immediately at https://dashboard.stripe.com/apikeys. Restricted keys must only be used server-side.',
  },
  {
    id: 'anthropic-api-key',
    name: 'Anthropic Claude API Key',
    regex: /sk-ant-api03-[a-zA-Z0-9_-]{90,130}/g,
    prefixes: ['sk-ant-api03-'],
    severity: 'critical',
    platform: 'Anthropic',
    remediation: 'Revoke this key at https://console.anthropic.com/settings/keys. Move Claude API calls to a backend function.',
  },
  {
    id: 'github-pat-classic',
    name: 'GitHub Personal Access Token',
    regex: /ghp_[a-zA-Z0-9]{36}/g,
    prefixes: ['ghp_'],
    severity: 'critical',
    platform: 'GitHub',
    remediation: 'Revoke this token at https://github.com/settings/tokens. Never expose GitHub tokens in client-side code.',
  },
  {
    id: 'github-pat-fine',
    name: 'GitHub Fine-Grained PAT',
    regex: /github_pat_[a-zA-Z0-9_]{82,100}/g,
    prefixes: ['github_pat_'],
    severity: 'critical',
    platform: 'GitHub',
    remediation: 'Revoke this token at https://github.com/settings/tokens. Never expose GitHub tokens in client-side code.',
  },
  {
    id: 'aws-access-key',
    name: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    prefixes: ['AKIA'],
    severity: 'critical',
    platform: 'AWS',
    remediation: 'Deactivate this key immediately in the AWS IAM Console. AWS keys in client bundles can be used to spin up resources on your account.',
  },
  {
    id: 'google-api-key',
    name: 'Google / Gemini AI Studio API Key',
    regex: /AIzaSy[0-9A-Za-z_-]{33}/g,
    prefixes: ['AIzaSy'],
    severity: 'high',
    platform: 'Google Cloud',
    remediation: 'Restrict this API key in the Google Cloud Console (https://console.cloud.google.com/apis/credentials) — add HTTP referrer restrictions or move sensitive API calls server-side.',
  },
  {
    id: 'supabase-service-role',
    name: 'Supabase Service Role Key',
    regex: /eyJhbGciOi[A-Za-z0-9_-]{50,500}\.[A-Za-z0-9_-]{50,500}\.[A-Za-z0-9_-]{50,500}/g,
    prefixes: ['eyJhbGciOi'],
    severity: 'critical',
    platform: 'Supabase',
    isJwt: true,
    remediation: 'URGENT: This key bypasses ALL Row Level Security (RLS). Only the anon key should be used in client-side code. Regenerate your service_role key in Supabase Dashboard > Project Settings > API.',
  },
  {
    id: 'sendgrid-api-key',
    name: 'SendGrid API Key',
    regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    prefixes: ['SG.'],
    severity: 'critical',
    platform: 'SendGrid',
    remediation: 'Revoke this key at https://app.sendgrid.com/settings/api_keys. Move email sending to a backend function.',
  },
  {
    id: 'twilio-api-key',
    name: 'Twilio API Key or Auth Token',
    regex: /SK[0-9a-fA-F]{32}/g,
    prefixes: ['SK'],
    severity: 'high',
    platform: 'Twilio',
    remediation: 'Rotate this key in your Twilio Console. Move all Twilio API calls to server-side code.',
  },
  {
    id: 'mailgun-api-key',
    name: 'Mailgun API Key',
    regex: /key-[0-9a-zA-Z]{32}/g,
    prefixes: ['key-'],
    severity: 'high',
    platform: 'Mailgun',
    remediation: 'Regenerate this key in Mailgun Dashboard. Move email API calls to a backend function.',
  },
  {
    id: 'slack-token',
    name: 'Slack Bot / OAuth Token',
    regex: /xoxb-[0-9a-zA-Z-]{10,80}/g,
    prefixes: ['xoxb-', 'xoxp-', 'xoxa-', 'xoxo-'],
    severity: 'high',
    platform: 'Slack',
    remediation: 'Revoke this token at https://api.slack.com/apps. Never use Slack tokens in client-side JavaScript.',
  },
  {
    id: 'private-key-pem',
    name: 'Private Key (PEM format)',
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    prefixes: ['-----BEGIN'],
    severity: 'critical',
    platform: 'Cryptographic',
    remediation: 'CRITICAL: A private key is embedded in your client bundle. Immediately rotate all certificates and keys associated with this private key.',
  },
];

// Safe public key prefixes that should NOT be flagged
const SAFE_PREFIXES = [
  'pk_live_',  // Stripe publishable key (designed to be public)
  'pk_test_',  // Stripe test publishable key
  'sk_test_',  // Stripe test secret (not production)
];

// ─── ReDoS Protection Constants ──────────────────────────────────────────────
const CHUNK_SIZE = 64 * 1024;          // 64KB chunks for regex scanning
const CHUNK_OVERLAP = 512;             // 512 byte overlap to catch tokens spanning chunk boundaries
const PER_PATTERN_BUDGET_MS = 200;     // Max 200ms per pattern per chunk
const TOTAL_SCAN_BUDGET_MS = 5000;     // Max 5s total scan time across all content

// ─── SSRF URL & DNS Protection ────────────────────────────────────────────────

/**
 * Check whether an IP string belongs to a private, loopback, or metadata subnet
 * @param {string} ip
 * @returns {boolean} true if IP is private/internal
 */
export function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return true;

  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return true;
  }

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (Private RFC 1918)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private RFC 1918)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private RFC 1918)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link-Local & Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / Test-Net)
  if ((a === 192 && b === 0) || (a === 198 && b === 51) || (a === 203 && b === 0)) return true;
  // Multicast & Reserved
  if (a >= 224) return true;

  return false;
}

/**
 * Perform DNS resolution check against DNS-based SSRF / Rebinding.
 * TODO: For complete socket-level DNS rebinding immunity, pin the resolved IP at the TCP layer
 * via custom http/https Agent or undici Client dispatcher.
 * @param {string} hostname
 * @returns {Promise<{ safe: boolean, reason?: string, ip?: string }>}
 */
export async function verifyDnsResolution(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return { safe: false, reason: 'Invalid hostname' };
  }

  // If already an IPv4 literal
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return { safe: !isPrivateIp(hostname) };
  }

  try {
    const addresses = await lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return {
          safe: false,
          reason: `Resolved to forbidden private/internal IP (${record.address})`,
          ip: record.address,
        };
      }
    }
    return { safe: true, ip: addresses[0]?.address };
  } catch (err) {
    // If DNS resolution fails entirely, consider unsafe to fetch
    return { safe: false, reason: `DNS resolution failed: ${err.message}` };
  }
}
/**
 * Validate URL to prevent Server-Side Request Forgery (SSRF)
 * Blocks private IP ranges (RFC 1918), loopback, link-local/cloud metadata, non-http(s), and encoded formats.
 * @param {string} rawUrl 
 * @returns {{ safe: boolean, reason?: string, url?: string }}
 */
export function isSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, reason: 'Missing or invalid URL' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: 'Malformed URL' };
  }

  // 1. Only allow HTTP and HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}. Only http: and https: are allowed.` };
  }

  // 2. Reject credentials in URL
  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'URLs with embedded credentials are not allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return { safe: false, reason: 'Missing hostname.' };
  }

  // 3. Reject local and internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.arpa') ||
    hostname.endsWith('.onion')
  ) {
    return { safe: false, reason: 'Local or internal hostnames are forbidden (SSRF protection).' };
  }

  // 4. Reject Cloud Provider Metadata hostnames
  if (
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data' ||
    hostname === 'metadata'
  ) {
    return { safe: false, reason: 'Cloud instance metadata services are forbidden.' };
  }

  // 5. IPv6 checks
  const cleanHost = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

  if (
    cleanHost === '::1' ||
    cleanHost === '::' ||
    cleanHost.startsWith('fe80:') ||
    cleanHost.startsWith('fc00:') ||
    cleanHost.startsWith('fd00:')
  ) {
    return { safe: false, reason: 'Private or loopback IPv6 addresses are forbidden.' };
  }

  // 6. Decimal / Hex / Octal integer IP formats
  if (/^\d+$/.test(cleanHost) || /^0x[0-9a-f]+$/i.test(cleanHost) || /^0[0-7]+$/.test(cleanHost)) {
    return { safe: false, reason: 'Non-standard IP encodings are forbidden.' };
  }

  // 7. IPv4 Range checks
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(cleanHost);
  if (ipv4Match) {
    const parts = [Number(ipv4Match[1]), Number(ipv4Match[2]), Number(ipv4Match[3]), Number(ipv4Match[4])];
    if (parts.some((p) => p < 0 || p > 255)) {
      return { safe: false, reason: 'Invalid IPv4 octets.' };
    }

    const [a, b] = parts;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return { safe: false, reason: 'Loopback IP addresses (127.0.0.0/8) are forbidden.' };

    // 10.0.0.0/8 (Private RFC 1918)
    if (a === 10) return { safe: false, reason: 'Private IP addresses (10.0.0.0/8) are forbidden.' };

    // 172.16.0.0/12 (Private RFC 1918)
    if (a === 172 && b >= 16 && b <= 31) return { safe: false, reason: 'Private IP addresses (172.16.0.0/12) are forbidden.' };

    // 192.168.0.0/16 (Private RFC 1918)
    if (a === 192 && b === 168) return { safe: false, reason: 'Private IP addresses (192.168.0.0/16) are forbidden.' };

    // 169.254.0.0/16 (Link-Local & Cloud Metadata 169.254.169.254)
    if (a === 169 && b === 254) return { safe: false, reason: 'Link-local & cloud metadata addresses (169.254.0.0/16) are forbidden.' };

    // 0.0.0.0/8 (Current network)
    if (a === 0) return { safe: false, reason: 'Zero-address network is forbidden.' };

    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return { safe: false, reason: 'Carrier-grade NAT addresses (100.64.0.0/10) are forbidden.' };

    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / Test-Net)
    if ((a === 192 && b === 0) || (a === 198 && b === 51) || (a === 203 && b === 0)) {
      return { safe: false, reason: 'Reserved documentation/testing IP addresses are forbidden.' };
    }

    // Multicast & Reserved (224.0.0.0/4 and above)
    if (a >= 224) return { safe: false, reason: 'Multicast and reserved addresses are forbidden.' };
  }

  return { safe: true, url: parsed.href };
}

// ─── Core Handler ─────────────────────────────────────────────────────────────

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
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: url' }),
      };
    }

    // SSRF URL Validation
    const urlValidation = isSafeUrl(url);
    if (!urlValidation.safe) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid URL: ${urlValidation.reason}`,
          isBlocked: true,
        }),
      };
    }

    const scanResult = await scanForSecrets(urlValidation.url || url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scanResult),
    };
  } catch (err) {
    console.error('[Analyze-Secrets] Unexpected error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(buildFallbackResult(null, 'Scan error encountered')),
    };
  }
};

// ─── Main Scan Orchestrator ───────────────────────────────────────────────────

async function scanForSecrets(url) {
  const startTime = Date.now();
  const warnings = [];

  // Step 1: Fetch target site HTML
  let html = '';
  try {
    html = await fetchPage(url);
  } catch (err) {
    console.warn('[Analyze-Secrets] Failed to fetch target HTML:', err.message);
    warnings.push(`Could not fetch target site HTML: ${err.message}`);
    return buildFallbackResult(url, err.message, warnings);
  }

  // Step 2: Extract script sources
  const scriptUrls = extractScriptSources(html, url);

  // Step 3: Also extract inline script content
  const inlineScripts = extractInlineScripts(html);

  // Step 4: Download external JS bundles in parallel (max 5, 2MB cap each)
  const bundles = await downloadBundles(scriptUrls.slice(0, 5));

  // Step 5: Combine all scannable content
  const allContent = [
    ...inlineScripts.map((code, i) => ({ source: `inline-script-${i + 1}`, content: code })),
    ...bundles,
  ];

  // Step 6: Run secret pattern scanning
  const findings = [];
  for (const { source, content } of allContent) {
    if (!content || content.length < 10) continue;
    const matches = scanContent(content, source);
    findings.push(...matches);
  }

  // Step 7: Deduplicate findings (same key type found in multiple bundles)
  const deduped = deduplicateFindings(findings);

  const elapsed = Date.now() - startTime;

  return {
    url,
    totalLeaks: deduped.length,
    findings: deduped,
    bundlesScanned: bundles.length,
    inlineScriptsScanned: inlineScripts.length,
    totalScriptsFound: scriptUrls.length,
    scanTimeMs: elapsed,
    severity: deduped.length > 0
      ? (deduped.some(f => f.severity === 'critical') ? 'critical' : 'high')
      : 'pass',
    grade: deduped.length === 0 ? 'PASS' : (deduped.some(f => f.severity === 'critical') ? 'FAIL' : 'WARN'),
    warnings,
    source: 'siteproof-secret-scanner',
    scannedAt: new Date().toISOString(),
  };
}

// ─── HTML Fetcher ─────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const urlCheck = isSafeUrl(url);
  if (!urlCheck.safe) {
    throw new Error(`SSRF Blocked: ${urlCheck.reason}`);
  }

  // DNS-based SSRF Resolution check
  try {
    const parsed = new URL(url);
    const dnsCheck = await verifyDnsResolution(parsed.hostname);
    if (!dnsCheck.safe) {
      throw new Error(`SSRF Blocked: ${dnsCheck.reason}`);
    }
  } catch (err) {
    if (err.message.startsWith('SSRF Blocked')) throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SiteProof-SecretScanner/1.0 (security audit)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // Cap HTML to 5MB to prevent memory issues
    const text = await response.text();
    return text.slice(0, 5 * 1024 * 1024);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Script Extraction ────────────────────────────────────────────────────────

function extractScriptSources(html, baseUrl) {
  const sources = [];
  // Match <script src="..."> tags
  const srcRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = srcRegex.exec(html)) !== null) {
    let src = match[1];

    // Skip known safe/irrelevant scripts
    if (src.includes('google-analytics.com') ||
        src.includes('googletagmanager.com') ||
        src.includes('cdn.jsdelivr.net') ||
        src.includes('cdnjs.cloudflare.com') ||
        src.includes('unpkg.com') ||
        src.includes('facebook.net') ||
        src.includes('connect.facebook.net') ||
        src.includes('platform.twitter.com')) {
      continue;
    }

    // Resolve relative URLs and enforce SSRF check
    try {
      const resolved = new URL(src, baseUrl).href;
      if (isSafeUrl(resolved).safe) {
        sources.push(resolved);
      }
    } catch {
      // Skip malformed URLs
    }
  }

  return sources;
}

function extractInlineScripts(html) {
  const scripts = [];
  const inlineRegex = /<script(?:\s[^>]*)?>(?!<)([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = inlineRegex.exec(html)) !== null) {
    const content = match[1].trim();
    // Only scan substantial inline scripts (skip tiny ones like analytics snippets)
    if (content.length > 50 && !content.startsWith('<!--')) {
      scripts.push(content);
    }
  }

  return scripts;
}

// ─── Bundle Downloader ────────────────────────────────────────────────────────

async function downloadBundles(urls) {
  const MAX_BUNDLE_SIZE = 2 * 1024 * 1024; // 2MB per bundle
  const TIMEOUT_MS = 6000;

  // Filter out any unsafe / internal URLs
  const safeUrls = (urls || []).filter((u) => isSafeUrl(u).safe);

  const results = await Promise.allSettled(
    safeUrls.map(async (bundleUrl) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(bundleUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'SiteProof-SecretScanner/1.0',
            'Accept': 'application/javascript, text/javascript, */*',
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timer);

        if (!response.ok) return null;

        // Check Content-Length header first
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_BUNDLE_SIZE) {
          console.warn(`[Analyze-Secrets] Bundle too large (${contentLength} bytes), skipping: ${bundleUrl}`);
          return null;
        }

        const text = await response.text();
        return {
          source: extractBundleFilename(bundleUrl),
          content: text.slice(0, MAX_BUNDLE_SIZE),
        };
      } catch {
        clearTimeout(timer);
        return null;
      }
    })
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

function extractBundleFilename(url) {
  try {
    const path = new URL(url).pathname;
    return path.split('/').pop() || path;
  } catch {
    return url;
  }
}

// ─── Secret Pattern Scanner (ReDoS-Safe, Chunk-Based) ────────────────────────
//
// THREE-LAYER PROTECTION against ReDoS on minified JS:
//
//   Layer 1: PREFIX PRE-FILTER (O(1) indexOf)
//     Before running any regex, check if the pattern's literal prefix string
//     (e.g., "sk-proj-", "AKIA", "AIzaSy") even exists in the chunk.
//     This skips 90%+ of pattern/chunk combinations instantly.
//
//   Layer 2: CHUNK-BASED SCANNING (64KB chunks with 512B overlap)
//     Minified JS is often a single 2MB line. Running regex on 2MB = danger.
//     We split into 64KB chunks with 512B overlap (catches tokens at boundaries).
//     Regex never faces more than 64KB at a time → bounded backtracking.
//
//   Layer 3: PER-PATTERN TIME BUDGET (200ms per pattern per chunk)
//     If any single regex takes >200ms on a chunk, we abort it and move on.
//     Total scan capped at 5s to stay within Netlify function limits.
//

function scanContent(content, sourceFile) {
  const findings = [];
  const scanStart = Date.now();

  // Split content into manageable chunks
  const chunks = chunkString(content, CHUNK_SIZE, CHUNK_OVERLAP);

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const chunkOffset = ci * CHUNK_SIZE; // approximate char offset for this chunk

    // Abort if total scan budget exceeded
    if (Date.now() - scanStart > TOTAL_SCAN_BUDGET_MS) {
      console.warn(`[Analyze-Secrets] Total scan budget (${TOTAL_SCAN_BUDGET_MS}ms) exceeded. Stopping early.`);
      break;
    }

    for (const pattern of SECRET_PATTERNS) {
      // ── Layer 1: Fast prefix pre-filter ──
      // If none of the pattern's literal prefixes exist in this chunk, skip entirely.
      const prefixFound = pattern.prefixes.some(p => chunk.includes(p));
      if (!prefixFound) continue;

      // ── Layer 3: Per-pattern time budget ──
      const patternStart = Date.now();

      // Create a fresh regex instance to avoid lastIndex state issues across chunks
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      let matchCount = 0;

      while ((match = regex.exec(chunk)) !== null) {
        // Time budget check
        if (Date.now() - patternStart > PER_PATTERN_BUDGET_MS) {
          console.warn(`[Analyze-Secrets] Pattern "${pattern.id}" exceeded ${PER_PATTERN_BUDGET_MS}ms budget on chunk ${ci}. Skipping remaining matches.`);
          break;
        }

        const rawValue = match[0];

        // Skip safe prefixes (e.g., Stripe publishable keys)
        if (SAFE_PREFIXES.some(prefix => rawValue.startsWith(prefix))) {
          continue;
        }

        // For JWT-based patterns (Supabase service_role), verify the payload
        if (pattern.isJwt) {
          if (!isServiceRoleJwt(rawValue)) {
            continue; // Skip — this is likely a safe anon key
          }
        }

        // Skip very short matches that are likely false positives
        if (rawValue.length < 15) continue;

        findings.push({
          id: pattern.id,
          name: pattern.name,
          severity: pattern.severity,
          platform: pattern.platform,
          maskedValue: redactSecret(rawValue),
          sourceFile,
          charIndex: chunkOffset + match.index,
          contextSnippet: extractContext(chunk, match.index, 40),
          remediation: pattern.remediation,
        });

        matchCount++;
        // Limit to 3 matches per pattern per file to avoid noise
        if (matchCount >= 3) break;
      }
    }
  }

  return findings;
}

/**
 * Split a large string into fixed-size chunks with overlap.
 * Overlap ensures tokens straddling a chunk boundary are still caught.
 * @param {string} str - The string to chunk
 * @param {number} size - Chunk size in characters
 * @param {number} overlap - Overlap in characters between consecutive chunks
 * @returns {string[]}
 */
function chunkString(str, size, overlap) {
  if (str.length <= size) return [str];

  const chunks = [];
  let offset = 0;
  while (offset < str.length) {
    chunks.push(str.slice(offset, offset + size + overlap));
    offset += size;
  }
  return chunks;
}

// ─── JWT Inspection (for Supabase service_role detection) ─────────────────────

function isServiceRoleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;

    // Decode the JWT payload (base64url)
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);

    // Check if the role is service_role (dangerous) vs anon (safe)
    return parsed.role === 'service_role';
  } catch {
    return false;
  }
}

// ─── Redaction Engine ─────────────────────────────────────────────────────────

function redactSecret(value) {
  if (!value || value.length < 6) return '****[REDACTED]';

  // Cap visible prefix at max 6 characters (e.g., ghp_12... or sk-pro...)
  const visiblePrefix = value.slice(0, Math.min(6, Math.max(3, Math.floor(value.length * 0.1))));
  return `${visiblePrefix}...****[REDACTED]`;
}

function extractContext(content, index, radius) {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  let snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();

  // Remove any potential full secrets from context
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    snippet = snippet.replace(pattern.regex, (match) => redactSecret(match));
  }

  return snippet;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateFindings(findings) {
  const seen = new Map();

  for (const finding of findings) {
    // Dedup key = pattern ID + masked value
    const key = `${finding.id}:${finding.maskedValue}`;
    if (!seen.has(key)) {
      seen.set(key, finding);
    } else {
      // If same key found in multiple files, keep the first and note the other source
      const existing = seen.get(key);
      if (!existing.alsoFoundIn) existing.alsoFoundIn = [];
      if (!existing.alsoFoundIn.includes(finding.sourceFile)) {
        existing.alsoFoundIn.push(finding.sourceFile);
      }
    }
  }

  return Array.from(seen.values());
}

// ─── Fallback Result ──────────────────────────────────────────────────────────

function buildFallbackResult(url, reason, warnings = []) {
  return {
    url,
    totalLeaks: 0,
    findings: [],
    bundlesScanned: 0,
    inlineScriptsScanned: 0,
    totalScriptsFound: 0,
    scanTimeMs: 0,
    severity: 'pass',
    grade: 'PASS',
    warnings: [...warnings, `Secret scan could not fully complete: ${reason}`],
    isFallback: true,
    source: 'siteproof-secret-scanner',
    scannedAt: new Date().toISOString(),
  };
}
