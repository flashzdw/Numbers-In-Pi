# Numbers-In-Pi 网站广告变现调研报告(2025–2026 核实版)

> 场景:个人开发者、静态站 + serverless(Vercel)、无 ICP 备案、受众以中国大陆为主、当前流量低、期望病毒式传播。

## 结论先行

1. **国内广告联盟对本项目基本全线不可行**:百度联盟必须有 ICP 备案(且近年倾向企业/个体户资质);腾讯优量汇只支持 App/小程序/小游戏,不支持网页;搜狗联盟 2022 年底已关停;360 联盟(奇聚 SSP)名存实亡。
2. **现实主路径是 Google AdSense**:不要备案、个人可申请、Vercel 静态站没问题、中国大陆个人可通过银行电汇(招商银行最顺)收款。但两点要清醒:① 单页工具站最容易因"低价值内容(Low value content)"被拒,申请前必须补内容页;② 国内流量广告单价很低(中文站 RPM 约为英文站的 1/4)。
3. **流量起来后(尤其有了海外流量)再叠加 Monetag / Adsterra / Ezoic**;国内 CPS(淘宝/京东联盟)走社交渠道不要备案,可做"定制 π 周边"类补充;打赏走爱发电(6% 费用,微信/支付宝)。
4. **收入预期放低**:纯国内娱乐流量,1 万 PV/月 ≈ ¥36–145;10 万 PV/月 ≈ ¥360–1,450;100 万 PV/月 ≈ ¥3,600–14,500。海外流量占比高时上限可放大 3–5 倍。这类站点真正的钱往往在传播高峰期的"赞助位/冠名",而不是展示广告。

---

## 1. Google AdSense(首选)

