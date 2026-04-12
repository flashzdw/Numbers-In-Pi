# Tasks
- [x] Task 1: 初始化项目结构与基础环境
  - [x] SubTask 1.1: 创建 `frontend` 目录（React + Vite + TailwindCSS）
  - [x] SubTask 1.2: 创建 `worker` 目录（Cloudflare Worker 配置）
  - [x] SubTask 1.3: 创建 `scripts` 目录并编写生成二进制索引的 Node.js 脚本
- [x] Task 2: 实现后端 Cloudflare Worker API
  - [x] SubTask 2.1: 编写 R2 Bucket 绑定与 Range 请求逻辑
  - [x] SubTask 2.2: 实现 O(1) 索引解析与上下文拉取接口
- [x] Task 3: 实现前端核心功能与 UI
  - [x] SubTask 3.1: 开发主页 UI（宇宙浪漫风格、输入框、查询按钮）
  - [x] SubTask 3.2: 联调后端 API 实现数字查询与状态展示
- [x] Task 4: 实现海报生成功能
  - [x] SubTask 4.1: 设计海报 DOM 结构（文案、数字高亮、排版）
  - [x] SubTask 4.2: 集成 `html2canvas` 或相似库实现一键导出图片

# Task Dependencies
- [Task 2] 依赖于 [Task 1]
- [Task 3] 依赖于 [Task 1] 和 [Task 2] 的接口定义
- [Task 4] 依赖于 [Task 3]
