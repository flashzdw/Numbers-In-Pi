// 一键启动本地完整开发环境：
//   1. dev-data-server (8790) — 模拟 OSS/R2 的 Range 数据源
//   2. wrangler dev    (8787) — 本地 Worker API
//   3. vite            (5173) — 前端，/api 自动代理到 8787
//
// 用法：npm run dev [-- --port 5173 --host 127.0.0.1]
// --port / --host 等参数会透传给 vite。Ctrl+C 或进程退出时会带走全部子进程。
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PORT = 8790;
const WORKER_PORT = 8787;

const viteArgs = process.argv.slice(2);
const children = [];
let shuttingDown = false;

function checkPort(port) {
  return new Promise((resolve) => {
    const sock = net.connect(port, '127.0.0.1');
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => resolve(false));
  });
}

// 启动前检查端口，避免旧的残留进程导致奇怪的失败
async function preflight() {
  for (const [name, port] of [['数据服务器', DATA_PORT], ['Worker', WORKER_PORT]]) {
    if (await checkPort(port)) {
      console.error(`[dev-local] 端口 ${port} 已被占用（${name}需要它）。`);
      console.error(`[dev-local] 可能是上次没退干净的残留进程，执行: lsof -ti :${port} | xargs kill`);
      process.exit(1);
    }
  }
}

function start(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
  });
  child.on('error', (err) => {
    console.error(`[dev-local] ${name} 启动失败:`, err.message);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== null && code !== 0) {
      console.error(`[dev-local] ${name} 异常退出 (code=${code})，正在关闭其它进程…`);
      shutdown(code);
    } else if (!shuttingDown && signal) {
      shutdown(0);
    }
  });
  children.push(child);
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try { child.kill('SIGTERM'); } catch { /* ignore */ }
  }
  // 给子进程一点清理时间（wrangler 需要带走 workerd），超时强杀
  setTimeout(() => {
    for (const child of children) {
      try { child.kill('SIGKILL'); } catch { /* ignore */ }
    }
  }, 1500).unref();
  setTimeout(() => process.exit(code), 2000).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  await preflight();
  console.log('[dev-local] 启动本地完整环境…');
  console.log(`[dev-local] 数据服务器  → http://localhost:${DATA_PORT}`);
  console.log(`[dev-local] Worker API  → http://localhost:${WORKER_PORT}`);
  console.log('[dev-local] 前端地址见下方 vite 输出');

  start('data-server', process.execPath, [path.join(ROOT, 'scripts/dev-data-server.js'), String(DATA_PORT)], ROOT);
  start('worker', path.join(ROOT, 'worker/node_modules/.bin/wrangler'), ['dev', '--port', String(WORKER_PORT)], path.join(ROOT, 'worker'));
  start('vite', path.join(ROOT, 'frontend/node_modules/.bin/vite'), viteArgs, path.join(ROOT, 'frontend'));
}

main();
