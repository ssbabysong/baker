# App Store 截图

`screenshots/` 里是上架用的 iPhone 截图，6.9 英寸尺寸（1320×2868，JPEG，无透明通道），App Store Connect 里放进「iPhone 6.9 英寸显示屏」那一栏即可（6.5 英寸那栏可以留空，会自动缩放）。

- `zh-Hans/`：简体中文
- `en-US/`：英文

| # | 画面 | 中文标题 | English |
|---|---|---|---|
| 1 | 店铺首页 | 经营你的小面包店 | Run your own little bakery |
| 2 | 发酵计时 | 发酵、烘烤自动计时 | Proof & bake timers |
| 3 | 多炉同时烤 | 几炉一起烤也不乱 | Many batches, no mess |
| 4 | 配方架 | 配方都摆上架 | Your recipe shelf |
| 5 | 步骤 | 每一步清清楚楚 | Every step, crystal clear |
| 6 | 烘焙日历 | 每一炉都记进日历 | A diary for every bake |
| 7 | 升级路线 | 从小推车到旗舰店 | From cart to flagship |

## 详情页顶部图 & 搜索结果图

`creative/` 里是 App Store Connect「创意素材」两个位置的图（JPEG，无透明通道）：

| 文件 | 放在哪 | 尺寸 |
|---|---|---|
| `header.jpg` | 产品页顶部（Product page header，21:9） | 3840×1646 |
| `search.jpg` | 搜索结果（Search results，3:2） | 3840×2560 |

- 顶部图：一条小街，Lv.5 排队小店在正中间，店长站在门口，天上飘着面包和云。没有放文字，留给 App Store 叠上的 app 名字和按钮；招牌上的店名中英文各一版。
- 搜索图：一句话说清楚这是什么（烘焙配方 + 发酵计时），下面两部手机是发酵计时和配方架的真实画面。

上传后可以用 App Store Connect 里的预览工具看看叠上图标和名字后的效果，主要内容都在画面中间，四周留了余量。

工程设置为只支持 iPhone（iPad 上以 iPhone 模式运行），所以不需要 iPad 截图。

## 小店升级宣传图

`levels/` 里是 8 个等级小店的宣传图（JPEG），中文 `zh-Hans/`、英文 `en-US/` 各一套，招牌上写的是示范店名「晴天面包铺 / Sunny Day Bakery」：

| 文件 | 内容 | 尺寸 |
|---|---|---|
| `levels-all.jpg` | 总图：从周末小推车到旗舰面包店，8 家店按同一比例排在两条街上，越往后越大，下面写等级、名字和解锁要出炉几次 | 3840×2160（16:9） |
| `level-1.jpg` … `level-8.jpg` | 每个等级一张方图：店面放大在中间，上面是等级和解锁条件，下面是店名和一句介绍 | 2048×2048 |

改了店面的画法或等级名字后，用 `tools/levels.mjs` 重新生成（等级文案在 `tools/levels.html` 里，和 `js/app.js` 的 `LEVELS` 保持一致）。

## 重新生成

`tools/` 里是生成脚本：`capture.mjs` 往 app 里放一批示范数据（Lv.5 小店、一个月的出炉记录、两炉正在烤）并截原始画面，`compose.mjs` 加上标题和手机外框。需要先 `npm start` 起本地服务，再改一下脚本里的路径运行。
