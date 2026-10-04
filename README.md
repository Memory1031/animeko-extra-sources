# Animeko Extra Sources

Animeko 的非官方第三方数据源仓库，提供可直接添加的在线资源订阅。本仓库不托管视频文件。

## 数据源

| 数据源 | 状态 | 优先级 |
| --- | --- | --- |
| Sorani 青空次元 | Stable | T0 |

## 订阅地址

稳定订阅：

```text
https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/web.json
```

全量订阅（保留已有的 `dev.json` 地址）：

```text
https://raw.githubusercontent.com/Memory1031/animeko-extra-sources/main/subscriptions/dev.json
```

两个地址目前都包含 Sorani，选择一个即可。已经订阅 `dev.json` 的用户直接刷新原订阅，无需重复添加。

## 添加订阅

1. 打开 Animeko → 设置 → 数据源管理 → 订阅。
2. 添加订阅，粘贴上面的一个地址并刷新。
3. 确认列表中出现 **Sorani 青空次元**。
4. 更新已有订阅后，完整退出并重开 Animeko，让正在使用的配置生效。

保留原有订阅即可。请添加聚合订阅地址，单个 `sources/web/*.json` 文件不是订阅格式。

## 使用

打开作品的剧集，在“选择数据源”中选择 **Sorani 青空次元 → 青空次元** 线路。没有匹配结果时，可以通过“修改查询”调整搜索名称和集号；可用作品和字幕版本以站点实际资源为准。

遇到视频链接解析超时，可在资源偏好 → 高级设置中将“视频链接解析超时”调整为 30 秒。

## 维护

- `sources/web/`：单个数据源配置。
- `sources/catalog.json`：订阅发布分类。
- `subscriptions/`：脚本生成的订阅文件。
- `tests/sorani/`：验证记录与已知问题。

需要 Node.js 24，无 npm 依赖：

```sh
node scripts/validate.mjs
node scripts/build-subscriptions.mjs
node --test
node scripts/build-subscriptions.mjs --check
```

修改源配置后运行构建脚本，提交生成的订阅文件。请勿手工维护聚合 JSON。CI 检查配置、脚本测试和生成结果是否同步。

## 参考与许可

配置格式参考 Animeko 和 animeko-subs；Sorani 行为参考 KazumiRules 和 EasyBangumi 的规则。实现经过实际接口、页面和播放器组件检查，没有整段复制参考项目代码。

```text
Animeko
https://github.com/open-ani/animeko

animeko-subs
https://github.com/creamycake-anime/animeko-subs

KazumiRules / Sorani
https://github.com/Predidit/KazumiRules/blob/main/sorani.json

EasyBangumi / Sorani
https://github.com/easybangumiorg/CommunityJsExtensionEasyBangumi/blob/main/extensions/kazumi-sorani.js
```

本仓库原创配置、脚本及说明采用 MIT 许可证。参考项目和第三方站点保留各自权利。
