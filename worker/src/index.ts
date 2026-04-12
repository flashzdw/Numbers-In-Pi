export interface Env {
  PI_STORAGE: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/search' && request.method === 'GET') {
      const q = url.searchParams.get('q');

      if (!q || !/^\d{4,8}$/.test(q)) {
        return new Response(
          JSON.stringify({ error: 'Please provide a numeric query between 4 and 8 digits.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetLength = q.length;
      const indexDigits = 8;
      
      // Calculate the min and max 8-digit representations for this prefix
      const minValStr = q.padEnd(indexDigits, '0');
      const maxValStr = q.padEnd(indexDigits, '9');
      const minVal = parseInt(minValStr, 10);
      const maxVal = parseInt(maxValStr, 10);

      const offset = minVal * 4;
      const length = (maxVal - minVal + 1) * 4;

      try {
        // Fetch from R2 with HTTP Range
        // R2 get() options.range: { offset, length }
        const indexObj = await env.PI_STORAGE.get('pi_index.bin', {
          range: { offset, length }
        });

        if (!indexObj) {
          return new Response(JSON.stringify({ error: 'Index file not found in R2.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const buffer = await indexObj.arrayBuffer();
        const indexSlice = new Uint32Array(buffer);

        let minPos = 0xFFFFFFFF;
        for (let i = 0; i < indexSlice.length; i++) {
          if (indexSlice[i] < minPos) {
            minPos = indexSlice[i];
          }
        }

        if (minPos === 0xFFFFFFFF) {
          return new Response(
            JSON.stringify({ found: false, searchStr: q }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch context from Pi text file
        const contextMargin = 20;
        const contextStart = Math.max(0, minPos - contextMargin);
        const contextLength = targetLength + (contextMargin * 2);
        
        // +2 because "3." at the beginning
        const piObj = await env.PI_STORAGE.get('mock_pi.txt', {
          range: { offset: contextStart + 2, length: contextLength }
        });

        if (!piObj) {
          return new Response(JSON.stringify({ error: 'Pi data file not found in R2.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const context = await piObj.text();

        return new Response(
          JSON.stringify({
            found: true,
            position: minPos,
            context: context,
            searchStr: q
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', details: err.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
