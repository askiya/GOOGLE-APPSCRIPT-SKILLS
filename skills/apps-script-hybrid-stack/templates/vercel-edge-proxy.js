/**
 * Vercel Edge Function Proxy for Google Apps Script
 * Pattern H — Deploy this to Vercel (not in Apps Script)
 *
 * ⚠️ IMPORTANT: Vercel Hobby plan is for non-commercial use only.
 *
 * This Edge Function sits in front of your GAS web app:
 * 1. Receives requests at your Vercel domain.
 * 2. Forwards to GAS doGet/doPost.
 * 3. Caches responses using Vercel's edge caching.
 * 4. Adds CORS headers and error handling.
 *
 * File: /api/proxy.js (in your Vercel project)
 *
 * Deploy:
 *   vercel deploy
 *
 * Environment variables (set in Vercel dashboard):
 *   GAS_WEB_APP_URL: your deployed GAS web app URL
 *   API_SECRET: shared secret for authentication
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const url = new URL(request.url);
    const gasUrl = new URL(process.env.GAS_WEB_APP_URL);

    // Forward query parameters
    url.searchParams.forEach((value, key) => {
      gasUrl.searchParams.set(key, value);
    });

    const fetchOptions = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Secret': process.env.API_SECRET || '',
      },
      redirect: 'follow',
    };

    // Forward POST body
    if (request.method === 'POST') {
      fetchOptions.body = await request.text();
    }

    const gasResponse = await fetch(gasUrl.toString(), fetchOptions);
    const body = await gasResponse.text();

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      data = { raw: body };
    }

    // Set cache headers for GET requests
    const cacheControl = request.method === 'GET'
      ? 'public, s-maxage=300, stale-while-revalidate=600'
      : 'no-store';

    return new Response(JSON.stringify(data), {
      status: gasResponse.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error.message }),
      {
        status: 502,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * CORS headers.
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * ─── Next.js API Route (alternative) ───────────────────────────
 *
 * If using Next.js on Vercel, use this as /app/api/gas/route.js:
 *
 * export async function GET(request) {
 *   const { searchParams } = new URL(request.url);
 *   const gasUrl = new URL(process.env.GAS_WEB_APP_URL);
 *   searchParams.forEach((v, k) => gasUrl.searchParams.set(k, v));
 *
 *   const res = await fetch(gasUrl.toString(), { next: { revalidate: 300 } });
 *   const data = await res.json();
 *
 *   return Response.json(data, {
 *     headers: { 'Access-Control-Allow-Origin': '*' },
 *   });
 * }
 *
 * export async function POST(request) {
 *   const body = await request.json();
 *   const gasUrl = process.env.GAS_WEB_APP_URL;
 *
 *   const res = await fetch(gasUrl, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(body),
 *   });
 *   const data = await res.json();
 *
 *   return Response.json(data, {
 *     headers: { 'Access-Control-Allow-Origin': '*' },
 *   });
 * }
 */
