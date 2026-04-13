# 部署到 Cloudflare 架构迁移计划

## 1. 摘要 (Summary)
由于用户决定将整个项目（包括前端、后端以及“数据库”）全部署到 Cloudflare 上，本计划旨在将项目架构迁移至纯 Cloudflare 环境。我们将移除之前为了本地测试而创建的基于 Node.js Express 的本地后端 (`local-server`)，并通过 Cloudflare Pages、Cloudflare Workers 和 Cloudflare R2 Bucket（作为存储 `pi_index.bin` 和 `mock_pi.txt` 的数据库）来重构部署流程。

## 2. 当前状态分析 (Current State Analysis)
- **前端 (frontend)**：当前通过 `vite.config.ts` 中的 `VITE_USE_WORKER` 环境变量来切换请求到本地 3000 端口或 Worker 8787 端口。
- **本地后端 (local-server)**：一个基于 Express 的本地服务，现在已经不再需要。
- **Worker (worker)**：代码已经编写好，使用 R2 存储桶的 HTTP Range 请求来查询圆周率索引和具体数字内容。这部分代码已完全兼容 Cloudflare R2。
- **数据脚本 (scripts)**：能够生成测试用的 `mock_pi.txt` 和二进制索引 `pi_index.bin`，这是后续上传到 R2 存储桶的数据来源。

## 3. 提议的变更 (Proposed Changes)

### 3.1 移除冗余的本地后端服务
- **操作**：彻底删除 `/workspace/local-server` 目录及其所有内容。
- **原因**：用户要求所有组件都部署在 Cloudflare 上，本地 Express 后端失去了存在意义。

### 3.2 更新前端代理配置
- **文件**：`/workspace/frontend/vite.config.ts`
- **操作**：移除条件判断，直接将开发环境的本地 API 请求代理固定为 Cloudflare Worker 本地模拟器（Miniflare）的默认端口：`http://localhost:8787`。
- **原因**：简化本地开发配置，统一后端接口。

### 3.3 重写 `README.md` 部署指南
- **文件**：`/workspace/README.md`
- **操作**：将当前的本地部署指南替换为一套完整的、面向 Cloudflare 生态的部署步骤，涵盖：
  1. **准备数据**：使用脚本生成 `.bin` 索引和文本文件。
  2. **配置 R2 数据库**：通过 `wrangler` CLI 创建名为 `pi-data` 的 R2 存储桶，并使用 `wrangler r2 object put` 命令将两个数据文件上传至云端。
  3. **部署 Worker 后端**：进入 `worker` 目录，安装依赖并通过 `wrangler deploy` 上线 API。
  4. **部署 Pages 前端**：进入 `frontend` 目录，配置 `VITE_API_URL` 环境变量（指向部署好的 Worker 地址），构建并使用 `wrangler pages deploy dist` 上线前端。

## 4. 假设与决策 (Assumptions & Decisions)
- 假设用户已经安装了 `wrangler` 并且登录了有效的 Cloudflare 账号，且账号已经开启了 R2 服务（R2 有免费额度，但需绑定支付方式）。
- Cloudflare Worker 的代码 (`worker/src/index.ts`) 已经充分利用了 R2 的 Range 范围查询能力，不需要进行业务逻辑修改，仅需执行部署。
- 本计划不再包含任何“本地数据库+本地后端”的备用方案，保持项目纯粹的 Serverless 架构。

## 5. 验证步骤 (Verification Steps)
1. 确认 `local-server` 目录已被成功删除。
2. 确认 `frontend/vite.config.ts` 的代理端口已经硬编码为 `8787`。
3. 仔细检查 `README.md` 中的所有 `wrangler` 命令，确保语法无误（尤其是 `wrangler r2 bucket create` 和 `wrangler r2 object put` 命令）。
4. 确认在 `README.md` 中指明了前端在部署到 Pages 时的环境变量配置步骤。