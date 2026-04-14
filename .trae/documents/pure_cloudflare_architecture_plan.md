# 纯 Cloudflare 架构迁移计划

## 摘要
撤销本地 Node.js 后端服务，全面恢复并采用纯 Cloudflare Serverless 架构（前端部署于 Pages，后端基于 Worker，数据库使用 R2）。完成代码修改和本地验证后，提交更改并创建 Pull Request 以供审查。

## 现状分析
在此前的合并中，项目混合了本地 Node.js 服务与 Cloudflare 服务双环境。目前：
- 存在 `local-server` 目录（包含本地 Express 服务）。
- `frontend/vite.config.ts` 使用了条件代理，兼容端口 `3000` 和 `8787`。
- `README.md` 包含了混合的双环境部署指南。

## 提议的变更
1. **移除本地后端代码**：
   - 彻底删除 `local-server` 目录及其下的所有文件。
2. **更新前端配置**：
   - 修改 `frontend/vite.config.ts`：移除环境变量判断逻辑，将 `/api` 的代理目标直接指向本地 Worker 模拟器端口 `http://localhost:8787`。
3. **精简文档**：
   - 修改 `README.md`：删除自“## 本地环境部署指南 (Mac 端)”及其后的所有内容，仅保留 Cloudflare 架构的部署说明。
4. **更新 PR 元数据**：
   - 修改 `pr_payload.json`：将其 `title` 和 `body` 更新为反映纯 Cloudflare 架构的文案。

## 假设与决策
- 用户的核心意图是废弃本地 Node.js 架构，全盘使用 Cloudflare 方案。
- 创建 PR 的目标分支假设为 `main`，源分支为当前的 `trae/solo-agent-nnOEF0`。

## 验证步骤
1. 在 `frontend` 目录下运行 `npm run build`，确保 Vite 代理配置修改不影响正常打包。
2. 运行 `git status` 与 `git diff` 确认被删除和修改的文件正确。
3. 使用 `git commit` 及 `git push` 将变更推送到远程源分支。
4. 通过 GitHub MCP 工具（或相应的 API）创建 PR，获取返回的 PR 链接以供用户点击查看。
