# numbers-in-pi 数据存储/部署选型调研（2025–2026 核实）

场景：1GB π 文本 + 400MB 二进制索引，API 每次查询只做 4B–40KB 的 HTTP Range 随机读。
受众主要在中国大陆，目标最低成本。规模假设：10 万次查询/月 × 50KB ≈ 5GB 出站流量/月。

## 结论先行

**推荐：数据放阿里云 OSS（标准-本地冗余），月成本约 3 元人民币；前端/API 迁 Vercel 没问题，但 Vercel 域名本身在国内访问不稳，这才是真正的瓶颈，不是存储层。**
若想绝对零成本且接受国内访问一般：Cloudflare R2 ≈ $0/月（免费额度内）。

## 逐项核实

### 1. Vercel Blob
- **Range 支持**：✅ 官方文档明确支持，直接 `curl -r` 即可。https://vercel.com/docs/vercel-blob/examples
- **单文件上限**：5TB（>100MB 建议 multipart）。✅ 能存 1.4GB。
- **价格**：存储 $0.023/GB-月；Simple 操作（读）$0.40/百万次；Advanced（写/list）$5.00/百万次；Blob Data Transfer 约 $0.05/GB 起；缓存未命中另收 Fast Origin Transfer 约 $0.06/GB。https://vercel.com/docs/vercel-blob/usage-and-pricing
- **Hobby 免费额度**：1GB 存储 + 10GB BDT + 1万次 Simple 操作/月。❌ **1.4GB 数据直接超免费额度**，必须 Pro（$20/席/月）。https://vercel.com/blog/vercel-blob-now-generally-available
- **致命坑 — 512MB 缓存上限**：单 blob 超过 512MB 永不缓存，**每次访问都是 cache MISS**，每次都收 Simple Operation + Fast Origin Transfer。你的 1GB π 文件正好踩中；且随机 Range 读模式下缓存本来就无意义（命中率≈0），400MB 索引同理。https://vercel.com/docs/vercel-blob/usage-and-pricing
- **从 serverless 函数读的正确姿势**：用 public blob URL + fetch(Range header)。private blob 必须经函数中转，等于付双倍流量（BDT + Fast Data Transfer）。每次 URL 访问计 1 次 Edge Request（Hobby 含 100 万次/月，10 万次查询够用）。
- **成本估算（Pro）**：订阅 $20 + 存储 $0.03 + 流量/BDT/FOT/操作约 $0.65 ≈ **$20.7/月**。

### 2. Vercel 平台限制
- **函数 bundle 上限 250MB（解压后，AWS Lambda 强制）** — 1.4GB 数据**绝无可能**打进部署包，必须外置存储。https://vercel.link/edge-function-size
- 内存：Hobby 默认 2GB/1vCPU；Pro 可配到 4GB/2vCPU。时长（Fluid Compute）：Hobby 300s，Pro 800s；老模式 Hobby 默认 10s/上限 60s。函数请求体上限 4.5MB（服务端上传大文件不可行，需 client upload）。
- **中国大陆访问**：`*.vercel.app` 自 2021 年起被 DNS 污染/封锁，自定义域名 + `cname-china.vercel-dns.com`（A: 76.223.126.88）是官方给的绕行方案，但社区反馈稳定性差、随时可能再被墙；Vercel 无 ICP 备案支持。https://www.cnblogs.com/aitec/articles/vercel.html

### 3. 阿里云 OSS
- **Range GET**：✅ 原生支持 `Range: bytes=x-y`，返回 206 Partial Content。https://www.alibabacloud.com/help/zh/oss/developer-reference/getobject
- **大陆价格（标准-本地冗余，按量）**：存储 0.12 元/GB-月；GET 请求 0.01 元/万次；外网流出流量 忙时(08–24点) 0.5 元/GB、闲时 0.25 元/GB；CDN 回源流量 0.15 元/GB。https://github.com/qxytah/aliyun-oss-pricing 、https://shanyue.tech/no-vps/deploy-fe-with-alioss.html
- **月成本估算**：存储 1.4GB×0.12=0.17 元 + 请求 10万次×0.01=0.1 元 + 流量 5GB×0.5=2.5 元 ≈ **2.8 元/月（约 $0.4）**。
- **备案**：用 OSS 默认域名（bucket.oss-cn-xx.aliyuncs.com）做 API 数据源**不需要备案**；只有绑定自定义域名解析到大陆节点才需 ICP 备案。注意浏览器直接访问 OSS 默认域名对某些类型强制下载，但对服务端 Range 读取无影响（CORS 可配）。