### 申请资格(2025 年要求汇总)
- 年满 18 岁、拥有自己的网站;使用**自定义顶级域名**(免费子域名基本不批)、HTTPS、移动端自适应、加载速度正常。
- **原创内容**:官方没有硬性流量门槛,但普遍经验是申请前最好有一定内容积累;必备页面:隐私政策(强制)、关于、联系方式。
- 审批周期约 7–14 天;常见拒绝理由:内容不足/低价值内容、政策违规、无 SSL、免费主机、流量不足等。
- 来源:[AdSense Eligibility Requirements 2025](https://cc-consultings.com/2025/03/how-to-use-google-adsense-to-monetize-your-website/)、[AdSense Tutorial 2025(拒绝原因清单)](https://www.classcentral.com/course/youtube-adsense-tutorial-2025-requirements-approval-time-ads-txt-rejection-fix-471168)

### 工具站最大的坑:"Low value content" 拒批
单页工具站(输入数字→出结果)是"低价值内容"拒批的高发类型——公开说明太少的工具站被明确点名。对策:把"π 的小知识、生日数字概率解释、FAQ、玩法说明、更新日志"做成 3–5 个真实内容页,配上关于/隐私/联系页,再申请。
- 来源:[AdSense Low Value Content Checker(点明 tool websites)](https://yerman.uk/adsense-low-value-checker/)、[How to Fix Low Value Content (2026)](https://adstimate.com/blog/low-value-content-fix.html)

### 中国大陆个人收款(已验证可行)
- **满 $100 才付款**;中途需完成 PIN 码邮寄地址验证(平邮到国内,约 2–4 周)+ 身份验证。来源:[掘金:中国地区 AdSense 收款渠道汇总](https://juejin.cn/post/7648962412772179983)
- 西联汇款 2020 年 8 月起已停止。来源:[AdSense 停止西联汇款](https://mianao.info/f69bcf83/)
- 现在主流是**银行电汇(SWIFT)到国内个人银行卡的美元账户**:招商银行口碑最好(无额外手续费、App 内直接结汇,银行名填 `China Merchants Bank`,SWIFT 填 `CMBCCNBS`);注意国内个人年度结汇便利化额度 5 万美元。来源:[AdSense 电汇收款指南(推荐招行)](https://techlaowang.com/google-adsense-youtube/)、[知乎:AdSense 招行电汇实操](https://zhuanlan.zhihu.com/p/128958840)
- 备选:PayPal Hyperwallet、第三方跨境收款(珊瑚、PingPongX)。来源:同上掘金文

### 大陆访客能看到广告吗?
- 目前 AdSense 广告在国内**基本能正常展示**(主广告 JS 大体可访问),实测多数挂 AdSense 的站国内显示正常;但 `fundingchoicesmessages.google.com`(隐私与同意消息组件)被墙,若误开 GDPR 同意消息可能导致异常。来源:[2023 谷歌广告国内显示问题排查](https://www.stubbornhuang.com/2840/)
- 广告代码里会有一些"被墙的请求",拖慢加载,建议异步加载、全站只引入一次 adsbygoogle.js。来源:[WordPress 优化 Google 广告加载速度](https://www.lowion.cn/2023/01/WordPress%E4%BC%98%E5%8C%96Google%E5%B9%BF%E5%91%8A%E5%8A%A0%E8%BD%BD%E9%80%9F%E5%BA%A6)
- **单价现实**:中文流量 CPC/RPM 远低于英文——有 7 年从业者对比:中文站 RPM ≈ $3,英文站 ≈ $12。来源:[中文站 vs 英文站 RPM 对比](http://mp.weixin.qq.com/s?__biz=MzkwMjY5MzM1OA==&mid=2247484867&idx=1&sn=a8e93f0e20f6a01ad1442946b4248fb6);另一案例:日 1000 IP 的技术站日入 $1–3。来源:[AdSense 赚钱分析](https://m.chwang.com/ask/187257265923)

---

## 2. 国内广告联盟:逐项核实

| 平台 | 核实结果 |
|---|---|
| **百度联盟** | **必须有 ICP 备案**才能合作;个人名义历史上可注册+实名认证,但 2024 年后的多份接入指南称注册需企业/个体户资质(审核收紧)。Vercel 站点无法备案 → 不可行。来源:[免备案联盟说明(点明百度联盟必须备案)](https://host.xinletian.cn/beian/14261.html)、[钛媒体:个人网站加入百度联盟](https://www.tmtpost.com/52467.html)、[百度营销:实名认证](https://yingxiao.baidu.com/new/mobile/help/details?id=17481&ly=help_type_m)、[知乎:广告联盟开通条件(2024)](https://zhuanlan.zhihu.com/p/683861876) |
| **腾讯优量汇** | 腾讯旗下**移动**广告联盟:只支持 Android/iOS App、小程序、小游戏,**不支持网页流量**;且要求有正式上架的 App(测试流量不结算)。本项目纯网页 → 不可行。来源:[CSDN:优量汇/穿山甲门槛=正式上架 App](https://blog.csdn.net/weixin_40388758/article/details/149250573)、[芒果联盟:优量汇接入流程(个人需身份证)](https://www.mangolm.com/news/0_64630.html) |
| **搜狗联盟** | **已关停**:网盟产品 2022-12-31 停服,2023 年 2 月关闭网站。来源:[界面新闻](https://www.jiemian.com/article/8495779.html) |
| **360 联盟(奇聚 SSP)** | 官网(ssp.360.cn)仍在,但新闻动态停在 2024 年初,站长圈存在感已很低;网站类合作同样需要备案 → 不推荐。来源:[360 奇聚平台官网](https://ssp.360.cn/) |
| **淘宝联盟 / 京东联盟(CPS)** | **个人可以注册**(淘宝/京东账号即可);但"网站"类媒体推广位**需要 ICP 备案**(京东明确"个人网站和 APP 推广必须进行网站 ICP 备案");走**社交媒体渠道备案**(微博、微信、小红书等)则不需要网站备案。阿里妈妈 CPC 点击广告需备案,CPS 提成相对宽松。→ 可用"社交渠道 CPS"做周边带货补充。来源:[京东联盟开通条件](https://facaimike.com/jingdong.html/)、[西部数码:淘宝联盟网站推广必须备案](https://www.west.cn/docs/65986.html)、[免备案联盟说明](https://host.xinletian.cn/beian/14261.html) |

---

## 3. 国际广告联盟(免备案,个人可入)

| 平台 | 流量门槛 | 起付金额 / 支付方式 | 点评 |
|---|---|---|---|
| **Ezoic** | 无硬性门槛(官方取消最低流量要求),实务建议 ≥1 万 PV/月 | 低门槛(约 $20 起),Payoneer/PayPal/电汇 | AI 优化广告位,收益通常高于纯 AdSense;接入稍复杂(JS 集成)。适合 AdSense 稳定后升级。来源:[Monetag 对比文](https://monetag.com/blog/adsense-alternatives/)、[BeingOptimist](https://www.beingoptimist.com/ezoic-vs-adsense/) |
| **Media.net** | 无硬性数字,但质量审核严、**偏爱美/英/加流量** | $100,Net-30,Payoneer/电汇 | Yahoo/Bing  contextual 广告。本站以国内流量为主 → **不适合**。来源:[Post Affiliate Pro](https://www.postaffiliatepro.com/faq/alternative-ad-networks/)、[HiveHQ](https://www.hivehq.ai/blog/affiliate-programs-that-pay-per-click) |
| **Monetag**(PropellerAds 发行商侧品牌) | **无门槛,即时过审** | **$5 起付,每周四付款**;PayPal/Payoneer/Skrill/Webmoney;电汇需 $500 | 填充率近 100%,支持网站/社交流量;以 pop-under、push、in-page push 为主,**侵入性强**,与 AdSense 混用时避免 popunder/interstitial 以免危及 AdSense 账号。来源:[Monetag Review](https://vashishthakapoor.com/monetag-review/)、[Monetag 官方帮助:支付方式](https://help.monetag.com/en/articles/6745951-payment-methods-available-in-monetag)、[与 AdSense 共存注意事项](https://wpseohosts.com/monetag-review/) |
| **Adsterra** | 无门槛,新站可入 | **$5 起付**(Paxum/Webmoney),PayPal $100;每两周付款 | 老牌网盟(2013 年起),横幅/原生/Social Bar 都有,也有 popunder;审核比 AdSense 宽松得多。来源:[Publisher Growth 2026](http://www.publishergrowth.com/blog-details/9-best-ad-networks-for-publishers-with-weekly-payouts-in-2026)、[Logikfabrik 对比表(支付方式)](https://www.logikfabrik.com/kl/view/af88c727-cbaa-4ad3-994e-3047165ba591/) |
| **HilltopAds** | **无最低流量要求** | $20–50 起付(按方式),每周 NET-7;PayPal/USDT/BTC/Wise/Paxum/电汇 | 有反广告拦截技术;口碑尚可,pop/push 为主。来源:[State of Digital Publishing](https://www.stateofdigitalpublishing.com/digital-platform-tools/hilltopads-review/)、[AFFBun](https://affbun.com/network/hilltopads) |
| **PropellerAds**(广告主侧品牌) | 无门槛 | 同上(Monetag 体系),每周付款 | CPM 参考(2025):美国 push $2–7 / pop $3–10;印度/巴西 push $0.2–1.5 / pop $0.5–2;中国流量大致按二三梯队估。来源:[PropellerAds Review 2025(CPM 表)](https://www.seoaffiliatedomination.com/blog/propellerads)、[BforBloggers 对比](https://bforbloggers.com/propellerads-vs-hilltopads/) |

**收款提示**:这类联盟对国内个人最顺的收款组合是 **Payoneer**(PropellerAds 官方与 Payoneer 有合作,每周自动打款)或 PayPal;大额再考虑电汇。来源:[Payoneer 官方博客:PropellerAds 收款](https://blog.payoneer.com/propellerads/)

---

## 4. 小众 / 垂直渠道

| 渠道 | 要求 | 对本项目的意义 |
|---|---|---|
| **Carbon Ads**(BuySellAds 旗下) | 邀请制/人工审核,全网约 900 个开发者/设计师站点;分成 60%;$20 起付(PayPal) | 受众是开发者/设计师,与本站娱乐受众不符 → 仅了解。来源:[Ghost Ads 2026](https://blog.ghostads.io/blog/best-adsense-alternatives-2026/) |
| **EthicalAds**(Read the Docs 运营) | **开发者向站点、5 万+ PV/月**;$2–2.5 CPM(欧美);$50 起付 Net-30 | 同样受众不符,且门槛高于本站现状。来源:[EthicalAds 官方发行商页](https://www.ethicalads.io/publishers/) |
| **BuySellAds**(自助广告市场) | 建议 ~10 万 PV/月以上;$20 起付(PayPal) | 流量做大、有了英文受众后可挂直销位。来源:[Automatad](https://headerbidding.co/cpm-ad-networks-for-publishers/) |
| **爱发电 afdian**(打赏) | 个人即可入驻;微信/支付宝付款;平台收 6%(1% 支付手续费 + 5% 服务费),次月 1 日结算 | **本站最合适的中国打赏渠道**;尤雨溪等独立开发者都在用。零门槛,建议上线就挂。来源:[百度百科:爱发电](https://baike.baidu.com/item/%E7%88%B1%E5%8F%91%E7%94%B5/23812651)、[爱发电 FAQ(94% 分成)](https://www.hongjing3.com/app/136047.html) |
| Buy Me a Coffee / Ko-fi | 依赖 PayPal/Stripe 收款 | 国内个人收款不便(经验性判断,未单列来源),海外用户多了再考虑 |
| **海报水印赞助位 / 冠名** | 自助 | 病毒传播期海报是天然的"移动广告牌",可招按天/按场次的冠名赞助(例如品牌 Logo+一句话),单价可远超展示广告 |
| **定制周边 CPS**(π 项链、生日数字海报打印等) | 淘宝/京东联盟社交渠道 CPS(免备案) | 与"生日数字在 π 中的位置"场景天然契合,转化预期比横幅广告好 |

---

## 5. 收入预期测算(展示广告,人民币按 1 美元≈7.2 元粗算)

假设:单页 2–3 个广告位;国内为主流量 AdSense **Page RPM $0.5–2**(依据:中文内容站 RPM 约 $3、英文约 $12,工具站停留时间短取下沿;AdSense 整体 RPM 常见 $1–5)。海外/英文为主时 **RPM $2–8**。

| 月 PV | 国内流量为主(AdSense) | 海外流量占比较高 |
|---|---|---|
| 1 万 | $5–20 ≈ **¥36–145/月** | $20–80 ≈ ¥145–580 |
| 10 万 | $50–200 ≈ **¥360–1,450/月** | $200–800 ≈ ¥1,450–5,800 |
| 100 万 | $500–2,000 ≈ **¥3,600–14,500/月** | $2,000–8,000 ≈ ¥14,500–58,000 |

- 参考案例:日 1000 IP 中文技术站月入 $30–90;500–1000 访问/日的个人博客月入 $30–150。来源:[AdSense 赚钱分析](https://m.chwang.com/ask/187257265923)、[adcalcs 流量收入分析 2026](https://adcalcs.com/blog/how-much-website-traffic-to-make-money.html)
- 叠加 Monetag/Adsterra 的 pop/push 类格式可再增 20–50%,但明显伤体验、且可能危及 AdSense 账号,慎用。
- **重要提醒**:病毒工具站的收入高度集中在传播爆发的那几天,长尾流量很小;年化收入 ≠ 峰值月收入 × 12。

---

## 6. 推荐路径(分阶段)

**阶段 0(现在,上线即做)**
1. 补 3–5 个内容页(π 知识、概率解释、FAQ)+ 隐私政策/关于/联系页 → 申请 **Google AdSense**。
2. 挂**爱发电**打赏入口(海报页"请我喝咖啡")。
3. `ads.txt` 放站点根目录(Vercel `public/`)。

**阶段 1(1–10 万 PV/月,出现稳定海外流量后)**
4. AdSense 稳定收款后,试 **Ezoic**(JS 集成,AI 优化)或叠加 **Adsterra / Monetag** 的**非侵入格式**(原生横幅、in-page push);暂不上 popunder。
5. 淘宝联盟/京东联盟**社交渠道 CPS**(免备案)挂"定制 π 周边"链接。

**阶段 2(10 万+ PV/月 或 单次大爆款)**
6. 开**海报冠名/赞助位**(传播期按天卖);流量够大后评估 BuySellAds 直销;若做英文版且月会话到数万级,再看 Mediavine/Raptive 这类高端联盟(门槛通常数万–20 万月浏览量级)。
7. 若未来一定要吃国内联盟预算(百度联盟等),则需要**国内服务器 + ICP 备案**,与现有 Vercel 架构冲突,届时单独评估。

---

## 7. 实操建议(单页工具站)

**广告位布局**
- 全站 2–3 个广告单元足矣:输入/结果区**下方**一个自适应横幅、海报生成结果页底部一个、可选顶部小横幅。
- 广告与"生成海报"按钮保持距离,避免误点(无效点击是封号重灾区);不要做成按钮样式误导点击。
- 可直接开 AdSense **Auto Ads** 让 Google 自动选位,省心;全站只引入一次 `adsbygoogle.js`。

**AdSense 申请常见被拒原因(逐条规避)**
1. "低价值内容"——单页工具无文字内容 → 先补内容页(最重要)。
2. 缺隐私政策/关于/联系页。
3. 免费子域名/免费托管印象差 → 用自己的顶级域名 + HTTPS。
4. 网站"建设中"、死链、导航混乱。
5. 抄袭/采集内容。
6. 被拒后改进再等约一个月重申,别频繁秒重申。

**合规红线**
- 绝不点自己的广告,也不让朋友"帮忙点";不写"点广告支持我们"这类诱导文案。
- 病毒传播期如果买量/刷量,极易触发无效流量限制甚至封号——让流量自然来。
- 国内访客场景下谨慎开启 AdSense 的 GDPR 同意消息组件(`fundingchoicesmessages.google.com` 被墙,可能引发异常)。
