import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { domToPng } from 'modern-screenshot';

/* ---------------- 类型与常量 ---------------- */

interface SearchResult {
  target: string;
  context: string;
  position?: number;
}

interface SearchApiResponse {
  found?: boolean;
  position?: number;
  context?: string;
  searchStr?: string;
  error?: string;
  details?: string;
}

const SKY = '#4a90d9';
const CREAM = '#f8efdc';
const CREAM_SOFT = '#fffaf0';
const CREAM_LINE = '#d9c9a3';
const INK = '#2c3a56';
const RED = '#e2483d';
const FONT_DISPLAY = '"ZCOOL QingKe HuangYou", "Yuanti SC", "YouYuan", "PingFang SC", sans-serif';
const FONT_HAND = '"ZCOOL KuaiLe", "Yuanti SC", "YouYuan", "PingFang SC", sans-serif';
const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const QUOTES = [
  '在宇宙的尺度下，所有的相遇都是久别重逢。',
  '无限不循环，意味着所有故事都早已被写下。',
  '凡是能想到的序列，都早已藏在 π 的某处。',
  '你的数字从宇宙诞生前就已经在那里等你。',
  'π 无穷无尽，正如每个数字都有自己的坐标。',
  '在无尽的数字之海里，没有偶然，只有必然。',
];

function pickQuote(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return QUOTES[h % QUOTES.length];
}

/* ---------------- 邮票卡片（下载区域全部内联 hex 样式，确保截图还原） ---------------- */

