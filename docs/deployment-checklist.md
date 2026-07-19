# 上线执行清单：OSS 数据 + Vercel 部署

全程约 30–60 分钟（主要是 1.4GB 上传时间）。只需要填 4 个空：

| 占位符 | 填什么 | 在哪拿 |
|--------|--------|--------|
| `<BUCKET>` | OSS Bucket 名，如 `numbers-in-pi-data`（全局唯一，起个没人用的） | 步骤 1 自己起 |
| `<REGION>` | Bucket 地域，如 `hangzhou`、`shanghai`、`beijing` | 步骤 1 创建时选 |
| `<AK>` / `<SK>` | RAM 子账号 AccessKey ID / Secret | 步骤 2 创建 |
| `<APP>` | Vercel 项目名（部署后得到的 `<APP>.vercel.app`） | 步骤 5 |

---

## 步骤 0：把代码推上 GitHub（5 分钟）

当前改动（Vercel Function、共享核心、脚本、文档）还没提交：

```bash
cd ~/Desktop/Develop/Coding/Numbers-In-Pi
git add -A
git commit -m "feat: Vercel 迁移 + OSS 数据层 + 真实 10 亿位 π 数据支持"
git push
```

> 注意：`pi-billion.txt` / `pi_index.bin` / `mock_pi.txt` 已在 `.gitignore` 中，不会误传 1.4GB 到仓库。

## 步骤 1：创建 OSS Bucket（5 分钟）

1. 登录 <https://oss.console.aliyun.com>，首次使用点"开通 OSS"（按量付费，不用买套餐）
2. 「创建 Bucket」：
   - Bucket 名称：`<BUCKET>`
   - 地域：任选一个国内地域（`<REGION>`，离谁都行，服务端拉取差异不大）
   - 存储类型：标准存储 - 本地冗余（LRS）—— 最便宜，够用
   - **读写权限：公共读**（其他选项全默认，版本控制/加密都不用开）
3. 创建后进入 Bucket →「权限控制」→「防盗链」：
   - 开启 Referer 白名单：填 `*.vercel.app` 和你的自定义域名（如有）
   - **"允许空 Referer"选 是**（关键！Vercel 服务端 fetch 不带 Referer，选否则 API 全挂）

## 步骤 2：创建 RAM 子账号拿密钥（5 分钟，安全起见别用主账号 AK）

1. 打开 RAM 控制台 <https://ram.console.aliyun.com/users> →「创建用户」
   - 登录名随意（如 `pi-uploader`），**只勾"OpenAPI 调用访问"**（不勾控制台访问）
2. 创建后保存 **AccessKey ID（`<AK>`）和 Secret（`<SK>`）**（Secret 只显示一次）
3. 给该用户「新增授权」，用自定义策略做最小授权（只能读写这一个 Bucket）：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject", "oss:GetObject", "oss:ListObjects", "oss:AbortMultipartUpload", "oss:ListParts"],
      "Resource": ["acs:oss:*:*:<BUCKET>", "acs:oss:*:*:<BUCKET>/*"]
    }
  ]
}
```

## 步骤 3：安装 ossutil 并上传数据（10–40 分钟，看上传带宽）

```bash
# Apple Silicon 安装 ossutil（Intel Mac 把 arm64 换成 64）
curl -o /usr/local/bin/ossutil https://gosspublic.alicdn.com/ossutil/1.7.19/ossutilmacarm64
chmod +x /usr/local/bin/ossutil

cd ~/Desktop/Develop/Coding/Numbers-In-Pi

