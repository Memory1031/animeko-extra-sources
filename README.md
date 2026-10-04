# Animeko Extra Sources

Unofficial additional media sources for Animeko.

这是独立维护的 Animeko 第三方数据源仓库，非 Animeko 官方项目。不托管任何视频文件；配置通过第三方站点获取媒体信息，可能随站点变动失效。

## 订阅

- [稳定订阅 web.json](https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/web.json)：仅包含明确标记为 Stable 的源，当前为空。
- [开发订阅 dev.json](https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/dev.json)：包含 Stable 和 Experimental 的源，当前为空。

Animeko 的设置 → 数据源管理 → 订阅中，点击添加并粘贴上述 URL，然后刷新订阅。保留已有的官方在线源、BT 源及其他订阅，只新增本仓库订阅。请订阅聚合文件，单个 `sources/web/*.json` 不是订阅格式。

## 当前数据源

| Source | Status | Type |
| --- | --- | --- |
| 暂无 | — | — |

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

本仓库原创配置、脚本及说明使用 MIT 许可证；参考项目和第三方站点保留各自的权利。
