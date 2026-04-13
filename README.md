# numbers-in-pi
A website that you can find any numbers in pi.

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