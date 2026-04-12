# Init Pi Poster Website Spec

## Why
用户希望打造一个可以在圆周率中寻找特殊数字（如生日）并生成纪念海报的网站。现有的网站缺乏社交分享和极具美感的海报生成能力，且无法在低端设备和弱网上保证 8 位数查询的性能。本项目通过前沿的 Cloudflare O(1) 索引架构解决性能瓶颈，并提供优美的海报渲染方案。

## What Changes
- 初始化 React + Vite 前端项目并配置 TailwindCSS。
- 创建 Cloudflare Worker 后端 API 用于处理查询请求。
- 编写预处理脚本，用于生成 O(1) 二进制索引（`pi_index.bin`）。
- 在前端实现具有宇宙浪漫风格的 UI，并集成海报导出功能。

## Impact
- Affected specs: 核心查询流程、海报渲染逻辑。
- Affected code: 全新项目结构，包含 `/frontend`、`/worker`、`/scripts` 三个核心模块。

## ADDED Requirements
### Requirement: O(1) 二进制索引与 Range 查询
系统应能够在不加载全量数据的情况下，通过 HTTP Range 请求极速获取 8 位数字在 Pi 中的位置。
#### Scenario: Success case
- **WHEN** 用户查询 "19980512"
- **THEN** 系统计算偏移量，仅拉取对应字节，在 1 秒内返回包含前后文的结果。

### Requirement: 前端海报生成
系统应允许用户将查询结果及优美的文案渲染为图片并保存。
#### Scenario: Success case
- **WHEN** 用户在查询成功后点击“生成纪念海报”
- **THEN** 前端使用 Canvas 将指定 DOM 节点渲染为图片，并触发浏览器下载。
