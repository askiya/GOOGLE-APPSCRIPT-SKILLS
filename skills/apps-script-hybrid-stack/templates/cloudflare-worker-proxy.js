/**
 * Cloudflare Worker Reverse Proxy for Google Apps Script
 * Pattern C — Deploy this to Cloudflare Workers (not in Apps Script)
 *
 * This Worker sits in front of your GAS web app:
 * 1. Receives browser requests at your custom domain.
 * 2. Checks Cloudflare KV cache for a cached response.
 * 3. On cache miss, forwards the request to GAS doGet/doPost.
 * 4. Caches the GAS response in KV with a configurable TTL.
 * 5. Adds CORS headers, rate limiting, and error handling.
 *
 * Deploy with Wrangler:
 *   wrangler deploy
 *
 * wrangler.toml:
 *   name = "gas-proxy"
 *   main = "cloudflare-worker-proxy.js"
 *   compatibility_date = "2026-01-01"
 *   [[kv_namespaces]]
 *   binding = "CACHE"
 *   id = "your-kv-namespace-id"
 *
 * Environment variables (set via wrangler secret):
 *   GAS_WEB_APP_URL: your deployed GAS web app URL
 *   API_SECRET: shared secret for authenticating GAS → Worker calls
 */

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders_() });
    }

    try {
      const url = new URL(request.url);
      const cacheKey = url.pathname + url.search;

      // Rate limiting (simple, per-IP, using KV)
      const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateLimitOk = await checkRateLimit_(env, clientIp);
      if (!rateLimitOk) {
        return jsonResponse_({ error: 'Rate limit exceeded' }, 429);
      }

      // Check KV cache for GET requests
      if (request.method === 'GET') {
        const cached = await env.CACHE.get(cacheKey);
        if (cached) {
          return jsonResponse_(JSON.parse(cached), 200, {
            'X-Cache': 'HIT',
          });
        }
      }

      // Forward to GAS
      const gasResponse = await forwardToGas_(request, env, cacheKey);

      // Cache GET responses
      if (request.method === 'GET' && gasResponse.status === 200) {
        const body = await gasResponse.clone().text();
        ctx.waitUntil(
          env.CACHE.put(cacheKey, body, { expirationTtl: 300 }) // 5 min TTL
        );
      }

      return gasResponse;
    } catch (error) {
      return jsonResponse_({ error: 'Proxy error', message: error.message }, 502);
    }
  },
};

/**
 * Forward a request to the GAS web app.
 * @param {Request} request
 * @param {Object} env
 * @param {string} cacheKey
 * @returns {Response}
 */
async function forwardToGas_(request, env, cacheKey) {
  const gasUrl = new URL(env.GAS_WEB_APP_URL);
  const originalUrl = new URL(request.url);

  // Append original path and query params to GAS URL
  originalUrl.searchParams.forEach((value, key) => {
    gasUrl.searchParams.set(key, value);
  });

  const fetchOptions = {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Proxy-Secret': env.API_SECRET || '',
      'X-Original-URL': request.url,
    },
    redirect: 'follow',
  };

  // Forward POST body
  if (request.method === 'POST') {
    fetchOptions.body = await request.text();
  }

  const response = await fetch(gasUrl.toString(), fetchOptions);
  const body = await response.text();

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    parsedBody = { data: body };
  }

  return jsonResponse_(parsedBody, response.status, {
    'X-Cache': 'MISS',
  });
}

/**
 * Simple rate limiter using KV.
 * Allows 60 requests per minute per IP.
 * @param {Object} env
 * @param {string} clientIp
 * @returns {boolean}
 */
async function checkRateLimit_(env, clientIp) {
  const key = `ratelimit:${clientIp}`;
  const current = parseInt(await env.CACHE.get(key) || '0', 10);

  if (current >= 60) return false;

  // KV writes are limited (1000/day free), so only write on first request
  // and let TTL handle the window. This is a best-effort rate limiter.
  if (current === 0) {
    await env.CACHE.put(key, '1', { expirationTtl: 60 });
  } else {
    await env.CACHE.put(key, String(current + 1), { expirationTtl: 60 });
  }

  return true;
}

/**
 * Create a JSON response with CORS headers.
 * @param {*} data
 * @param {number} status
 * @param {Object} extraHeaders
 * @returns {Response}
 */
function jsonResponse_(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders_(),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

/**
 * CORS headers for cross-origin access.
 * @returns {Object}
 */
function corsHeaders_() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