### 4. Cloudflare R2
- 存储 $0.015/GB-月；**出站流量永久 $0**；Class A（写）$4.50/百万、Class B（读）$0.36/百万；免费额度每月 10GB 存储 + 100万 Class A + 1000万 Class B。https://developers.cloudflare.com/r2/pricing/
- Range：支持（S3 API GetObject Range / 公开 bucket HTTP Range）。
- **从 Vercel 函数读完全可行**：公开 bucket URL（r2.dev 或自定义域名）或 S3 API 带凭证均可，服务器到服务器，跨洋延迟约 100–300ms。
- **本项目月成本 ≈ $0**（1.4GB 存储、10 万次读全在免费额度内，且零流量费 = 无"流量陷阱"）。
- 国内访问：Cloudflare 免费版无中国节点，r2.dev 域名国内可达性一般；但作为服务器间数据源不影响终端用户。

### 5. GitHub Releases（现状）
- **单 asset 上限 2 GiB**（确认），Release 总大小与带宽均无官方上限。https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- 实际坑：社区报告 >1GB 文件上传常挂起/失败（无分片断点续传）；大陆访问 objects.githubusercontent.com 慢且不稳，无 SLA。https://github.com/orgs/community/discussions/170005

## 对比表

| | Vercel Blob | 阿里云 OSS | Cloudflare R2 | GitHub Releases |
|---|---|---|---|---|
| 支持 Range | ✅ | ✅ | ✅ | ✅（重定向后支持） |
| 能存 1.4GB | ✅（上限5TB） | ✅ | ✅ | ✅（单文件<2GiB） |
| 存储费 | $0.023/GB-月 | ¥0.12/GB-月 | $0.015/GB-月 | 免费 |
| 流量/请求费 | BDT ~$0.05/GB + FOT ~$0.06/GB(MISS) + $0.40/百万读 | 流出 ¥0.5/GB(忙时) + GET ¥0.01/万次 | **出站 $0**；读 $0.36/百万 | 免费 |
| 10万次查询/月估算 | **~$20.7**（含 Pro 订阅；Hobby 1GB 免费额度装不下） | **~¥2.8（~$0.4）** | **~$0**（免费额度内） | $0 |
| 国内访问 | 差（vercel 系域名被污染） | **极好** | 一般（无中国节点） | 差且不稳 |
| 是否需备案 | 不需要（但也备不了） | 默认域名不需要；绑自定义域名才需要 | 不需要 | 不需要 |

## 重要提醒（坑）
1. **Vercel Blob 512MB 缓存上限**：>512MB 的 blob 每次访问都是 MISS，逐次收 Fast Origin Transfer；随机 Range 读场景缓存本就无效，1GB π 文件放 Blob 是最差匹配。
2. **OSS 流量费陷阱**：¥0.5/GB 按量无封顶，若被查分脚本/爬虫全量拉一遍 1GB 文件，一次就是 ¥0.5；务必开**用量告警+欠费关停**，并考虑防盗链/Referer 校验。随机 Range 读**不要套 CDN**（命中率≈0，白付 CDN 流量费）。
3. **Vercel 前端才是国内访问的真正短板**：数据放哪都救不了 vercel.app 被污染；若国内体验是硬指标，前端留 Cloudflare Pages（或备案后上国内 CDN）比迁 Vercel 更合理。
4. GitHub Releases 可继续作为零成本冷备/镜像源。
