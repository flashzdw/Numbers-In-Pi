import { TosClient } from '@volcengine/tos-sdk';

function jsonResponse(body, init) {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

let client;

function getClient() {
  if (client) return client;

  client = new TosClient({
    accessKeyId: getRequiredEnv('TOS_ACCESS_KEY_ID'),
    accessKeySecret: getRequiredEnv('TOS_ACCESS_KEY_SECRET'),
    region: getRequiredEnv('TOS_REGION'),
    endpoint: getRequiredEnv('TOS_ENDPOINT'),
  });

  return client;
}

export default {
  async fetch(request) {
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

      const q = url.searchParams.get('q');
      if (!q || !/^\d{4,8}$/.test(q)) {
        return jsonResponse(
          { error: 'Please provide a numeric query between 4 and 8 digits.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const bucket = getRequiredEnv('TOS_BUCKET');
      const indexKey = process.env.TOS_INDEX_KEY || 'pi_index.bin';
      const piTextKey = process.env.TOS_PI_TEXT_KEY || 'mock_pi.txt';

      const targetLength = q.length;
      const indexDigits = 8;

      const minValStr = q.padEnd(indexDigits, '0');
      const maxValStr = q.padEnd(indexDigits, '9');
      const minVal = Number.parseInt(minValStr, 10);
      const maxVal = Number.parseInt(maxValStr, 10);

      const offset = minVal * 4;
      const length = (maxVal - minVal + 1) * 4;
      const rangeStart = offset;
      const rangeEnd = offset + length - 1;

      const indexRes = await getClient().getObjectV2({
        bucket,
        key: indexKey,
        dataType: 'buffer',
        rangeStart,
        rangeEnd,
      });

      const indexBuffer = indexRes.data.content;
      const indexSlice = new Uint32Array(
        indexBuffer.buffer,
        indexBuffer.byteOffset,
        Math.floor(indexBuffer.byteLength / 4)
      );

      let minPos = 0xffffffff;
      for (let i = 0; i < indexSlice.length; i++) {
        if (indexSlice[i] < minPos) {
          minPos = indexSlice[i];
        }
      }

      if (minPos === 0xffffffff) {
        return jsonResponse(
          { found: false, searchStr: q },
          { status: 200, headers: corsHeaders }
        );
      }

      const contextMargin = 20;
      const contextStart = Math.max(0, minPos - contextMargin);
      const contextLength = targetLength + contextMargin * 2;
      const piRangeStart = contextStart + 2;
      const piRangeEnd = piRangeStart + contextLength - 1;

      const piRes = await getClient().getObjectV2({
        bucket,
        key: piTextKey,
        dataType: 'buffer',
        rangeStart: piRangeStart,
        rangeEnd: piRangeEnd,
      });

      const context = piRes.data.content.toString('utf-8');

      return jsonResponse(
        {
          found: true,
          position: minPos,
          context,
          searchStr: q,
        },
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return jsonResponse(
        { error: 'Internal Server Error' },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
