function jsonResponse(body, init) {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getIndexUrl() {
  return (
    process.env.DATA_INDEX_URL ||
    'https://github.com/flashzdw/Numbers-In-Pi/releases/download/data-v1/pi_index.bin'
  );
}

function getPiUrl() {
  return (
    process.env.DATA_PI_URL ||
    'https://github.com/flashzdw/Numbers-In-Pi/releases/download/data-v1/mock_pi.txt'
  );
}

async function fetchRange(url, rangeStart, rangeEnd) {
  let currentUrl = url;
  for (let i = 0; i < 8; i++) {
    const res = await fetch(currentUrl, {
      headers: { Range: `bytes=${rangeStart}-${rangeEnd}` },
      redirect: 'manual',
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error(`Redirect without location: ${currentUrl}`);
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching range`);
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  throw new Error('Too many redirects');
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

      const indexBuffer = await fetchRange(getIndexUrl(), rangeStart, rangeEnd);
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

      const piBuffer = await fetchRange(getPiUrl(), piRangeStart, piRangeEnd);
      const context = new TextDecoder().decode(piBuffer);

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
        { error: 'Internal Server Error', details: err?.message || String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
