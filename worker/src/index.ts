import {
  searchPi,
  validateQuery,
  type PiDataEnv,
} from '../../frontend/api/_pi-search.ts';

export interface Env extends PiDataEnv {}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      if (url.pathname !== '/api/search' || request.method !== 'GET') {
        return new Response('Not Found', { status: 404 });
      }

      const q = url.searchParams.get('q');
      const validationError = validateQuery(q);
      if (validationError) {
        return jsonResponse(
          { error: validationError },
          { status: 400, headers: corsHeaders }
        );
      }

      const result = await searchPi(q as string, env);
      return jsonResponse(result, { status: 200, headers: corsHeaders });
    } catch (err) {
      return jsonResponse(
        { error: 'Internal Server Error', details: err instanceof Error ? err.message : String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
