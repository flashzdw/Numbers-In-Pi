// 本地开发用静态数据服务器：替代 GitHub Releases，
// 为 pi_index.bin / mock_pi.txt 提供支持 HTTP Range 的下载地址。
// 用法：node scripts/dev-data-server.js [port]   （默认 8790）
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8790;

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = path.join(ROOT, urlPath);

  // 防目录穿越
  if (!filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  if (stat.isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      let start;
      let end;
      if (m[1] === '' && m[2] !== '') {
        // 后缀范围：bytes=-500
        start = Math.max(0, stat.size - parseInt(m[2], 10));
        end = stat.size - 1;
      } else {
        start = m[1] === '' ? 0 : parseInt(m[1], 10);
        end = m[2] === '' ? stat.size - 1 : parseInt(m[2], 10);
      }
      end = Math.min(end, stat.size - 1);

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'application/octet-stream',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }

  res.writeHead(200, {
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Content-Type': 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[dev-data-server] serving ${ROOT}`);
  console.log(`[dev-data-server] listening on http://localhost:${PORT}`);
});
