import { describe, it, expect, vi } from 'vitest';
import { isSafeUrl, isPrivateIp, verifyDnsResolution } from '../../netlify/functions/analyze-secrets.mjs';
import { isAllowedOrigin, getCorsHeaders } from '../../netlify/functions/utils/cors.mjs';
import { verifySupabaseAuth } from '../../netlify/functions/utils/auth.mjs';
import { extractJSON } from '../../netlify/functions/utils/json.mjs';
import { authService } from './auth.service';
import { supabase } from '../config/supabase';

describe('Security & Hardening Suite', () => {
  describe('SSRF Protection (isSafeUrl & DNS)', () => {
    it('allows valid public HTTPS and HTTP URLs', () => {
      expect(isSafeUrl('https://example.com').safe).toBe(true);
      expect(isSafeUrl('http://github.com/my-repo').safe).toBe(true);
      expect(isSafeUrl('https://subdomain.company.co.uk/test?q=1').safe).toBe(true);
    });

    it('blocks non-HTTP protocols', () => {
      expect(isSafeUrl('file:///etc/passwd').safe).toBe(false);
      expect(isSafeUrl('ftp://example.com').safe).toBe(false);
      expect(isSafeUrl('gopher://example.com').safe).toBe(false);
      expect(isSafeUrl('javascript:alert(1)').safe).toBe(false);
    });

    it('blocks localhost and local network hostnames', () => {
      expect(isSafeUrl('http://localhost').safe).toBe(false);
      expect(isSafeUrl('http://localhost:8080').safe).toBe(false);
      expect(isSafeUrl('http://app.localhost').safe).toBe(false);
      expect(isSafeUrl('http://printer.local').safe).toBe(false);
      expect(isSafeUrl('http://service.internal').safe).toBe(false);
    });

    it('blocks cloud metadata IP (169.254.169.254) and link-local', () => {
      expect(isSafeUrl('http://169.254.169.254/latest/meta-data/').safe).toBe(false);
      expect(isSafeUrl('http://169.254.0.1').safe).toBe(false);
      expect(isSafeUrl('http://metadata.google.internal').safe).toBe(false);
    });

    it('blocks loopback IP addresses (127.0.0.0/8 and ::1)', () => {
      expect(isSafeUrl('http://127.0.0.1').safe).toBe(false);
      expect(isSafeUrl('http://127.0.0.1:3000').safe).toBe(false);
      expect(isSafeUrl('http://127.255.255.255').safe).toBe(false);
      expect(isSafeUrl('http://[::1]').safe).toBe(false);
    });

    it('blocks private IPv4 networks (RFC 1918)', () => {
      expect(isSafeUrl('http://10.0.0.1').safe).toBe(false);
      expect(isSafeUrl('http://10.254.0.1').safe).toBe(false);
      expect(isSafeUrl('http://172.16.0.1').safe).toBe(false);
      expect(isSafeUrl('http://172.31.255.255').safe).toBe(false);
      expect(isSafeUrl('http://192.168.1.1').safe).toBe(false);
    });

    it('blocks alternative numeric and encoded IP notations', () => {
      expect(isSafeUrl('http://2130706433').safe).toBe(false); // 127.0.0.1 decimal
      expect(isSafeUrl('http://0x7f000001').safe).toBe(false);
    });

    it('blocks URLs with embedded credentials', () => {
      expect(isSafeUrl('http://admin:password@example.com').safe).toBe(false);
    });

    it('rejects malformed URLs', () => {
      expect(isSafeUrl('').safe).toBe(false);
      expect(isSafeUrl('not-a-url').safe).toBe(false);
    });

    it('correctly identifies private IPs via isPrivateIp', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.5.1')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('192.168.1.100')).toBe(true);
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
    });

    it('resolves and verifies public hostnames via verifyDnsResolution', async () => {
      const res = await verifyDnsResolution('example.com');
      expect(res.safe).toBe(true);
    });
  });

  describe('CORS Origin Restrictions', () => {
    it('approves production domain and localhost', () => {
      expect(isAllowedOrigin('https://vibe-codding-site.netlify.app')).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
      expect(isAllowedOrigin('http://127.0.0.1:5173')).toBe(true);
      expect(isAllowedOrigin('https://deploy-preview-12--vibe-codding-site.netlify.app')).toBe(true);
    });

    it('rejects untrusted third-party origins', () => {
      expect(isAllowedOrigin('https://evil-hacker.com')).toBe(false);
      expect(isAllowedOrigin('https://fake-siteproof.com')).toBe(false);
    });

    it('getCorsHeaders dynamically sets allowed origin and headers', () => {
      const allowed = getCorsHeaders({ headers: { origin: 'http://localhost:5173' } });
      expect(allowed['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(allowed['Access-Control-Allow-Headers']).toContain('Authorization');

      const untrusted = getCorsHeaders({ headers: { origin: 'https://evil.com' } });
      expect(untrusted['Access-Control-Allow-Origin']).toBe('https://vibe-codding-site.netlify.app');
    });
  });

  describe('Supabase Netlify Auth Verification', () => {
    it('allows OPTIONS preflight requests without token', async () => {
      const res = await verifySupabaseAuth({ httpMethod: 'OPTIONS' });
      expect(res.authenticated).toBe(true);
    });

    it('rejects requests with missing Authorization header', async () => {
      const res = await verifySupabaseAuth({ httpMethod: 'POST', headers: {} });
      expect(res.authenticated).toBe(false);
      expect(res.statusCode).toBe(401);
    });

    it('rejects requests with malformed Authorization header', async () => {
      const res = await verifySupabaseAuth({ httpMethod: 'POST', headers: { authorization: 'Basic 1234' } });
      expect(res.authenticated).toBe(false);
      expect(res.statusCode).toBe(401);
    });

    it('accepts valid test token in test environment', async () => {
      const res = await verifySupabaseAuth({
        httpMethod: 'POST',
        headers: { authorization: 'Bearer mock-valid-token' },
      });
      expect(res.authenticated).toBe(true);
      expect(res.user?.id).toBe('test-user-id');
    });
  });

  describe('Client authService.getSessionToken', () => {
    it('returns access token if session exists', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: { access_token: 'client-token-abc' } },
        error: null,
      });

      const token = await authService.getSessionToken();
      expect(token).toBe('client-token-abc');
    });

    it('returns null if no session', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const token = await authService.getSessionToken();
      expect(token).toBeNull();
    });
  });

  describe('Shared extractJSON Utility', () => {
    it('parses raw JSON strings', () => {
      expect(extractJSON('{"healthScore": 85}')).toEqual({ healthScore: 85 });
    });

    it('extracts JSON from markdown code blocks', () => {
      const md = '```json\n{"summary": "Audit complete", "score": 90}\n```';
      expect(extractJSON(md)).toEqual({ summary: 'Audit complete', score: 90 });
    });

    it('extracts JSON with surrounding conversational text', () => {
      const conversational = 'Here is the report:\n{"verdict": "Production Ready"}\nHope this helps!';
      expect(extractJSON(conversational)).toEqual({ verdict: 'Production Ready' });
    });

    it('returns null for invalid or empty text', () => {
      expect(extractJSON('')).toBeNull();
      expect(extractJSON(null)).toBeNull();
      expect(extractJSON('No JSON here')).toBeNull();
    });
  });
});
