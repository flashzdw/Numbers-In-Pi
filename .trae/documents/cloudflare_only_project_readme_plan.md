# Cloudflare 单一路径收敛计划

## Summary

用户已明确选择：

- 仅保留 Cloudflare 部署方案
- 彻底移除 IGA 相关实现与说明
- 在“不再依赖数据库”的前提下，统一项目结构、部署入口与 README 文档

本次改造将把仓库重新收敛为单一的 Cloudflare 架构：

- 前端：`frontend/`，部署到 Cloudflare Pages
- 后端：`worker/`，部署到 Cloudflare Workers
- 数据：不再使用 R2/TOS/数据库，改为通过 GitHub Release 资产的 HTTP Range 读取 `pi_index.bin` 和 `mock_pi.txt`

## Current State Analysis

### 当前代码现状

- 根文档 `README.md` 目前把 IGA Pages 作为推荐主方案，同时仍保留一段旧 Cloudflare 指南，文档主线与代码真实形态不一致。
- 仓库同时存在两套后端实现：
  - `worker/src/index.ts`：Cloudflare Worker 版本，当前依赖 `R2Bucket`，并在 `worker/wrangler.toml` 中绑定了 `PI_STORAGE`
  - `functions/api/search.mjs`：IGA Pages Functions 版本，不依赖数据库，而是通过 `DATA_INDEX_URL` / `DATA_PI_URL` 直接对 GitHub Release 资产做 Range 请求
- 根脚本 `package.json` 仍保留 `build:iga`，说明项目入口仍围绕 IGA 构建流程设计。
- 前端 `frontend/src/App.tsx` 已兼容 Cloudflare 场景：
  - 默认使用 `window.location.origin`
  - 允许通过 `VITE_API_URL` 覆盖 API 域名
- `frontend/vite.config.ts` 已将 `/api` 本地代理指向 `http://localhost:8787`，天然适合本地联调 Cloudflare Worker。

### 当前存在的问题

- 部署主路径混乱：文档推荐 IGA，但项目里真正更适合“无数据库部署”的是 Cloudflare Worker + Pages。
- 后端逻辑重复：`worker/` 与 `functions/` 分别维护同一接口实现，后续容易漂移。
- Cloudflare Worker 仍保留 R2 绑定，而 README 主文档又声称当前方案已不需要数据库，实际不一致。
- 根 README 与 `frontend/README.md` 形成双重入口，其中 `frontend/README.md` 还是 Vite 模板内容，会误导维护者。
- `.gitignore` 仅忽略 `pi_index.bin`，未忽略 README 中明确会生成的 `mock_pi.txt`，也未为 Worker 本地密钥文件预留忽略规则。
- 前端对 API 返回的 `found: false` 缺少显式处理，切回 Cloudflare Worker 主路径后会继续暴露体验问题。

## Proposed Changes

### 1. 删除 IGA 后端实现与相关入口

#### 删除文件

- `/workspace/functions/api/search.mjs`

#### 变更原因

- 用户已明确要求“仅保留 Cloudflare”且“彻底删 IGA”。
- 该文件与 `worker/src/index.ts` 目标完全相同，只是部署平台不同，继续保留会造成重复维护。

#### 执行方式

- 删除整个 `functions/` 目录中的 IGA Function 实现。
- 根 README、根脚本中同步移除对 `functions/`、`iga pages dev`、`iga pages deploy`、`build:iga` 的所有引用。

### 2. 将 Cloudflare Worker 改为无数据库版本

#### 修改文件

- `/workspace/worker/src/index.ts`
- `/workspace/worker/wrangler.toml`

#### 变更原因

- 既然当前数据已可通过 GitHub Release 资产托管，Worker 完全可以像现有 IGA Function 一样通过 HTTP Range 直接读取数据文件，不再需要 R2。
- 这样可以保留 Cloudflare 的部署便利性，同时去掉数据库/R2 依赖，契合用户当前目标。

#### 执行方式

在 `worker/src/index.ts` 中：

