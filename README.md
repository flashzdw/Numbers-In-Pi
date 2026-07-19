# numbers-in-pi

一个在圆周率中查找数字并生成海报的小网站。

## 当前架构

- 生产环境：前端 + API 一起部署到 **Vercel**（项目根目录 `frontend/`）
  - 前端：`frontend/src/`，React + Vite
  - API：`frontend/api/search.ts`，Vercel Serverless Function
  - 数据：托管在**阿里云 OSS**（公共读 + Range 请求），通过环境变量 `DATA_INDEX_URL` / `DATA_PI_URL` 配置
- 本地开发：一键 `npm run dev`，同时拉起本地数据服务器 + Cloudflare Worker 模拟器 + Vite
- Cloudflare（Pages + Workers）仍作为备选部署路径保留，见下文

检索核心逻辑在 `frontend/api/_pi-search.ts`，Worker 与 Vercel Function 共用同一份代码；数据层只依赖“支持 HTTP Range 的静态文件 URL”，因此阿里云 OSS、Cloudflare R2、GitHub Releases、本地数据服务器都可以做数据源，换环境变量即可切换。

## 为什么不需要数据库

这个项目的查询模式是“读取静态大文件中的固定偏移片段”，并不是典型的增删改查业务。

- `pi_index.bin` 负责把数字前缀映射到候选位置（1 亿条 uint32，共 400MB）
- `mock_pi.txt` 负责提供命中位置周围的文本上下文
- API 只需要根据查询数字计算字节范围，然后对两个静态文件发起 Range 请求（单次查询只拉取 4B ~ 约 40KB）

因此不需要任何数据库；只要能稳定提供可 Range 读取的静态文件即可。

## 目录说明

```text
frontend/
  src/        React + Vite 前端
  api/        Vercel Serverless Function（api/search.ts）与共享检索核心（api/_pi-search.ts）
worker/       Cloudflare Worker（本地开发后端 + Cloudflare 备选部署）
scripts/      数据生成脚本与本地开发脚本
docs/         存储方案与广告变现调研
```

## 本地开发

### 0. 环境准备

Node.js 18 或更高版本。

```bash
npm run install:worker
npm run install:frontend
```

### 1. 一键启动（推荐）

```bash
npm run dev
```

一条命令拉起全部三个进程：

- `scripts/dev-data-server.js`（8790 端口）：本地数据源，模拟 OSS 的 Range 读取
- `wrangler dev`（8787 端口）：本地 Worker API
- `vite`（5173 端口）：前端，`/api` 自动代理到 8787

打开 vite 输出的地址即可完整体验“查询 → 生成海报 → 下载”。`Ctrl+C` 退出时会自动清理全部子进程。

### 2. 分开启动（调试单个服务时用）

```bash
npm run dev:data      # 数据服务器
npm run dev:worker    # Worker（读取 worker/.dev.vars 中的数据源地址）
npm run dev:frontend  # 前端
```

`worker/.dev.vars` 默认指向本地数据服务器（8790）；如需改用线上 OSS / Release 数据源，修改该文件即可（不要提交，已在 `.gitignore` 中）。

## 数据文件

项目当前数据（均在 `.gitignore` 中）：

- `pi-billion.txt`（1,000,000,002 字节）：**真实 10 亿位 π 数据**，格式为 `3.` + 小数点后 10 亿位。来源 calculat.io，已通过与 MIT SIPB 官方 checksum（MD5 `3901670f41a84174103bd6a8f07651c0`）逐字节比对验证
- `pi_index.bin`（400MB）：由 `scripts/generate-index-numpy.py` 基于真实数据生成，8 位数字覆盖率 99.9956%（符合理论期望值 1-e⁻¹⁰）
- `mock_pi.txt`（10MB）：早期的 1000 万位随机 mock 数据，仅留作快速测试

重新下载真实数据（断点续传，可反复执行）：

```bash
scripts/download-pi-zip.sh   # calculat.io 压缩包（469MB，国内较快）
# 或 scripts/download-pi.sh  # MIT 原始 txt（1GB，国内很慢）
```

重新生成索引（numpy 向量化，约 20 秒）：

```bash
python3 scripts/generate-index-numpy.py pi-billion.txt pi_index.bin
```

`worker/.dev.vars` 默认指向 `pi-billion.txt`；如改回 mock 数据测试，编辑该文件即可。

## 发布数据到阿里云 OSS（生产数据源）

1. 开通 OSS，创建一个 Bucket（地域任选，公共读）：
   - 读写权限：**公共读**（API 在服务端拉取，无需签名）
   - 防盗链：开启白名单，**允许空 Referer**（服务器间 fetch 不带 Referer），白名单填你的 Vercel 域名
   - 务必配置**用量告警**（OSS 外网流出 ¥0.5/GB 无封顶）
2. 上传两个数据文件（推荐 `ossutil`）：

   ```bash
   ossutil cp pi_index.bin oss://<bucket>/pi_index.bin
   ossutil cp pi-billion.txt oss://<bucket>/pi-billion.txt
   ```

3. 得到下载直链：

   ```text
   DATA_INDEX_URL=https://<bucket>.oss-cn-<region>.aliyuncs.com/pi_index.bin
   DATA_PI_URL=https://<bucket>.oss-cn-<region>.aliyuncs.com/pi-billion.txt
   ```

   使用 OSS 默认域名**不需要 ICP 备案**；只有绑定自定义域名到大陆节点时才需要。

成本参考：1.4GB 存储 + 10 万次查询/月 ≈ **¥3/月**。随机 Range 读取不要套 CDN（命中率≈0，白花流量费）。详细对比见 `docs/storage-research-2026.md`。

## 部署到 Vercel（生产）

1. 在 Vercel 导入 GitHub 仓库，配置：
   - Framework Preset：`Vite`
   - Root Directory：`frontend`
   - Build Command：`npm run build`（默认）
   - Output Directory：`dist`（默认）
2. 在 Project Settings → Environment Variables 中添加：
   - `DATA_INDEX_URL` = OSS 上的 `pi_index.bin` 地址
   - `DATA_PI_URL` = OSS 上的 π 文本地址
3. 部署。前端与 `/api/search` 同域，**不要**设置 `VITE_API_URL`。

> 注意：`*.vercel.app` 在大陆被 DNS 污染，面向国内用户建议绑定自定义域名并套 Cloudflare 代理；或者前端留在 Cloudflare Pages（见下）。

## 部署到 Cloudflare（备选路径）

### Worker

```bash
cd worker
wrangler secret put DATA_INDEX_URL
wrangler secret put DATA_PI_URL
wrangler deploy
```

### Pages

- Framework preset：`Vite`；Root directory：`frontend`
- Build command：`npm run build`；Output：`dist`
- 环境变量：`VITE_API_URL=https://pi-poster-api.<your-subdomain>.workers.dev`

数据文件也可以继续放在 GitHub Releases（单文件上限 2GiB，免费，但大陆访问不稳）或 Cloudflare R2（出站流量免费）。

## 常用命令

```bash
npm run dev              # 一键启动本地完整环境
npm run dev:data         # 仅数据服务器
npm run dev:worker       # 仅 Worker
npm run dev:frontend     # 仅前端
npm run build            # 前端生产构建
npm run install:worker
npm run install:frontend
```
