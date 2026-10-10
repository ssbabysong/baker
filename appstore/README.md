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

工程设置为只支持 iPhone（iPad 上以 iPhone 模式运行），所以不需要 iPad 截图。

## 重新生成

`tools/` 里是生成脚本：`capture.mjs` 往 app 里放一批示范数据（Lv.5 小店、一个月的出炉记录、两炉正在烤）并截原始画面，`compose.mjs` 加上标题和手机外框。需要先 `npm start` 起本地服务，再改一下脚本里的路径运行。