- 删除 `PI_STORAGE: R2Bucket` 的环境定义。
- 引入与 `functions/api/search.mjs` 一致的三个能力，并以 TypeScript 形式保留在 Worker 中：
  - `jsonResponse()`：统一 JSON 响应头
  - `getIndexUrl()` / `getPiUrl()`：从环境变量读取 `DATA_INDEX_URL`、`DATA_PI_URL`
  - `fetchRange()`：支持 `Range` 头与 3xx 手动重定向跟随
- 保持 `/api/search` 的查询协议不变：
  - 入参 `q` 必须是 4 到 8 位数字
  - 对索引文件按范围读取 `Uint32Array`
  - 找到最小命中位置后，再对圆周率文本做第二次范围读取
  - 返回 `{ found, position, context, searchStr }`
- 保留现有 CORS 响应头，确保 Pages 前端跨域调用 Worker 时继续可用。

在 `worker/wrangler.toml` 中：

- 删除 `[[r2_buckets]]` 配置块。
- 保留 `name`、`main`、`compatibility_date`。
- 不把 `DATA_INDEX_URL` / `DATA_PI_URL` 明文写入仓库配置，改由 README 指导使用 Cloudflare Dashboard 或 `wrangler secret put` 配置。

### 3. 补齐 Worker 本地开发配置示例

#### 新增文件

- `/workspace/worker/.dev.vars.example`

#### 变更原因

- 去掉 R2 后，Worker 本地运行需要两条数据地址配置。
- 目前仓库没有任何本地变量示例文件，开发者需要自行猜测变量名，不利于上手。

#### 执行方式

新增示例文件，内容仅包含：

```env
DATA_INDEX_URL=https://github.com/<owner>/<repo>/releases/download/<tag>/pi_index.bin
DATA_PI_URL=https://github.com/<owner>/<repo>/releases/download/<tag>/mock_pi.txt
```

并在 README 中说明：

- 本地联调时复制为 `worker/.dev.vars`
- 线上部署时通过 Cloudflare Worker 的环境变量/Secrets 配置

### 4. 调整根项目脚本，去掉 IGA 语义

#### 修改文件

- `/workspace/package.json`

#### 变更原因

- 当前根脚本只剩 `build:iga`，命名已经不符合项目目标。
- 改成 Cloudflare/通用命名后，README 与实际命令才能一致。

#### 执行方式

将根脚本调整为面向当前仓库结构的通用入口，例如：

- `build`: `npm ci --prefix frontend && npm run build --prefix frontend`
- `dev:frontend`: `npm run dev --prefix frontend`
- `dev:worker`: `npm run dev --prefix worker`
- `install:worker`: `npm ci --prefix worker`
- `install:frontend`: 保留或统一命名

说明：

- 根目录不承担 Worker 构建职责，Worker 仍由 `worker/package.json` 下的 `wrangler` 命令负责。
- 本次不新增复杂编排脚本，避免过度设计。

### 5. 修正前端对“未命中结果”的处理

#### 修改文件

- `/workspace/frontend/src/App.tsx`

#### 变更原因

- 当前前端只检查 `res.ok`，没有检查接口体中的 `found`。
- 现有两套后端在“未找到匹配项”时都返回 200 + `{ found: false }`，这会导致前端误把未命中展示成成功结果。

#### 执行方式

在 `handleSearch` 中补上结果分支：

- 若 `data.found === false`：
  - `setResult(null)`
  - 设置明确的用户提示，例如“当前数据集中未找到该数字”
- 若 `data.found === true`：
  - 正常设置 `target/context/position`
- 保留 `VITE_API_URL || window.location.origin` 逻辑，不强制改为同源，以兼容 Pages 与 Worker 分开部署的 Cloudflare 方案。

### 6. 清理和补充项目文档

#### 修改文件

- `/workspace/README.md`
- `/workspace/frontend/README.md`
- `/workspace/.gitignore`

#### 变更原因

- `README.md` 当前以 IGA 为主，与用户决策冲突。
- `frontend/README.md` 仍是 Vite 模板，价值低且与根 README 冲突。
- `.gitignore` 未覆盖生成数据文件与 Worker 本地变量文件。

#### 执行方式

