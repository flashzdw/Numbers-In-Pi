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

### 4. 部署 Worker 后端

1. 进入 `worker` 目录并安装依赖：
   ```bash
   cd worker
   npm install
   ```
2. *(可选本地测试)* 如果你想先在本地运行和调试 Worker，可以执行 `npm run dev`（Vite 前端默认会代理到 Worker 的 `8787` 端口）。
3. 部署 Worker 到 Cloudflare：
   ```bash
   npm run deploy
   ```
   *部署成功后，终端会输出你的 Worker 公网 URL，例如：`https://pi-poster-api.<your-subdomain>.workers.dev`。请记录下这个 URL，下一步会用到。*

### 5. 部署 Pages 前端

1. 进入 `frontend` 目录并安装依赖：
   ```bash
   cd ../frontend
   npm install
   ```
2. 注入刚刚部署好的 Worker URL，并进行生产环境打包：
   ```bash
   # 请将下面 URL 替换为你实际的 Worker 地址
   VITE_API_URL=https://pi-poster-api.<your-subdomain>.workers.dev npm run build
   ```
3. 将打包好的静态文件一键部署到 Cloudflare Pages：
   ```bash
   wrangler pages deploy dist
   ```
   *部署成功后，终端会输出你的 Pages 网页链接。打开浏览器，即可体验属于你的 Pi Poster！*

---

## 本地环境部署指南 (Mac 端)

本项目采用了“前端 + 本地 Node.js 后端服务 + 二进制索引文件数据库”的架构。为提升在庞大的圆周率文本（如数十亿位）中的搜索速度，我们并没有使用传统的关系型数据库，而是通过构建高查询效率的 `.bin` 本地二进制索引文件来充当“数据库”。

以下是在 Mac 系统上进行本地部署的详细方法和步骤：

### 1. 环境准备

确保你的 Mac 上已经安装了 Node.js（推荐使用 Node.js 18 或更高版本）。

**检查 Node.js 安装状态：**
打开「终端 (Terminal)」，输入：
```bash
node -v
npm -v
```
*如果未安装，推荐使用 [Homebrew](https://brew.sh/) 安装：*
```bash
brew install node
```

### 2. 构建“数据库”（生成圆周率索引文件）

本地检索依赖于事先生成的二进制索引文件。如果你没有准备好真实的圆周率文本文件，脚本会自动生成一个 2000 万位的随机数字文件（`mock_pi.txt`）用于测试。

1. 打开终端，进入项目根目录下的 `scripts` 文件夹：
   ```bash
   cd scripts
   ```
2. 运行索引生成脚本：
   ```bash
   node generate-pi-index.js
   ```
   *执行完毕后，项目根目录会生成两个关键数据文件：*
   - `mock_pi.txt` (测试用的圆周率文本)
   - `pi_index.bin` (约 400MB 的高效检索二进制索引文件)

### 3. 部署本地后端服务 (Node.js API)

后端的 Express 服务会读取我们刚刚生成的二进制索引文件，从而实现精准读取（Range Read）且不占用大量内存。

1. 新开一个终端窗口，进入 `local-server` 目录：
   ```bash
   cd local-server
   ```
2. 安装后端依赖：
   ```bash
   npm install
   ```
3. 启动本地 API 服务：
   ```bash
   npm run dev
   ```
   *服务成功启动后，终端将输出：*
   `🚀 本地版 Pi Poster API 服务已启动!` 并在 `http://localhost:3000` 监听请求。

### 4. 启动前端页面

前端界面使用 React 和 Vite 构建。默认情况下，Vite 已配置了代理，会将 `/api` 请求转发给本地的 3000 端口（即刚启动的 Node.js 后端）。

1. 再次新开一个终端窗口，进入 `frontend` 目录：
   ```bash
   cd frontend
   ```
2. 安装前端依赖：
   ```bash
   npm install
   ```
3. 启动前端开发服务器：
   ```bash
   npm run dev
   ```
4. 在浏览器中访问 `http://localhost:5173`（以终端输出为准），即可在本地进行搜索测试！

> **进阶提示：** 
> 若你想测试 Cloudflare Worker 环境，可以在前端启动时配置环境变量：
> ```bash
> VITE_USE_WORKER=true npm run dev
> ```
> 这样前端的代理目标将切换到 worker 服务默认的 `http://localhost:8787` 端口。