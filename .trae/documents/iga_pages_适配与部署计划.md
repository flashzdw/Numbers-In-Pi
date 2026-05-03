## Summary（摘要）

将当前基于 Cloudflare Pages + Workers + R2 的项目，迁移为基于火山引擎 IGA Pages 的全量部署方案：前端继续使用 Vite 构建产物；后端以 IGA Pages 的 Functions/API 形式提供 `/api/search`；数据从 Cloudflare R2 迁移到火山引擎对象存储 TOS，并通过 Range 读取保证查询性能。

## Current State Analysis（现状分析）

- 前端：Vite + React，位于 [frontend/package.json](file:///workspace/frontend/package.json)，构建产物 `frontend/dist`。
- 后端：Cloudflare Worker，位于 [worker/src/index.ts](file:///workspace/worker/src/index.ts)，提供 `GET /api/search?q=xxxx`，依赖 R2 Range 读取：
  - `pi_index.bin`：8 位数字索引，按 `Uint32Array` 存储，支持按 offset/length 分片读取。
  - `mock_pi.txt`：圆周率（或 mock）文本，支持按 offset/length 分片读取。
- 数据生成：脚本位于 [scripts/generate-pi-index.js](file:///workspace/scripts/generate-pi-index.js)，默认生成到仓库根目录的 `mock_pi.txt`、`pi_index.bin`。
- 当前部署文档：根目录 [README.md](file:///workspace/README.md) 主要面向 Cloudflare（Pages/Workers/R2）。

## Proposed Changes（改造方案）

### 1) 以 IGA Pages 为单一部署单元（仓库根目录为项目根）

**目标**：IGA Pages 在一个项目里同时托管静态站点与 Functions/API。

- IGA Pages 构建输出目录：`frontend/dist`
- IGA Pages 构建命令：同时安装根依赖（Functions 依赖）与前端依赖，然后构建前端：
  - `npm ci && npm ci --prefix frontend && npm run build --prefix frontend`
- Functions 目录：在仓库根目录新增 `functions/`（若 IGA Pages 采用其他约定目录，将在执行阶段通过 `iga pages dev`/CLI 帮助确认并调整，但默认先按 `functions/` 落地）。

### 2) 后端从 Cloudflare Worker 迁移为 IGA Pages Function：`GET /api/search`

**新增文件（计划路径）**

- `functions/api/search.(js|ts)`：实现与现有 Worker 等价的接口：
  - 入参校验：`q` 为 4~8 位数字。
  - 读取索引文件：计算 8 位前缀范围，按 Range 读取索引片段，求最小位置 `minPos`。
  - 读取上下文：根据 `minPos` 按 Range 读取文本片段，返回 `found/position/context/searchStr`。
  - 统一 JSON 输出与错误处理。

**存储读取实现**

- 使用 `@volcengine/tos-sdk` 的 `getObjectV2` 进行 Range 读取（`rangeStart/rangeEnd`），避免整文件下载。
  - SDK 安装与 client 创建方式参考 `@volcengine/tos-sdk` 官方说明（npm 介绍页面明确了安装与 `TosClient` 初始化方式）：
    - `npm i @volcengine/tos-sdk`
    - `new TosClient({ accessKeyId, accessKeySecret, region, endpoint })`
    - 来源：npm 页面与 SDK README（见参考链接）。

**配置方式（不提交任何密钥）**

- IGA Pages 环境变量（建议命名，执行时会在控制台配置）：
  - `TOS_ACCESS_KEY_ID`
  - `TOS_ACCESS_KEY_SECRET`
  - `TOS_REGION`
  - `TOS_ENDPOINT`
  - `TOS_BUCKET`
  - `TOS_INDEX_KEY`（默认 `pi_index.bin`）
  - `TOS_PI_TEXT_KEY`（默认 `mock_pi.txt`）

### 3) 前端改造：默认同源调用 `/api/search`

**修改文件**

- [frontend/src/App.tsx](file:///workspace/frontend/src/App.tsx)

**改动点**

- 将请求从 `const API_BASE = import.meta.env.VITE_API_URL || ''` + `${API_BASE}/api/search` 简化为直接请求 `/api/search`（同源），避免部署时必须配置 `VITE_API_URL`。
- 保留（可选）兼容逻辑：如果仍希望支持“前后端分离部署”，可以继续允许 `VITE_API_URL` 覆盖同源；但全量迁移默认不需要它。

### 4) 构建/依赖改造：确保 IGA Pages 能安装 Functions 依赖

**修改文件**

- [package.json](file:///workspace/package.json)

**改动点**

- 新增根目录 scripts：
  - `build`：封装 IGA Pages 的 build command（便于本地/CI 对齐）
  - `dev`（可选）：用于本地联调（优先建议用 `iga pages dev`）
- 新增根目录依赖：
  - `@volcengine/tos-sdk`（Functions 读取 TOS）

> 说明：前端依赖仍由 `frontend/package.json` 管理，IGA Pages 构建命令显式执行 `npm ci --prefix frontend` 来安装它们。

### 5) 文档迁移：提供 IGA Pages + TOS 的完整部署指南

**修改文件**

- [README.md](file:///workspace/README.md)

**改动点**

- 增加 “IGA Pages 架构部署指南（TOS + Pages Functions）”，并将 Cloudflare 部署说明移到“历史方案/可选方案”。
- 明确 3 个部署阶段：
  1) 生成数据文件（`mock_pi.txt`、`pi_index.bin`）
  2) 创建 TOS Bucket 并上传对象（建议私有桶，通过服务端 AK/SK 访问；无需公开读）
  3) IGA Pages 项目配置（GitHub 持续部署 + 环境变量 + 构建命令 + 输出目录）

## Assumptions & Decisions（关键假设与决策）

- 已确认用户目标为“全量迁移 + GitHub 持续部署 + 本地浏览器登录”。
- IGA Pages 项目将以“仓库根目录”为项目根，便于同时托管 `frontend` 与 Functions。
- Functions 目录默认采用 `functions/`（执行阶段会通过 `iga pages dev`/CLI 帮助确认 IGA Pages 对 Functions 的实际约定；如 IGA Pages 采用 `api/` 等目录，将按 CLI 指引做等价调整）。
- TOS 访问凭据不写入仓库，全部通过 IGA Pages 环境变量配置。

## Verification（验证方式）

本地验证（执行阶段实施）：

1. `npm ci`（仓库根）确保 Functions 依赖安装成功。
2. `npm ci --prefix frontend && npm run build --prefix frontend` 确认前端可构建产出 `frontend/dist`。
3. `iga pages dev` 在本地启动整站（前端 + Functions）：
   - 访问页面可加载；
   - 请求 `GET /api/search?q=1234` 返回结构符合预期；
   - 针对无效输入返回 400。

线上验证（发布后）：

1. 打开 IGA Pages 分配的域名主页，执行一次搜索。
2. 在 IGA Pages 控制台查看 Functions 日志（如有），确认无 AK/SK 泄漏且请求成功。

## References（参考）

- IGA Pages CLI（命令与 Git-based / Direct upload 部署模式）：https://www.npmjs.com/package/@iga-pages/cli
- TOS JS SDK（安装与 `TosClient` 初始化示例）：https://www.npmjs.com/package/@volcengine/tos-sdk
