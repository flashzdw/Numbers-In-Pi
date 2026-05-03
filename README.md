# numbers-in-pi

一个在圆周率中查找数字并生成海报的小网站。

## 当前架构

项目现在只保留一条 Cloudflare 部署路径：

- 前端：`frontend/`，部署到 Cloudflare Pages
- 后端：`worker/`，部署到 Cloudflare Workers
- 数据：`pi_index.bin` 与 `mock_pi.txt` 作为 GitHub Release 资产托管，Worker 通过 HTTP Range 按需读取

## 为什么现在不需要数据库

这个项目的查询模式是“读取静态大文件中的固定偏移片段”，并不是典型的增删改查业务。

- `pi_index.bin` 负责把数字前缀映射到候选位置
- `mock_pi.txt` 负责提供命中位置周围的文本上下文
- Worker 只需要根据查询数字计算字节范围，然后对两个静态文件发起 Range 请求

因此现在不需要 Cloudflare R2、D1、TOS 或其他数据库/对象存储服务；只要能稳定提供可 Range 读取的静态文件即可。当前默认方案是 GitHub Releases。

## 目录说明

```text
frontend/   React + Vite 前端
worker/     Cloudflare Worker API
scripts/    数据生成脚本
```

## 环境准备

1. 安装 Node.js 18 或更高版本。
2. 安装并登录 Wrangler：

```bash
npm install -g wrangler
wrangler login
```

## 生成数据文件

进入 `scripts/` 后运行索引生成脚本：

```bash
cd scripts
node generate-pi-index.js
```

脚本会在项目根目录生成：

- `mock_pi.txt`
- `pi_index.bin`

这两个文件默认已经加入 `.gitignore`，不建议直接提交到仓库。

## 发布数据到 GitHub Releases

推荐把两个数据文件作为 Release 资产上传，便于 Worker 直接通过公开下载链接做 Range 请求。

1. 在 GitHub 仓库中创建一个 Release，例如 `data-v1`。
2. 上传以下文件：
   - `pi_index.bin`
   - `mock_pi.txt`
3. 记录两个下载直链，例如：
   - `DATA_INDEX_URL=https://github.com/<owner>/<repo>/releases/download/data-v1/pi_index.bin`
   - `DATA_PI_URL=https://github.com/<owner>/<repo>/releases/download/data-v1/mock_pi.txt`

## 本地开发

### 1. 安装依赖

```bash
npm ci --prefix worker
npm ci --prefix frontend
```

也可以使用根目录快捷命令：

```bash
npm run install:worker
npm run install:frontend
```

### 2. 配置 Worker 本地环境变量

复制示例文件：

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

然后把其中的 `DATA_INDEX_URL` 和 `DATA_PI_URL` 改成你自己的 Release 资产地址。

### 3. 启动 Worker

```bash
npm run dev --prefix worker
```

或者：

```bash
npm run dev:worker
```

默认会在本地启动 Cloudflare Worker 开发服务。

### 4. 启动前端

```bash
npm run dev --prefix frontend
```

或者：

```bash
npm run dev:frontend
```

前端开发服务器会把 `/api` 请求代理到 `http://localhost:8787`，因此本地联调时不需要额外配置 `VITE_API_URL`。

## 部署 Worker

进入 `worker/` 后部署：

```bash
cd worker
wrangler secret put DATA_INDEX_URL
wrangler secret put DATA_PI_URL
wrangler deploy
```

部署完成后，你会得到一个 Worker 地址，例如：

```text
https://pi-poster-api.<your-subdomain>.workers.dev
```

## 部署 Pages

在 Cloudflare Pages 中连接 GitHub 仓库后，使用以下配置：

- Framework preset：`Vite`
- Root directory：`frontend`
- Build command：`npm run build`
- Build output directory：`dist`

并在 Pages 环境变量中设置：

- `VITE_API_URL=https://pi-poster-api.<your-subdomain>.workers.dev`

这样前端构建后会直接请求你的 Worker API。

## GitHub 持续部署

推荐让 Worker 和 Pages 都通过 GitHub 仓库自动构建部署：

- Worker：在 Cloudflare Workers 中连接仓库，根目录指向 `worker`
- Pages：在 Cloudflare Pages 中连接仓库，根目录指向 `frontend`

之后每次推送代码，Cloudflare 都会自动拉取并重新部署。

## 常用命令

```bash
npm run install:worker
npm run install:frontend
npm run dev:worker
npm run dev:frontend
npm run build
npm run build:frontend
```