在 `README.md` 中，重写为 Cloudflare 单一路径文档，建议结构如下：

1. 项目简介
2. 当前架构
   - Frontend: Cloudflare Pages
   - Backend: Cloudflare Workers
   - Data: GitHub Release assets + HTTP Range
3. 为什么现在不需要数据库
   - 不再依赖 R2 / TOS / 其他对象存储
   - 大文件仅作为静态资产托管
   - 查询由 Worker 使用 Range 拉取完成
4. 本地开发
   - `npm ci --prefix worker`
   - `cp worker/.dev.vars.example worker/.dev.vars`
   - `npm run dev --prefix worker`
   - `npm run dev --prefix frontend`
   - 说明前端通过 Vite 代理访问 `localhost:8787`
5. 数据生成与发布
   - 运行 `scripts/generate-pi-index.js`
   - 生成 `mock_pi.txt` 和 `pi_index.bin`
   - 上传到 GitHub Release
6. 部署 Worker
   - 在 Cloudflare 中创建 Worker
   - 配置 `DATA_INDEX_URL`、`DATA_PI_URL`
   - `wrangler deploy`
7. 部署 Pages
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - 环境变量：`VITE_API_URL=https://<your-worker>.workers.dev`
8. GitHub 持续部署说明

在 `frontend/README.md` 中，二选一执行其一：

- 方案 A：删除该文件，避免与根 README 重复
- 方案 B：改写为 5 行以内的简要说明，并指向根 README

本计划采用 **方案 B**，理由是：

- 比直接删除更稳妥，不会破坏可能存在的目录级说明习惯
- 能主动把读者引导回根 README，减少文档分叉

在 `.gitignore` 中新增：

- `mock_pi.txt`
- `worker/.dev.vars`

保留现有：

- `pi_index.bin`
- `.wrangler`
- `node_modules`

## Assumptions & Decisions

- 决策：部署平台只保留 Cloudflare，不再维护 IGA 的代码路径和说明。
- 决策：不再使用 R2 作为数据存储，统一改为 GitHub Release 资产 + Range 读取。
- 决策：前端保留 `VITE_API_URL` 覆盖能力，因为 Cloudflare Pages 与 Workers 是天然前后端分离部署，保留该能力比强制同源更合理。
- 决策：`frontend/README.md` 采用“简短引导到根 README”的方式，不直接删除。
- 假设：`functions/` 目录当前只用于 IGA Pages Functions；删除后不会影响其他运行路径。
- 假设：数据文件仍由现有脚本生成，当前不改造 `scripts/generate-pi-index.js` 的算法与输出格式。
- 不在本次范围内：删除 `.trae/documents/` 下历史计划文档；这些文件属于工作记录，不影响项目运行。

## Verification Steps

### 代码与配置验证

1. 确认 `functions/` 目录已删除或不再包含任何运行时入口。
2. 确认 `worker/wrangler.toml` 中已不存在 `[[r2_buckets]]`。
3. 确认仓库内不再存在 `iga`、`IGA Pages`、`build:iga` 等用户可见主路径引用（`.trae/documents/` 除外）。

### 本地验证

1. 安装依赖：
   - `npm ci --prefix worker`
   - `npm ci --prefix frontend`
2. 复制变量示例：
   - `cp worker/.dev.vars.example worker/.dev.vars`
3. 启动 Worker：
   - `npm run dev --prefix worker`
4. 在另一个终端启动前端：
   - `npm run dev --prefix frontend`
5. 手工验证：
   - 打开前端页面
   - 输入合法数字（如 `1234`）可得到结果
   - 输入一个数据集中不存在的数字时，页面显示“未找到”而不是生成假结果
   - 输入非法数字（少于 4 位、超过 8 位、包含非数字）时，页面出现表单校验提示

### 构建与文档验证

1. 运行 `npm run build --prefix frontend`，确保前端可正常构建。
2. 通读 `README.md`，确认部署说明只剩 Cloudflare 路径，且顺序为“生成数据 -> 配置 Worker -> 配置 Pages -> 持续部署”。
3. 检查 `frontend/README.md` 是否已不再保留 Vite 模板默认内容。
