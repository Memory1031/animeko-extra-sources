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
| [Sorani 青空次元](sources/web/sorani.json) | Experimental，Tier 3 | API + Web |

## Sorani 使用

Animeko **6.2.0** 的播放器选源列表通过自动检索获得线路，本源需设置 `autoMatch.enabled=true` 才能参与检索。此前关闭该开关会让 Selector 直接返回空结果，UI 随后隐藏该源。6.2.0 没有新分支的独立“手动查找”界面，不能按该新界面使用浏览 API。

添加并刷新开发订阅后，重新打开剧集的“选择数据源”面板；有匹配结果时可点击 Sorani 的线路。先用“画完这个再去死”验证第 1 集、拖动进度和下一集。截图里的“编辑查询请求”只是修改检索名称和集号，不能开启独立手动浏览。检索成功但零结果的源会被列表隐藏，因此某部作品没有显示 Sorani 不一定代表订阅失败。

**运行中更新订阅后仍为 0 条：完整退出并重新启动 Ani，再进入剧集。** 6.2.0 的检索会话固定使用创建时的数据源快照；刷新订阅不会重建正在使用的同一播放查询。尤其从 `autoMatch.enabled=false` 更新到 `true` 时，旧会话可能继续返回空结果。只关闭选源面板不足以保证创建新会话。

**能播放但线路按钮没有文字：刷新开发订阅，完整退出并重开 Ani。** 当前配置已将单条线路命名为“青空次元”。若仍显示空白，在“选择数据源”切到“详细模式”，点击数据源查询区域顶部的刷新按钮，清除当前作品的旧列集缓存并重新查询，再切回简单模式。仅重启不会清除未过期的列集缓存。

本源保持 Tier 3 和 Experimental，不提高优先级。用户已反馈 Sorani 在应用内可观看；声音、拖动、换集和跨季匹配仍待逐项手动验收。

建议在资源偏好 → 高级设置中将“视频链接解析超时”设置为 **30 秒**。6.2.0 仅在偏好在线资源时显示该相关设置。此前默认 8 秒的组件测试曾在加载第 2 集时超时，30 秒测试通过。本仓库不会替用户修改全局设置。

默认标注 1080P / CHS，优先级为 Tier 3。这不保证每个条目都具备对应质量或同一个字幕组，选择条目时请核对站点资源。Sorani 的来源不等于所有作品都使用“喵萌奶茶屋”字幕，本次没有逐条核对字幕组。

2026-10-04，Windows / Animeko 6.2.0 验证记录：

| 检查 | 结果 |
| --- | --- |
| 搜索 API、中文名和数字 id | 成功：画完这个再去死 4666；药屋少女的呢喃第一季 4250 |
| Animeko JSONPath / URL 拼接组件 | 成功：数字 id → `https://www.sorani.net/anime/mal/{id}` |
| 原始详情 HTML / 集号解析 | 成功：上述作品全部 12 / 24 集，SSR 链接，EpisodeSort 正确 |
| 与你相恋到生命尽头 | API 命中 id 4645；实际引擎解析全部 12 集，第 1 / 12 集各筛出唯一正确链接；应用内仍待验收 |
| WebView / m3u8 捕获组件 | 成功：安装包 CefVideoExtractor 捕获两部作品第 1、2 集 |
| 音视频解码 / 中途跳转 | 成功：随 Ani 分发的 FFmpeg 短时解码，画完第 1 集另验 600 秒跳转 |
| Chrome 网页第 1 集、拖动、下一集 | 成功：画完第 1、2 集，1080P |
| 学生会也有洞！ | 搜索 API 返回 0 条，包括去标点中文及日文查询；后续未测 |
| 正在运行的 Ani 内选源、播放 | 用户反馈可观看；声音、拖动和换集仍待逐项验收 |
| 线路按钮文字 | 安装包实际引擎验证三部作品均生成“青空次元”；更新后的 UI 仍待用户验收 |
| 应用内自动匹配 | 为兼容 6.2.0 选源列表而开启；分集引擎测试通过，完整应用未验收 |

组件测试在隔离进程中使用本机安装包，不能替代完整应用验证。[详细测试说明](tests/sorani/README.md)包含已知边界和手动验收表。

### 播放规则与排障

- 搜索读取 API 的 `$.data.records[*].title` / `.id`；详情页用 `.episode-thumb-grid > a[href^='/anime/mal/'][href*='/episode/']` 列集，无需详情 API 扩展。
- 用 `index-grouped` 将 `.episode-scroll-panel--detail` 中的集数归为单条线路，从页面 `title` 提取“青空次元”。6.2.0 对应配置字段仍叫 `selectorChannelFormatFlattened`。此前 `no-channel` 生成空频道名，选源按钮直接显示该字段而成为空白；此名称表示站点线路，不代表字幕组。
- 播放页执行 JS 后获取动态签名 HLS，实际观测 CDN 为 `www.sorani-vids.xyz`。原始 HTML 的 `playUrl` 为空，不能将 episode 页面或播放器的 blob URL 当作视频。
- `enableNestedUrl=true`，`matchNestedUrl="$^"`。观测流程无 iframe；初始播放页已经由 WebView 加载，再把它匹配为 nested 页面会在实际 CEF 测试中拦截初始请求而超时。`$^` 保留开关并避免该重复匹配。
- HLS 需要 `Referer: https://www.sorani.net/`，无 Referer 测试返回 403。配置带已测试成功的浏览器样式 User-Agent；默认 curl UA 加 Referer 也成功，未证明特定 UA 必需。本次无需 Cookie 或登录。
- 签名查询包含动态 `timestamp` / `key`，两次解析的值不同，确切有效期未知。配置捕获完整 URL，不固定或提交实际 token。
- 多季条目请核对。6.2.0 的作品名过滤器仍为空实现，`filterBySubjectName=true` 不能保证严格作品名过滤；本版为兼容选源列表开启自动检索，这项限制仍然存在。

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
