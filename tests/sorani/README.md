# Sorani 验证记录

验证日期：2026-10-04。环境：Windows 11 / Animeko 6.2.0。

当前状态 **Experimental**。用户负责完整应用内验收；本次没有自动操作 Ani 播放器。只读检查确认用户已添加开发订阅、刷新出 1 个源，Sorani 实例已启用。

用户后续已反馈 Sorani 可以在应用内观看，同时截图显示线路按钮为空。更新后的线路名、声音、拖动和换集仍待逐项验收。

## 已执行的验证

这组测试在建立仓库前执行。最初启用自动匹配检查分集过滤，随后曾为手动查找关闭 `autoMatch.enabled`。但进一步检查确认：6.2.0 缺少新分支的独立手动查找界面，关闭开关会让 `SelectorMediaSource.fetch` 返回空结果，选源列表会隐藏查询成功但零结果的源。现已恢复 `autoMatch.enabled=true` 以兼容 6.2.0，保持 Tier 3，不提升发布状态。

- 读取 Animeko v6.2.0 的 Selector、订阅、配置编解码代码，核对最新分支相关 schema。使用安装包实际 `MediaSourceCodecManager` 解码单源、剪贴板及订阅包装。
- `SelectorMediaSourceEngine` 处理真实搜索响应，验证 JSONPath 数字 id 与带尾斜杠的 rawBaseUrl 拼接。
- 实际引擎解析服务器原始 HTML，列出画完 12 集、药屋第一季 24 集；所有 EpisodeSort 正确。曾启用自动匹配的分集过滤对第 1、2 集各返回唯一正确链接。
- 安装包 `CefVideoExtractor` / 原生 JCEF 库在隔离进程中捕获四个播放页的签名 m3u8；使用外部现有 JBR 启动，未复用用户配置和缓存。
- 随 Ani 分发的 FFmpeg 对四集各解码 3 秒音视频，并对画完第 1 集另做 600 秒跳转后解码。五项退出码均为 0；H.264 1920×1080 / AAC 双声道。
- Chrome 上画完第 1 集可播放、拖动后进度推进，下一集可播放。本次未听验扬声器输出，短时音频解码也不能替代听验。

脱敏观察摘要见 [observations.json](observations.json)。没有提交站点整页 HTML、视频、解密密钥、动态播放 token、用户配置或账户信息。

## 搜索与作品识别

| 查询 | 结果 |
| --- | --- |
| 画完这个再去死 | id 4666，12 集 |
| これ描いて死ね | 0 条 |
| 药屋少女的呢喃 | 第一季 4250；第二季 68；第三季 4735 |
| 学生会也有洞！ | 0 条 |
| 学生会也有洞 | 0 条 |
| 生徒会にも穴はある | 0 条 |
| 与你相恋到生命尽头 | id 4645，12 集；实际引擎对第 1、12 集各返回唯一正确链接 |
| 与你相恋 | 返回 4 个条目，包含 4645，也包含其他作品；不建议替代完整名称 |
| 君が死ぬまで恋をしたい | 0 条 |
| 与你相恋直到生命尽头 | 0 条 |

API 存在 `alias` 字段。画完的别名包含“描绘直至生命尽头”“畫完這個再去死”“Kore Kaite Shine”等；没有逐个验证别名搜索。已测试中文名称可命中两部作品，但未在 Ani 的 Bangumi 查询流程中验收，不能保证全部 Bangumi 名称都能命中。

药屋有多个季，手动选择时核对条目。自动匹配的短标题排序曾将第一季 4250 排在前面；6.2.0 的作品名过滤器是空实现，不应据此保证跨季选择正确。

## DOM 与播放机制

1. 搜索 API `data.records` 中读取 `title` / `id`。
2. `rawBaseUrl=https://www.sorani.net/anime/mal/` 加数字 id，经实际 Kotlin 引擎验证得到正确条目 URL。
3. 条目原始 HTML 已包含 `.episode-thumb-grid` 下的全部锚点，文字“第01集”，href `/anime/mal/4666/episode/01`，列集无需 JS。
4. 播放页原始 HTML 没有可用的真实 m3u8，`playUrl` 最初为 null。JS 调用 `/api/video/episode/{episodeId}/play?lineCode=anime_jp_m3u8` 后请求签名 HLS。
5. 实际 CDN `www.sorani-vids.xyz`，播放器为 blob / MediaSource，没有观察到 iframe。HLS 使用 AES-128 密钥和 TS 分片，带 Referer 的解码成功。

正则捕获完整 m3u8/mp4 URL 与查询。观测中 `timestamp` / `key` 动态变化，准确到期时间未知，不把测试 URL 写死在配置中。

## Headers 与故障层

| 现象 | 层 | 处理 / 边界 |
| --- | --- | --- |
| 把初始 episode 页面匹配为 nested 后超时 | WebView 初始请求拦截 | `enableNestedUrl=true`，nested 正则改 `$^`，四页捕获通过 |
| 第 2 集在默认 8 秒窗口内超时 | WebView 资源加载 / 超时设置 | 已有 30 秒选项下四页通过；配置不能控制此全局设置 |
| 无 Referer 的 m3u8 返回 403 | Header 防盗链 | 增加 `Referer: https://www.sorani.net/` 后 200、解码通过 |
| 学生会的多个查询均无记录 | Sorani 搜索 API | 无可用条目，后续未测试；没有据此判定播放失败 |
| 订阅有 1 个源且实例启用，但选源列表没有 Sorani | 6.2.0 的检索开关 / 空结果隐藏 | 恢复 `autoMatch.enabled=true`；6.2.0 没有独立手动浏览 UI |
| 开关已更新但当前播放查询仍为 0 条，没有新的目标作品 API 请求 | 6.2.0 检索会话的数据源快照 | 完整退出 Ani 并重开，创建使用最新配置的新会话 |
| Sorani 能播放，但线路按钮没有文字 | `no-channel` 产生空的 `MediaProperties.alliance` | 改用 `index-grouped` 提取“青空次元”线路名；更新订阅、重开后，必要时在详细模式顶部手动刷新查询 |

