// Vercel Serverless Function：GET /api/search?q=<4-8位数字>
//
// 与前端同域部署（Vercel 项目根目录 = frontend/），生产环境无需设置
// VITE_API_URL。数据源通过环境变量配置（推荐阿里云 OSS 公共读地址）：
//   DATA_INDEX_URL / DATA_PI_URL
//
// 本地联调仍走 worker/（npm run dev），本文件只在 Vercel 上运行。

import { searchPi, validateQuery } from './_pi-search.ts';

// 最小化的 Vercel req/res 类型，避免引入 @vercel/node 依赖
interface VercelRequestLike {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  setHeader(name: string, value: string): unknown;
  status(code: number): VercelResponseLike;
  json(body: unknown): unknown;
  end(): unknown;
}

export default async function handler(
  req: VercelRequestLike,
  res: VercelResponseLike
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const qParam = req.query?.q;
  const q = Array.isArray(qParam) ? qParam[0] : qParam;

  const validationError = validateQuery(q);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const result = await searchPi(q as string, process.env);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
