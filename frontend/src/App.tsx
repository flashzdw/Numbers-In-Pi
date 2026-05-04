import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Search, Download, Star, Loader2 } from 'lucide-react';

interface SearchResult {
  target: string;
  context: string;
  quote: string;
  position?: number;
}

interface SearchApiResponse {
  found?: boolean;
  searchStr?: string;
  context?: string;
  quote?: string;
  position?: number;
  target?: string;
  error?: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(query)) {
      setError('请输入 4 到 8 位的纯数字');
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
      if (!res.ok) {
        throw new Error('搜索失败或未找到匹配项');
      }
      const data = (await res.json()) as SearchApiResponse;
      if (data.found === false) {
        setError('当前数据集中未找到该数字');
        setResult(null);
        return;
      }

      setResult({
        target: data.target || data.searchStr || query,
        context: data.context || `在无尽的圆周率中，我们找到了属于你的数字 ${query}。`,
        quote: data.quote || '在宇宙的尺度下，所有的相遇都是久别重逢。',
        position: data.position
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络请求错误');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    try {
      // 临时移除不受支持的 oklch 渐变背景（tailwindv4默认生成oklch可能不被html2canvas支持）
      const originalBackground = posterRef.current.style.background;
      posterRef.current.style.background = 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)';
      
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: '#0a0a1a', // Ensure dark background for the canvas
        useCORS: true,
        logging: true
      });
      
      // 还原背景
      posterRef.current.style.background = originalBackground;
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `pi-poster-${query}.png`;
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('生成海报失败', err);
      alert('生成海报失败，请稍后再试');
    }
  };

  const renderContext = (context: string, target: string) => {
    if (!context || !target) return context;
    const parts = context.split(new RegExp(`(${target})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === target.toLowerCase() ? (
        <span key={i} className="font-bold text-xl md:text-2xl" style={{ color: '#22d3ee', textShadow: '0 0 8px rgba(34,211,238,0.8)' }}>{part}</span>
      ) : (
        <span key={i} style={{ color: '#d1d5db' }}>{part}</span>
      )
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-12 px-4">
      {/* Background */}
      <div className="stars"></div>
      <div className="twinkling"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4 flex items-center justify-center gap-3">
            <Star className="text-purple-400" size={32} />
            Pi Poster
            <Star className="text-cyan-400" size={32} />
          </h1>
          <p className="text-gray-300 text-lg">在无尽的圆周率星海中，寻找属于你的浪漫数字</p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入 4-8 位数字 (如纪念日、生日)"
              className="w-full bg-gray-900/60 border border-purple-500/50 rounded-full py-4 pl-6 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all text-lg"
              maxLength={8}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-center mt-3 text-sm">{error}</p>}
        </form>

        {result && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <div 
              ref={posterRef}
              className="w-full max-w-md rounded-2xl p-8 shadow-2xl poster-glow relative overflow-hidden"
              style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}
            >
              {/* Decorative elements inside poster */}
              <div 
                className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top, rgba(233,213,255,0.5), transparent)' }}
              ></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold tracking-widest uppercase opacity-80" style={{ color: '#ffffff' }}>Your Pi Number</h2>
                  <div className="text-5xl font-black mt-2 tracking-widest" style={{ color: '#a78bfa' }}>
                    {result.target}
                  </div>
                  {result.position !== undefined && (
                    <p className="text-sm mt-2 opacity-70" style={{ color: '#e9d5ff' }}>
                      出现在圆周率小数点后第 {result.position.toLocaleString()} 位
                    </p>
                  )}
                </div>

                <div className="rounded-xl p-6 mb-8 border" style={{ background: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-lg leading-relaxed break-all font-mono text-justify" style={{ color: '#e5e7eb' }}>
                    ...{renderContext(result.context, result.target)}...
                  </p>
                </div>

                <div className="mt-auto text-center">
                  <p className="text-xl font-light italic leading-relaxed" style={{ color: '#f3e8ff' }}>
                    "{result.quote}"
                  </p>
                  <div className="mt-6 w-16 h-1 mx-auto rounded-full" style={{ background: 'linear-gradient(to right, #06b6d4, #a855f7)' }}></div>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="mt-8 flex items-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              <Download size={20} />
              保存海报
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