### 运行中更新订阅的边界

6.2.0 的 [`MediaSourceManager.newSession`](https://github.com/open-ani/animeko/blob/v6.2.0/app/shared/app-data/src/commonMain/kotlin/domain/media/fetch/MediaSourceManager.kt) 明确固定使用当前 MediaFetcher 快照；源列表变更不重建相同播放查询。刷新订阅后，正在播放的旧会话仍可能使用之前关闭自动检索的 Sorani 实例。完整退出 Ani 并重开，再进入作品可确保创建新会话。没有为解决此问题修改配置数据库或清空缓存。

“与你相恋到生命尽头”的新鲜 API 响应与 SSR HTML，已由本机安装包的实际 Selector 引擎验证：数字 id 拼接到 `/anime/mal/4645`，列出全部 12 集，EpisodeSort 1–12 正确，第 1、12 集过滤后分别只留下 `/episode/01`、`/episode/12`。这项验证没有操作正在运行的播放器，也没有验证该作品的 m3u8 或声音。

配置中的 UA 已通过请求测试；普通 curl UA 加 Referer 同样成功。Cookie 为空，本次无需登录或其他额外 headers。没有发现 JSONPath、URL 拼接、SSR 列集、集号解析或签名捕获方面的 schema 阻断。

### 线路按钮名称

`no-channel` 的解析结果中 `WebSearchEpisodeInfo.channel` 为 null，引擎将 `MediaProperties.alliance` 设为空字符串。6.2.0 的选源列表按此字段分组，按钮直接显示该字符串，因此能选中并播放，却没有文字。

当前配置改用 `index-grouped`，通过页面 `title` 的 `(?<ch>青空次元)` 提取站点名称，将 `.episode-scroll-panel--detail` 内的集数归为一条线路。实际 schema 的配置字段为 `selectorChannelFormatFlattened`，不是类名对应的 `selectorChannelFormatIndexGrouped`。站点名称不用于标注字幕组。

使用本机安装包的配置编解码器和 Selector 引擎对比修改前后结果：与你相恋到生命尽头 4645（12 集）、画完这个再去死 4666（12 集）、药屋第一季 4250（24 集）均产生唯一“青空次元”频道；全部 48 集的链接与集号不变。三部作品的第 1、12 集分别筛出唯一资源，供 UI 显示的 `alliance` 均为“青空次元”。视频捕获规则和 headers 未修改。

默认资源标识包含频道名，因此新结果的媒体 ID 中频道部分由 `null` 变为“青空次元”，其他部分不变；数据源实例和订阅名称不变。旧列集缓存仍可能带空频道名。刷新订阅后完整退出并重开，再通过详细模式查询区域顶部的刷新按钮手动重新查询，可清除当前作品的缓存。没有直接修改应用数据库或全局缓存设置。

## 用户手动验收

从 [开发订阅](https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/dev.json) 添加或刷新订阅，保留已有 css1、bt1 等订阅。刷新后确认 Sorani 为 Tier 3、自动匹配开启，以参与 6.2.0 的选源列表检索。

建议使用已有设置把视频链接解析超时改为 30 秒；该项位于资源偏好 / 高级设置，6.2.0 在偏好在线资源时显示。

- [ ] 订阅刷新成功，显示 Sorani 青空次元。
- [ ] 打开“画完这个再去死”的第 1 集，在“选择数据源”列表找到 Sorani 线路。
- [ ] 选择 Sorani，确认对应 id 4666 / 第 1 集，观察画面并听验声音。
- [ ] 拖动到中途，确认恢复播放及音画同步。
- [ ] 切到第 2 集，确认仍走 Sorani 的同一条线路。
- [ ] 打开“药屋少女的呢喃”第一季，确认 Sorani 匹配第一季 4250，而非其他季。
- [ ] 药屋第 1 集、拖动、第 2 集和声音验收通过。
- [ ] 核对所需的字幕组 / 翻译版本；本次未核对每部作品的字幕组。
- [ ] 测试不同季及 Bangumi 名称的匹配，不提前提高优先级；对零结果作品，选源列表不显示 Sorani 属于 UI 行为。

6.2.0 的源码依据：[`SelectorMediaSource.fetch`](https://github.com/open-ani/animeko/blob/v6.2.0/app/shared/app-data/src/commonMain/kotlin/domain/mediasource/web/SelectorMediaSource.kt) 的开关判断，以及 [`MediaSelectorState.createWebSourceFlow`](https://github.com/open-ani/animeko/blob/v6.2.0/app/shared/ui-mediaselect/src/commonMain/kotlin/ui/mediafetch/MediaSelectorState.kt) 的空结果隐藏规则。

记录 App 版本、日期、作品/季/集数、错误层和必要的脱敏日志后，再决定是否将 catalog 状态改为 Stable。CI 只做离线配置与构建检查，不代表站点实时播放通过。
