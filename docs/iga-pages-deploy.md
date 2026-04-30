# 火山引擎 IGA Pages 部署指南（适用于本项目）

本项目的前端位于 `frontend/`，技术栈为 React + Vite，构建产物默认输出到 `frontend/dist/`。

## 1. 代码侧已完成的适配点

- 已在 `frontend/public/_redirects` 增加 SPA 回退规则：`/* /index.html 200`（若平台支持 `_redirects` 规则文件，会随构建产物一起发布）。
- 已在 `frontend/public/404.html` 增加兜底跳转到 `/`（部分平台只支持自定义 404 页面时可用）。
- 前端请求后端 API 的逻辑为：优先使用 `VITE_API_URL`，未配置时回退到同域名的 `/api`。

## 2. IGA Pages 控制台部署（推荐：从 Git 持续部署）

### 2.1 新建站点

1. 进入 IGA Pages 控制台，选择「从 Git 导入 / 连接仓库」创建站点。
2. 选择仓库与部署分支（例如 `main`）。

### 2.2 构建配置（关键）

如果控制台支持填写 Root Directory（根目录/工作目录），建议按以下方式填写：

- Root Directory：`frontend`
- Install Command：`npm ci`
- Build Command：`npm run build`
- Output Directory：`dist`

如果控制台不支持 Root Directory：

- 需要在控制台选择「仓库子目录」或「工作目录」为 `frontend`；若只能使用仓库根目录构建，则需要平台支持在命令里指定子目录（例如 `npm --prefix frontend ci` 这一类），再配合把产物目录指向 `frontend/dist`。

### 2.3 环境变量（可选但通常需要）

本项目在前端通过 `import.meta.env.VITE_API_URL` 读取后端地址：

- 变量名：`VITE_API_URL`
- 变量值示例：
  - 同域后端：留空（前端会请求 `/api/search`）
  - 独立域名后端：`https://pi-poster-api.example.com`

注意：静态站点通常只有“构建期注入”，环境变量改动后一般需要重新触发构建才能生效。

### 2.4 路由回退（SPA 必配）

如果你的 IGA Pages 支持控制台「重写/回退」规则，建议配置一条：

- 匹配：`/*`
- 目标：`/index.html`
- 状态码：`200`

如果平台不支持控制台重写，但支持 `_redirects` 文件：本项目已在 `frontend/public/_redirects` 写入回退规则，构建后会出现在 `dist/_redirects`。

## 3. 发布后自查清单

- 首次访问首页：JS/CSS 资源能正常加载（Network 无 404）。
- 直接访问任意路径（或手动在地址栏输入不存在路径）：
  - 若能回到首页，说明“回退/重写”生效。
  - 若出现 404，检查是否需要在控制台配置重写规则，或平台是否支持 `_redirects`。
- API 请求：
  - 若前端走同域 `/api`，确认 IGA Pages 是否支持反向代理到后端；不支持时需改用 `VITE_API_URL` + 后端开启 CORS。

## 4. 本地验证（建议在提交前做一次）

在仓库根目录执行：

```bash
cd frontend
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

然后检查构建产物：

- `frontend/dist/_redirects` 是否存在
- `frontend/dist/404.html` 是否存在

