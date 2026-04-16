# numbers-in-pi

A website that you can find any numbers in pi.

---

## 🚀 Cloudflare 架构部署指南

本项目采用纯 Cloudflare Serverless 架构构建，兼具高性能和极低的维护成本。
架构如下：
- **前端 (Frontend)**: 部署在 Cloudflare Pages，基于 React + Vite。
- **后端 (Backend)**: 部署在 Cloudflare Workers，提供无服务器 API。
- **数据库 (Database)**: 使用 Cloudflare R2 存储庞大的二进制索引和圆周率文本文件。

以下是从零开始部署整个项目到 Cloudflare 的详细步骤。

### 1. 环境准备

1. 确保你的电脑上安装了 **Node.js** (推荐 18+)。
2. 全局安装 Cloudflare 官方 CLI 工具 `wrangler`：
   ```bash
   npm install -g wrangler
   ```
3. 登录你的 Cloudflare 账号：
   ```bash
   wrangler login
   ```
   *(执行后会自动打开浏览器，授权登录即可)*

### 2. 准备“数据库”文件

为了能在数十亿位的圆周率中实现毫秒级搜索，我们需要生成高查询效率的二进制索引文件 `.bin`。

1. 进入 `scripts` 目录：
   ```bash
   cd scripts
   ```
2. 运行索引生成脚本：
   ```bash
   node generate-pi-index.js
   ```
   *说明：如果你没有准备好真实的圆周率文本文件，脚本会自动生成一个 2000 万位的随机数字文件（`mock_pi.txt`）以及对应的索引（`pi_index.bin`，约 400MB）。这两个文件会生成在项目根目录。*

### 3. 创建 R2 存储桶并上传数据

Cloudflare Worker 将直接读取 R2 存储桶中的数据。

1. 在终端中，使用 wrangler 创建一个名为 `pi-data` 的 R2 存储桶：
   ```bash
   wrangler r2 bucket create pi-data
   ```
2. 将根目录下刚生成的两个文件上传到该存储桶：
   ```bash
   # 回到项目根目录
   cd ..

   # 上传测试文本
   wrangler r2 object put pi-data/mock_pi.txt --file mock_pi.txt

   # 上传二进制索引文件（文件较大，可能需要几分钟）
   wrangler r2 object put pi-data/pi_index.bin --file pi_index.bin
   ```

### 4. 部署 Worker 后端 (通过 GitHub 自动部署)

我们推荐在 Cloudflare 网站上直接关联 GitHub 仓库，这样每次向仓库推送代码都会自动部署升级到最新版本。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，在左侧菜单点击 **Workers & Pages**。
2. 点击 **Create application** (创建应用程序)，选择 **Workers** 选项卡。
3. 点击 **Connect to Git** (连接到 Git)，授权并选择你的 `numbers-in-pi` GitHub 仓库。
4. 在构建设置中配置以下内容：
   - **Root directory (根目录)**: `worker`
5. 点击 **Save and deploy** (保存并部署)。
6. 部署成功后，你会在控制台看到该 Worker 分配的公网 URL，例如：`https://pi-poster-api.<your-subdomain>.workers.dev`。**请记录下这个 URL**，下一步部署前端时必须用到。

### 5. 部署 Pages 前端 (通过 GitHub 自动部署)

同样地，前端也可以通过关联 GitHub 实现自动化 CI/CD 部署。

1. 返回 **Workers & Pages** 主页，点击 **Create application**，这次选择 **Pages** 选项卡。
2. 点击 **Connect to Git**，选中你的 `numbers-in-pi` GitHub 仓库，点击 **Begin setup**。
3. 在构建设置 (Set up builds and deployments) 中，严格按如下内容填写：
   - **Framework preset**: `Vite` (或留空)
   - **Root directory (根目录)**: `frontend` *(⚠️极其重要：因为前端代码在子目录中)*
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 展开下方的 **Environment variables (advanced)** (环境变量)，添加一条后端 API 的指向记录：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://pi-poster-api.<your-subdomain>.workers.dev` *(即第 4 步中获取的 Worker 后端 URL)*
5. 点击 **Save and Deploy** (保存并部署)。
6. Cloudflare 将自动拉取你的代码并进行构建。完成后，它会分配给你一个类似 `https://numbers-in-pi.pages.dev` 的链接，你的网站就正式上线了！

🎉 **至此，你的前后端都已经和 GitHub 深度绑定。以后任何代码的修改，只要 `git push` 到仓库，Cloudflare 都会自动为你拉取、构建并发布最新版本！**
