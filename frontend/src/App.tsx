import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { domToPng } from 'modern-screenshot';

/* ---------------- 类型与常量 ---------------- */

interface SearchResult {
  target: string;
  context: string;
  position?: number;
  quote: string;
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
  // —— 宇宙与浪漫 ——
  '在宇宙的尺度下，所有的相遇都是久别重逢。',
  '无限不循环，意味着所有故事都早已被写下。',
  '凡是能想到的序列，都早已藏在 π 的某处。',
  '你的数字从宇宙诞生前就已经在那里等你。',
  'π 无穷无尽，正如每个数字都有自己的坐标。',
  '在无尽的数字之海里，没有偶然，只有必然。',
  '小数点后十亿位，藏着你我的暗号。',
  '圆周率没有终点，思念也是。',
  '这串数字走了很远的路，才在此刻遇见你。',
  '宇宙把答案写在圆里，圆把秘密交给 π。',
  '你不是随机出现的，是被 π 记住的。',
  '每一位小数，都是宇宙落下的一个逗号。',
  '在 π 的长河里，这一秒为你停留。',
  '数字不会说话，但它一直在这里等你发现。',
  '无限之中，偏偏是这一串与你相认。',
  'π 的尽头没有岸，你的数字就是那盏灯。',
  '星河滚烫，这串数字是你在宇宙的门牌号。',
  '所有的不期而遇，都是 π 早有安排。',
  '圆会闭上，故事不会。',
  '十亿分之一的概率，百分之百的相遇。',
  '宇宙无限大，恰好容得下这一串小小的你。',
  '时间是圆的，我们总会在某一位上重逢。',
  '这行小数，是宇宙写给你的邮编。',
  '在 π 里，每一次查找都是一次还乡。',
  '你找到的不是数字，是宇宙的回声。',
  'π 慢慢数，日子慢慢过，浪漫慢慢来。',
  '千万分之一的巧合，也值得盖一枚邮戳。',
  '无限不循环，就像想你从不重样。',
  '这一串数字，替宇宙记住了你的生日。',
  '星海浩瀚，总有一串数字与你同名。',
  '圆心不变，思念半径无限长。',
  '在无限的序列里，你是被圈出的那一个。',
  'π 不说话，却把温柔写到了十亿位。',
  '每个数字都是一颗星，你点亮了其中一串。',
  '宇宙很大，但你的数字有固定的座位。',
  '这是 π 替你保管了很久的一小段永恒。',
  '无限的故事里，这一行写着你的名字。',
  '数字很冷，坐标很暖，它指着你在的方向。',
  // —— 邮票与邮局 ——
  '这张邮票，盖的是宇宙的邮戳。',
  '从 π 深处寄出，收件人是你。',
  'π 邮票局今日营业：专送十亿分之一的小确幸。',
  '贴上这张邮票，把今天寄给未来的自己。',
  '这枚邮戳证明：你来过，π 记得。',
  '跨越十亿位小数，这封信终于送达。',
  '邮票很小，装得下一整个圆周率的浪漫。',
  '你的数字已签收，签收人：宇宙。',
  '本局承诺：每一串数字，都值得一枚邮票。',
  '从第 3.14159 号信箱里，取出你的专属信件。',
  '邮路遥远，π 从不迷路。',
  '这张邮票不设有效期，浪漫永不过期。',
  // —— 哲理与趣味 ——
  '人生也像 π，不循环，才精彩。',
  '无限不循环的日子，每一天都是绝版。',
  '别把人生四舍五入，小数点后也有风景。',
  '圆的周长算不尽，你的可能性也是。',
  '像 π 一样，做一个无限不循环的人。',
  '生活没有循环节，重复的只是心态。',
  '在确定的小数里，找一点不确定的浪漫。',
  'π 从不回头，却一直围绕圆心。',
  '数字是冷的，找到它的人是热的。',
  '十亿位都走过了，还怕眼前这点路？',
  '无限都有位置，你当然也有。',
  '精确到小数点后的浪漫，才最较真。',
  '圆周率算不完，好运也用不完。',
  '愿你的人生如 π：常数常新，无限不循环。',
  '每一位都不重复，每一天都别将就。',
  '宇宙的草稿纸上，写满了 π，也写满了你。',
  '找到它的那一刻，随机就变成了注定。',
  '小数点后的世界很大，值得专程来看看。',
  '这串数字证明：再深的序列里也有回响。',
  'π 的魅力在于：永远有下一位在等你。',
  // —— 俏皮可爱 ——
  '报告！你的数字在 π 里排好队了。',
  '叮——你的十亿分之一已出炉。',
  'π 说：这串数字我熟，老住户了。',
  '盖个戳，从今天起它就是官方认证的数字了。',
  '找到了！它一直躲在小数点后晒太阳。',
  '这串数字在 π 里的房租，我已经帮你付了。',
  '别小看这几位数，它们可是见过大场面的。',
  '宇宙盖章，童叟无欺。',
  '你的数字很乖，在 π 里没有乱跑。',
  '看，π 把你的数字养得白白胖胖。',
  '这枚邮票有点甜，因为它沾过 π。',
  '数字虽小，来头不小——宇宙原装。',
  'π 深处挖到宝，快收好。',
  '你点的数字已出餐，请慢用。',
  '这是 π 限量版，全网独一份的坐标。',
  // —— 深情 ——
  '如果思念有坐标，大概就写在这一位上。',
  '有些人像 π，遇见就是无限。',
  '把重要的日子交给 π 保管，它从不弄丢。',
  '你随口一串数字，是某个人整年的期盼。',
  '生日会过去，但它在 π 里的位置不会。',
  '宇宙替我记得，那些我不想忘记的日子。',
  '这一位小数，是时间给你的签名。',
  '多年以后，它还在原来的位置等你。',
  '世界再大，大不过小数点后的牵挂。',
  '在 π 里存一份想念，永不褪色，永不占线。',
  '有些数字只是数字，有些数字是某人。',
  '把纪念日刻进 π 里，比刻在石头上更久。',
  '宇宙最浪漫的事：把你的数字放在显眼的位置。',
  // —— 诗意 ——
  '月色落入圆中，化作 π 的一行。',
  '风走了八千里，π 数了十亿位。',
  '星子落成小数，缀满圆的边缘。',
  '山河远阔，小数情长。',
  '一笔一划的数字，写着无始无终的圆。',
  '圆是宇宙的诗，π 是诗里的韵脚。',
  '夜色把圆磨亮，π 把时间拉长。',
  '小数如星，颗颗不落。',
  '一眼万年，一串十亿。',
  '圆周未竟，来日方长。',
  '拾一枚数字，寄一片星河。',
  '云在天上写信，π 在地上收信。',
  '把日子过成小数，精确而绵长。',
  '圆有千万种画法，π 只有一种浪漫。',
];

function pickQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
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
              「{result.quote}」
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
        quote: pickQuote(),
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络请求错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
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
                <span className={loading ? 'pi-glyph spinning' : 'pi-glyph'}>π</span>
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
