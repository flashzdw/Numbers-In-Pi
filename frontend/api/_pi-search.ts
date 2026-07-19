// 共享的 π 检索核心：Cloudflare Worker 与 Vercel Serverless Function 共用。
//
// 数据层抽象：检索只依赖“支持 HTTP Range 的静态文件 URL”。
// 因此数据源可以是阿里云 OSS、Cloudflare R2、GitHub Releases，
// 或本地 scripts/dev-data-server.js，只需更换环境变量：
//   DATA_INDEX_URL — pi_index.bin 的可 Range 下载地址
//   DATA_PI_URL    — pi 文本文件的可 Range 下载地址
//
// 阿里云 OSS 配置要点：Bucket 设为公共读；防盗链开启白名单并允许空
// Referer（服务器间 fetch 不带 Referer）；务必配置用量告警。

export interface PiDataEnv {
  DATA_INDEX_URL?: string;
  DATA_PI_URL?: string;
}

export interface PiSearchHit {
  found: true;
  position: number;
  context: string;
  searchStr: string;
}

export interface PiSearchMiss {
  found: false;
  searchStr: string;
}

export type PiSearchResult = PiSearchHit | PiSearchMiss;

export const INDEX_DIGITS = 8;
export const CONTEXT_MARGIN = 20;
const NOT_FOUND = 0xffffffff;

/** 返回错误消息；合法则返回 null。 */
export function validateQuery(q: string | null | undefined): string | null {
  if (!q || !/^\d{4,8}$/.test(q)) {
    return 'Please provide a numeric query between 4 and 8 digits.';
  }
  return null;
}

function getRequiredUrl(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** 带重定向跟随的 Range 读取（OSS/R2 一般无重定向，GitHub Releases 有）。 */
export async function fetchRange(
  url: string,
  rangeStart: number,
  rangeEnd: number,
  fetchImpl: typeof fetch = fetch
): Promise<Uint8Array> {
  let currentUrl = url;

  for (let i = 0; i < 8; i += 1) {
    const res = await fetchImpl(currentUrl, {
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
      throw new Error(`HTTP ${res.status} when fetching range from ${currentUrl}`);
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  throw new Error('Too many redirects');
}

/**
 * 在 π 索引中查找数字，命中后取上下文。
 * 算法：把 q 补齐到 8 位前缀区间 [q00..0, q99..9]，只拉取索引中对应的
 * 字节区间（最小 4B，最大约 40KB），取候选位置中的最小值（首次出现）。
 */
export async function searchPi(
  q: string,
  env: PiDataEnv,
  fetchImpl: typeof fetch = fetch
): Promise<PiSearchResult> {
  const targetLength = q.length;

  const minVal = Number.parseInt(q.padEnd(INDEX_DIGITS, '0'), 10);
  const maxVal = Number.parseInt(q.padEnd(INDEX_DIGITS, '9'), 10);

  const rangeStart = minVal * 4;
  const rangeEnd = rangeStart + (maxVal - minVal + 1) * 4 - 1;

  const indexBuffer = await fetchRange(
    getRequiredUrl(env.DATA_INDEX_URL, 'DATA_INDEX_URL'),
    rangeStart,
    rangeEnd,
    fetchImpl
  );
  const indexSlice = new Uint32Array(
    indexBuffer.buffer,
    indexBuffer.byteOffset,
    Math.floor(indexBuffer.byteLength / 4)
  );

  let minPos = NOT_FOUND;
  for (let i = 0; i < indexSlice.length; i += 1) {
    if (indexSlice[i] < minPos) {
      minPos = indexSlice[i];
    }
  }

  if (minPos === NOT_FOUND) {
    return { found: false, searchStr: q };
  }

  const contextStart = Math.max(0, minPos - CONTEXT_MARGIN);
  const contextLength = targetLength + CONTEXT_MARGIN * 2;
  // +2 跳过文件开头的 "3."
  const piRangeStart = contextStart + 2;
  const piRangeEnd = piRangeStart + contextLength - 1;

  const piBuffer = await fetchRange(
    getRequiredUrl(env.DATA_PI_URL, 'DATA_PI_URL'),
    piRangeStart,
    piRangeEnd,
    fetchImpl
  );
  const context = new TextDecoder().decode(piBuffer);

  return {
    found: true,
    position: minPos,
    context,
    searchStr: q,
  };
}