function StampCard({ result }: { result: SearchResult }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<Array<{ x: number; y: number }>>([]);
  const [dlState, setDlState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  /* 沿卡片四边生成锯齿圆点（打孔效果），卡片尺寸变化时重算 */
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const GAP = 26;
    const compute = () => {
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      if (w === 0 || h === 0) return;
      const nx = Math.max(2, Math.round(w / GAP) + 1);
      const ny = Math.max(2, Math.round(h / GAP) + 1);
      const pts: Array<{ x: number; y: number }> = [];
      const seen = new Set<string>();
      const push = (x: number, y: number) => {
        const k = `${Math.round(x)},${Math.round(y)}`;
        if (!seen.has(k)) {
          seen.add(k);
          pts.push({ x, y });
        }
      };
      for (let i = 0; i < nx; i++) {
        const x = (i / (nx - 1)) * w;
        push(x, 0);
        push(x, h);
      }
      for (let j = 0; j < ny; j++) {
        const y = (j / (ny - 1)) * h;
        push(0, y);
        push(w, y);
      }
      setDots(pts);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  const handleDownload = async () => {
    if (!wrapRef.current || dlState === 'working') return;
    setDlState('working');
    try {
      const url = await domToPng(wrapRef.current, {
        scale: 2,
        backgroundColor: SKY,
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `pi-stamp-${result.target}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDlState('done');
    } catch {
      setDlState('error');
    }
  };

  const renderContext = (): ReactNode => {
    const { context, target } = result;
    if (!context) return '(empty)';
    if (!target) return context;
    const parts = context.split(target);
    const nodes: ReactNode[] = [];
    parts.forEach((p, i) => {
      nodes.push(<span key={`p${i}`}>{p}</span>);
      if (i < parts.length - 1) {
        nodes.push(
          <span
            key={`t${i}`}
            style={{
              background: RED,
              color: '#ffffff',
              borderRadius: 4,
              padding: '0 4px',
              fontWeight: 700,
            }}
          >
            {target}
          </span>
        );
      }
    });
    return nodes;
  };

  const R = 7;
  const positionText =
    result.position !== undefined ? result.position.toLocaleString('en-US') : null;

  return (
    <div className="stamp-enter w-full flex flex-col items-center mt-10 mb-4">
      <div ref={wrapRef} style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
        {/* 硬投影 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(9px, 9px)',
            background: 'rgba(44,58,86,0.28)',
            borderRadius: 6,
          }}
        />
        {/* 邮票本体 */}
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            background: CREAM,
            borderRadius: 6,
            padding: '22px 22px 16px',
            fontFamily: FONT_HAND,
          }}
        >
          {/* 锯齿孔 */}
          {dots.map((p, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                position: 'absolute',
                left: p.x - R,
                top: p.y - R,
                width: R * 2,
                height: R * 2,
                borderRadius: '50%',
                background: SKY,
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* 票面：蓝天场景 + 大数字 */}
          <div
            style={{
              position: 'relative',
              background: SKY,
              borderRadius: 8,
              overflow: 'hidden',
              padding: '26px 20px 0',
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: 2,
                color: 'rgba(248,239,220,0.85)',
              }}
            >
              π STAMP · FIRST 1,000,000,000 DECIMALS
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 'clamp(2.6rem, 11vw, 4rem)',
                lineHeight: 1.15,
                letterSpacing: '0.06em',
                color: CREAM,
                textShadow: '4px 4px 0 rgba(44,58,86,0.35)',
                marginTop: 6,
              }}
            >
              {result.target}
            </div>
            {positionText && (
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  letterSpacing: 1,
                  color: 'rgba(248,239,220,0.9)',
                  marginTop: 4,
                }}
              >
                OFFSET No.{positionText}
              </div>
            )}

            {/* 邮戳 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 88,
                height: 88,
                border: '2.5px solid rgba(44,58,86,0.55)',
                borderRadius: '50%',
                transform: 'rotate(-11deg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(44,58,86,0.6)',
                fontFamily: FONT_MONO,
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 5,
                  border: '1px dashed rgba(44,58,86,0.4)',
                  borderRadius: '50%',
                }}
              />
              <div style={{ fontSize: 9, letterSpacing: 1 }}>PI · POSTE</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>π=3.14159</div>
              <div style={{ fontSize: 9, marginTop: 2 }}>FOUND</div>
            </div>

            {/* 绿色山坡 */}
            <div
              aria-hidden
              style={{
                height: 42,
                margin: '16px -30px 0',
                background: '#2ba95c',
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
              }}
            />
          </div>

          {/* 数字片段 */}
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: CREAM_SOFT,
              border: `1.5px dashed ${CREAM_LINE}`,
              borderRadius: 6,
              fontFamily: FONT_MONO,
              fontSize: 14,
              letterSpacing: 1,
              wordBreak: 'break-all',
              color: '#8a7d63',
              lineHeight: 1.8,
            }}
          >
            …{renderContext()}…
          </div>

          {/* 寄语 */}
          <div style={{ padding: '12px 8px 12px' }}>
            <p
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 16,
                letterSpacing: 1,
                color: INK,
                textAlign: 'center',
                margin: 0,
                lineHeight: '30px',
              }}
            >
              「{pickQuote(result.target)}」
            </p>
          </div>

          <div style={{ borderTop: `2px dashed ${CREAM_LINE}`, margin: '0 0 10px' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: 1,
              color: '#a89a7c',
            }}
          >
            <span>π STAMP No.{positionText ?? '——'}</span>
            <span>pi.novecho.cn</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="dl-btn mt-7"
        disabled={dlState === 'working'}
      >
        {dlState === 'working'
          ? '装袋中…'
          : dlState === 'done'
            ? '✓ 已收好，再来一张？'
            : dlState === 'error'
              ? '装袋失败，再试一次'
              : '⬇ 把邮票收进口袋'}
      </button>
    </div>
  );
}

/* ---------------- 主页面 ---------------- */

const HILL_DIGITS = [
  { d: '3', left: '7%', bottom: 130, size: 26, rot: '-8deg', delay: '0s' },
  { d: '1', left: '19%', bottom: 55, size: 19, rot: '5deg', delay: '0.6s' },
  { d: '4', left: '31%', bottom: 105, size: 30, rot: '3deg', delay: '1.1s' },
  { d: '1', left: '52%', bottom: 42, size: 18, rot: '-5deg', delay: '0.3s' },
  { d: '5', left: '68%', bottom: 100, size: 26, rot: '6deg', delay: '0.9s' },
  { d: '9', left: '85%', bottom: 60, size: 22, rot: '-3deg', delay: '1.4s' },
];

const SPARKLES = [
  { left: '14%', top: '11%', delay: '0s' },
  { left: '80%', top: '8%', delay: '1.2s' },
  { left: '64%', top: '19%', delay: '0.7s' },
];

const CLOUDS = [
  { top: '4%', duration: '85s', delay: '-12s', scale: 1 },
  { top: '8%', duration: '110s', delay: '-55s', scale: 0.7 },
  { top: '13%', duration: '70s', delay: '-38s', scale: 0.55 },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!/^\d{4,8}$/.test(query)) {
      setError('哎呀！需要 4 到 8 位纯数字哦（生日、纪念日都可以）');
      setResult(null);
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
      const url = new URL('/api/search', apiBase);
      url.searchParams.set('q', query);
      const res = await fetch(url);
      const data = (await res.json()) as SearchApiResponse;
      if (!res.ok || data.error) {
        throw new Error(data.details || data.error || '邮局出了点状况，请稍后再试');
      }
      if (data.found === false) {
        setError(`π 的前十亿位小数里没有 ${query}，换个数字试试！`);
        return;
      }
      setResult({
        target: data.searchStr || query,
        context: data.context || '',
        position: typeof data.position === 'number' ? data.position : undefined,
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络请求错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 云 */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="cloud"
          style={{
            top: c.top,
            animationDuration: c.duration,
            animationDelay: c.delay,
            transform: `scale(${c.scale})`,
            transformOrigin: 'left top',
          }}
        />
      ))}

      {/* 星星 */}
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="sparkle"
          style={{ left: s.left, top: s.top, animationDelay: s.delay, fontSize: 14 }}
        >
          ✦
        </span>
      ))}

      {/* 山坡上的数字 */}
      {HILL_DIGITS.map((h, i) => (
        <span
          key={i}
          className="hill-digit"
          style={
            {
              left: h.left,
              bottom: h.bottom,
              fontSize: h.size,
              '--rot': h.rot,
              animationDelay: h.delay,
            } as CSSProperties
          }
        >
          {h.d}
        </span>
      ))}

      {/* π 小旗 */}
      <svg
        aria-hidden
        style={{ position: 'fixed', left: '45%', bottom: 158, zIndex: 1, pointerEvents: 'none' }}
        width="46"
        height="54"
        viewBox="0 0 46 54"
      >
        <line x1="4" y1="4" x2="4" y2="52" stroke={CREAM} strokeWidth="3" strokeLinecap="round" />
        <path d="M4 6 L42 15 L4 25 Z" fill={RED} />
        <text x="11" y="18" fontSize="11" fill={CREAM} fontFamily={FONT_DISPLAY}>
          π
        </text>
      </svg>

      {/* 山坡 */}
      <svg className="hills" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden>
        <path
          fill="#3fbf72"
          d="M0,120 C240,60 480,160 720,110 C960,60 1200,140 1440,90 L1440,260 L0,260 Z"
        />
        <path
          fill="#2ba95c"
          d="M0,170 C260,110 520,200 780,150 C1040,100 1240,190 1440,150 L1440,260 L0,260 Z"
        />
        <path
          fill="#1e8a47"
          d="M0,215 C300,170 600,240 900,205 C1140,180 1300,225 1440,200 L1440,260 L0,260 Z"
        />
      </svg>

      {/* 内容 */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-14 md:pt-20 pb-56 w-full max-w-2xl mx-auto">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="hero-flank">
            <span>EST. 3.14159</span>
            <span>✦</span>
            <span>No. 10亿位</span>
          </div>
          <h1 className="hero-title">PI POSTER</h1>
          <p className="hero-sub">π 邮票局 · 在十亿位小数里，找到属于你的数字</p>
        </header>

        <section className="postcard w-full max-w-md mt-10">
          <div className="postcard-inner">
            <span className="postcard-label">收信人：你的数字</span>
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <input
                type="text"
                className="digit-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入 4-8 位数字"
                maxLength={8}
                inputMode="numeric"
                autoComplete="off"
              />
              <button
                type="submit"
                className="postmark-btn"
                disabled={loading}
                aria-label="search"
                title="盖戳寄出！"
              >
                π
              </button>
            </form>
            <p className="postcard-hint">每一次搜索，都是寄往 π 深处的一张明信片 →</p>
            {error && <div className="error-burst">{error}</div>}
          </div>
        </section>

        <div ref={resultRef} className="w-full flex justify-center scroll-mt-6">
          {result && <StampCard result={result} />}
        </div>
      </main>

      <footer className="site-footer relative z-10 pb-4 px-4">
        π · 数据源 MIT 十亿位小数 · 由阿里云 OSS 投递 · pi.novecho.cn
      </footer>

      {/* 纸张颗粒 */}
      <div className="grain" aria-hidden />
    </div>
  );
}