# 上传两个文件（-e 填地域终端节点，-u 开断点续传分片上传）
ossutil cp pi_index.bin oss://<BUCKET>/pi_index.bin -e oss-cn-<REGION>.aliyuncs.com -i <AK> -k <SK> -u
ossutil cp pi-billion.txt oss://<BUCKET>/pi-billion.txt -e oss-cn-<REGION>.aliyuncs.com -i <AK> -k <SK> -u
```

> 时间参考：上传带宽 50Mbps ≈ 4 分钟；10Mbps ≈ 20 分钟。断了重跑同一命令即可续传。
> 也可以在 OSS 控制台网页直接拖文件上传（400MB 的索引没问题，1GB 的 txt 网页上传容易断，推荐命令行）。

**上传后立即验证 Range 支持**（这是整个架构的命门）：

```bash
# 应返回 206 和 Content-Range，且恰好 16 字节
curl -s -r 0-15 -D - -o /dev/null https://<BUCKET>.oss-cn-<REGION>.aliyuncs.com/pi_index.bin | grep -E "HTTP|Content-Range|Content-Length"
# 预期: HTTP/1.1 206 Partial Content / Content-Range: bytes 0-15/400000000 / Content-Length: 16
```

## 步骤 4：配置用量告警（2 分钟，防流量费失控）

OSS 外网流出 ¥0.5/GB 无封顶，必须上保险：

1. 阿里云「费用与成本」→「用户中心」→ 左侧「额度预警/费用预警」
2. 建一个预警：OSS 产品，日消费 > ¥5 就短信/邮件通知
3. 顺手在 Bucket「基础设置」里确认没有开通任何 CDN 加速（随机 Range 读套 CDN 是白花钱）

## 步骤 5：部署 Vercel（10 分钟）

1. 打开 <https://vercel.com/new> → Import 你的 GitHub 仓库
2. 配置（关键两项）：
   - **Root Directory：点 Edit 选 `frontend`**
   - Framework Preset：自动识别 `Vite`，不用改
3. **Environment Variables** 添加两条（环境勾 Production）：

   | Name | Value |
   |------|-------|
   | `DATA_INDEX_URL` | `https://<BUCKET>.oss-cn-<REGION>.aliyuncs.com/pi_index.bin` |
   | `DATA_PI_URL` | `https://<BUCKET>.oss-cn-<REGION>.aliyuncs.com/pi-billion.txt` |

4. Deploy，约 1 分钟拿到 `https://<APP>.vercel.app`

> 不要设置 `VITE_API_URL`（前端和 API 同域，走相对路径）。
> 免费版函数默认跑在美东，跨境拉 OSS 每次查询多约 200–300ms，可接受；在意的话 Pro 版可把函数区域改到新加坡。

## 步骤 6：线上验证（5 分钟）

```bash
# API 验证：结果应与本地完全一致
curl -s "https://<APP>.vercel.app/api/search?q=19980512"
# 预期: {"found":true,"position":120616829,"context":"410841250461895993321998051286350972772189042980",...}

curl -s "https://<APP>.vercel.app/api/search?q=00000703"
# 预期: {"found":false,...}
```

再开浏览器人工走一遍：搜索生日 → 海报渲染 → 保存海报 → 检查图片里数字高亮和上下文对不对。

## 步骤 7（可选但强烈建议）：自定义域名 + Cloudflare 代理

`*.vercel.app` 在大陆被 DNS 污染，国内用户打不开。有一个自己的域名就能解：

1. 域名 DNS 迁到 Cloudflare（免费）
2. Vercel 项目 Settings → Domains 添加域名
3. Cloudflare 加 CNAME 记录指向 `cname.vercel-dns.com`，**开启橙色小云（Proxied）**

---

## 成本预估

| 项目 | 费用 |
|------|------|
| OSS（1.4GB 存储 + 10 万次查询/月） | ≈ ¥3/月 |
| Vercel Hobby | $0 |
| Cloudflare | $0 |
| **合计** | **≈ ¥3/月** |

## 出问题怎么回滚

- API 报 500 且 details 含 `HTTP 403`：OSS 防盗链没允许空 Referer → 回步骤 1.3
- API 报 500 且 details 含 `HTTP 404`：环境变量 URL 拼错 → 回步骤 5.3 对一遍
- 查询能通但位置不对：传错数据文件了（比如把 mock 传上去了）→ 回步骤 6 对预期值
- 想整体退回 Cloudflare：`worker/` 还在，`wrangler secret put` 两个 URL + `wrangler deploy` 即可
