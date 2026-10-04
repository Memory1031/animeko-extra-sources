# Animeko Extra Sources

Unofficial additional media sources for Animeko.

这是独立维护的 Animeko 第三方数据源仓库，非 Animeko 官方项目。不托管任何视频文件；配置通过第三方站点获取媒体信息，可能随站点变动失效。

## 订阅

- [稳定订阅 web.json](https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/web.json)：仅包含明确标记为 Stable 的源，当前为空。
- [开发订阅 dev.json](https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/dev.json)：包含 Stable 和 Experimental 的源，当前包含 Sorani。

Animeko 的设置 → 数据源管理 → 订阅中，点击添加并粘贴上述 URL，然后刷新订阅。保留已有的官方在线源、BT 源及其他订阅，只新增本仓库订阅。请订阅聚合文件，单个 `sources/web/*.json` 不是订阅格式。

## 当前数据源

| Source | Status | Type |
| --- | --- | --- |
| [Sorani 青空次元](sources/web/sorani.json) | Experimental，Tier 3，手动查找 | API + Web |

## Sorani 使用

本版优先支持手动查找，`autoMatch.enabled=false`。添加开发订阅后，在 Animeko 的手动查找入口选择 Sorani → 搜索作品 → 选择正确条目和季 → 选择剧集。先验收第 1 集、拖动进度和下一集，再决定是否开启自动匹配或提高优先级。

建议在资源偏好 → 高级设置中将“视频链接解析超时”设置为 **30 秒**。6.2.0 仅在偏好在线资源时显示该相关设置。此前默认 8 秒的组件测试曾在加载第 2 集时超时，30 秒测试通过。本仓库不会替用户修改全局设置。

默认标注 1080P / CHS，优先级为 Tier 3。这不保证每个条目都具备对应质量或同一个字幕组，选择条目时请核对站点资源。Sorani 的来源不等于所有作品都使用“喵萌奶茶屋”字幕，本次没有逐条核对字幕组。

2026-10-04，Windows / Animeko 6.2.0 验证记录：

| 检查 | 结果 |
| --- | --- |
| 搜索 API、中文名和数字 id | 成功：画完这个再去死 4666；药屋少女的呢喃第一季 4250 |
| Animeko JSONPath / URL 拼接组件 | 成功：数字 id → `https://www.sorani.net/anime/mal/{id}` |
| 原始详情 HTML / 集号解析 | 成功：上述作品全部 12 / 24 集，SSR 链接，EpisodeSort 正确 |
| WebView / m3u8 捕获组件 | 成功：安装包 CefVideoExtractor 捕获两部作品第 1、2 集 |
| 音视频解码 / 中途跳转 | 成功：随 Ani 分发的 FFmpeg 短时解码，画完第 1 集另验 600 秒跳转 |
| Chrome 网页第 1 集、拖动、下一集 | 成功：画完第 1、2 集，1080P |
| 学生会也有洞！ | 搜索 API 返回 0 条，包括去标点中文及日文查询；后续未测 |
| 正在运行的 Ani 内手动搜索、选集、播放、换集和声音 | 待用户手动验收 |
| 应用内自动匹配 | 本版关闭；先前分集引擎测试通过，完整应用未验收 |

组件测试在隔离进程中使用本机安装包，不能替代完整应用验证。[详细测试说明](tests/sorani/README.md)包含已知边界和手动验收表。

### 播放规则与排障

- 搜索读取 API 的 `$.data.records[*].title` / `.id`；详情页用 `.episode-thumb-grid > a[href^='/anime/mal/'][href*='/episode/']` 列集，无需详情 API 扩展。
- 播放页执行 JS 后获取动态签名 HLS，实际观测 CDN 为 `www.sorani-vids.xyz`。原始 HTML 的 `playUrl` 为空，不能将 episode 页面或播放器的 blob URL 当作视频。
- `enableNestedUrl=true`，`matchNestedUrl="$^"`。观测流程无 iframe；初始播放页已经由 WebView 加载，再把它匹配为 nested 页面会在实际 CEF 测试中拦截初始请求而超时。`$^` 保留开关并避免该重复匹配。
- HLS 需要 `Referer: https://www.sorani.net/`，无 Referer 测试返回 403。配置带已测试成功的浏览器样式 User-Agent；默认 curl UA 加 Referer 也成功，未证明特定 UA 必需。本次无需 Cookie 或登录。
- 签名查询包含动态 `timestamp` / `key`，两次解析的值不同，确切有效期未知。配置捕获完整 URL，不固定或提交实际 token。
- 多季条目请手动核对。6.2.0 的作品名过滤器仍为空实现，`filterBySubjectName=true` 不能保证严格作品名过滤，因此本版关闭自动匹配。

上游 [增加 API 数据源支持 #3185](https://github.com/open-ani/animeko/issues/3185)仍为 Open。本源已通过搜索 API + SSR HTML + WebView 路径完成组件验证，不需要修改 Animeko 本体。

## 维护

需要 Node.js 24，无 npm 依赖。

```sh
node scripts/validate.mjs
node scripts/build-subscriptions.mjs
node --test
node scripts/build-subscriptions.mjs --check
```

单源配置独立维护在 `sources/web/**/*.json`，使用 Animeko `web-selector` v2 标准导出结构。在 `sources/catalog.json` 登记相对路径和 `experimental` / `stable` 状态；分类信息不会进入 Animeko 订阅。

新增源默认使用 Experimental。完成实际应用内的搜索、选条目、列集、播放、拖动、换集验证，并记录结果后，再考虑改为 Stable。Tier 是 Animeko 的资源优先级，与仓库发布状态独立；实验源优先使用 Tier 3。

`dev.json` 包含所有已登记的源，`web.json` 仅包含 Stable。构建按 Tier、路径固定排序；拒绝非法配置、重复名称、遗漏登记或不存在的文件。两个聚合 JSON 必须由脚本生成并提交，禁止手工维护。CI 检查源配置、脚本测试及产物是否同步，CI 不联网测试站点是否仍可播放。

## 格式与来源

订阅以 Animeko 的 [`SubscriptionUpdateData`](https://github.com/open-ani/animeko/blob/v6.2.0/app/shared/app-data/src/commonMain/kotlin/domain/mediasource/subscription/SubscriptionUpdateData.kt) 为依据：

```json
{"exportedMediaSourceDataList":{"mediaSources":[]}}
```

格式和构建行为参考 [Animeko](https://github.com/open-ani/animeko) 与 [animeko-subs](https://github.com/creamycake-anime/animeko-subs)。本仓库脚本独立实现，没有复制这些项目的源码。

Sorani 行为参考 [Predidit/KazumiRules 的 sorani.json](https://github.com/Predidit/KazumiRules/blob/main/sorani.json) 和 [EasyBangumi 的 kazumi-sorani.js](https://github.com/easybangumiorg/CommunityJsExtensionEasyBangumi/blob/main/extensions/kazumi-sorani.js)，并实际检查 API、SSR 页面及播放网络请求。没有整段复制其实现代码。

本仓库原创配置、脚本及说明使用 MIT 许可证；参考项目和第三方站点保留各自的权利。
