# App Store Connect 填写内容

按 App Store Connect 里的页面顺序排。括号里是字数上限。

---

## 1. App 信息（左侧「App 信息」）

| 字段 | 简体中文 | English (U.S.) |
|---|---|---|
| 名称（30） | 面包物语 | Bakery Days |
| 副标题（30） | 简笔画烘焙配方与发酵计时 | Cozy bread recipes & timers |

- **主要类别**：美食佳饮（Food & Drink）
- **次要类别**：生活（Lifestyle）
- **内容版权**：不包含、显示或访问第三方内容（内置配方是自己写的）
- **年龄分级**：问卷全部选「无 / 否」，结果是 **4+**

---

## 2. 价格与销售范围

- 价格：免费（或按你的打算）
- 销售范围：**如果勾了中国大陆，必须在「App 信息」里填 ICP 备案号**。没有备案号的话，先把中国大陆去掉，其他地区照常上架

---

## 3. App 隐私

- 隐私政策网址：`https://ssbabysong.github.io/baker/privacy.html`
- 数据收集：选 **「不，我们不从此 App 中收集数据」**

依据：没有账号、没有统计和广告 SDK；配方、出炉记录、照片都只存在手机本地（IndexedDB）；
联网只有两处，都不上传用户内容：
1. 读取内置配方 `https://ssbabysong.github.io/baker/catalog/recipes.json`
2. 加载 Google Fonts 的数字字体（Courier Prime）

---

## 4. 版本页（1.0 准备提交）

### 宣传文本（170）

**中文**
> 开一家简笔画小面包店：把配方摆上架，发酵烘烤一键计时，几炉一起烤也不乱。每出炉一次，小店就长大一点，从周末小推车一路开成旗舰面包店。

**English**
> Run a little hand-drawn bakery: shelve your recipes, time every proof and bake, juggle many batches. Every bake grows your shop, from a weekend cart to a flagship.

### 描述（4000）

**中文**
```
面包物语是一个简笔画风格的烘焙配方 App，像在经营一家属于自己的街角面包店。

【配方都摆上架】
· 整段粘贴食谱文字，自动认出材料、用量和步骤时间，中英文都可以
· 配方太乱？复制一段提示词给你常用的 AI 助手，让它先整理好再贴回来
· 每款面包都有价签，可以自己定价

【发酵、烘烤自动计时】
· 称料打勾清单，称完自动折叠；份量一键 ×0.5 / ×1.5 / ×2
· 发酵和烘烤一键计时，时间到会响铃、震动、发通知，锁屏也准时
· 几炉一起烤也不乱：首页一炉一台烤箱，各算各的
· 烘焙时屏幕常亮，沾着面粉也不用解锁

【边做边改】
烘焙中随时改配方，出炉时可以选：更新原配方、另存为新配方，或者只记在这一次。

【每一炉都记进日历】
出炉拍照、打分、写笔记。作品墙像一排拍立得，烘焙日历在做过面包的日子画上那款面包。

【从小推车到旗舰店】
按出炉次数升级 8 级小店：周末小推车、私房小铺、熟客小店、街角面包店、排队小店、两层小楼、露台面包店、旗舰面包店。还有几家隐藏款等你解锁。
一片系着藏青头巾的吐司店长守在店门口，烘焙时陪在烤箱旁边，时间到会跳起来叫你。

【桌面小组件】
· 我的店面：现在的小店和出炉次数
· 配方架：点一款面包直接打开配方
· 烘焙日历：这一周 / 这个月做过的面包

【其他】
· 白纸 / 黑板两种外观
· 中文 / English 切换
· 不用注册，数据都存在你的手机里，可以导出备份
```

**English**
```
Bakery Days is a hand-drawn baking recipe app that feels like running your own little corner bakery.

SHELVE YOUR RECIPES
· Paste any recipe and it picks out the ingredients, amounts, steps and timings
· Messy recipe? Copy a ready-made prompt into your favorite AI assistant to tidy it up first
· Every bread gets a price tag you can change

PROOF & BAKE TIMERS
· A weigh-out checklist that folds away as you go; scale to ×0.5, ×1.5 or ×2
· One-tap timers for proofing and baking, with a chime, vibration and a notification, even when your phone is locked
· Many batches, no mess: each batch gets its own oven on the home screen
· The screen stays awake while you bake, so floury hands don't need to unlock it

CHANGE AS YOU GO
Tweak the recipe mid-bake. When it's done, update the original, save it as a new recipe, or keep the change for this bake only.

A DIARY FOR EVERY BAKE
Snap a photo, rate it, add a note. Your bakes line up like polaroids, and the calendar draws each bread on the day you made it.

FROM CART TO FLAGSHIP
Your shop grows through 8 levels as you bake, from a weekend cart to a flagship bakery, with a few secret shops to unlock along the way.
A little toast shopkeeper in a navy bandana waits by the door, keeps you company by the oven, and jumps up when the timer rings.

HOME-SCREEN WIDGETS
· My shop: your bakery and how many bakes so far
· Recipe shelf: tap a bread to open its recipe
· Bake calendar: the breads you made this week or month

AND MORE
· Paper and chalkboard themes
· English and Chinese
· No sign-up. Everything stays on your phone, and you can export a backup
```

### 关键词（100，逗号分隔，不要和名称重复）

**中文**
```
烘焙,配方,食谱,发酵,计时器,烤箱,吐司,欧包,贝果,甜点,蛋糕,烘焙日记,手帐,简笔画,模拟经营,小店,厨房,小组件
```

**English**
```
baking,bread,recipe,proof,timer,sourdough,dough,oven,baker,journal,pastry,cake,kitchen,widget,cozy
```

### 其他字段

| 字段 | 填写 |
|---|---|
| 技术支持网址 | `https://ssbabysong.github.io/baker/support.html` |
| 营销网址（可选） | `https://ssbabysong.github.io/baker/` |
| 版权 | `2026 Shasha Chen` |
| 截图 | iPhone 6.9 英寸：中文 `screenshots/zh-Hans/`，英文 `screenshots/en-US/`；6.5 英寸和 iPad 留空 |
| 构建版本 | 1.0 (1) |
| 发布方式 | 建议选「手动发布此版本」，审核通过后自己点发布 |

---

## 5. App 审核信息

- **需要登录**：不勾（App 没有账号）
- **联系人**：你的姓名、电话、邮箱
- **备注**（中英都写上，审核员多数看英文）：

```
No account or sign-in is needed. All data stays on the device.

How to try the main features:
1. Recipes tab: a few built-in recipes are already on the shelf. Tap one, then tap "Start baking".
2. In baking mode, tick off ingredients and tap a step's timer. When it ends you get a chime, vibration and a local notification (also when the app is in the background).
3. Finish the bake to add a photo, a rating and a note. It then shows on the photo wall and the calendar, and the shop levels up as bakes add up.
4. Home-screen widgets: long-press the home screen, tap "+", search "Bakery Days". There are three: My shop (small), Recipe shelf (medium/large) and Bake calendar (medium/large).

Permissions: the camera and photo library are only used when the user adds a photo of a bake. Notifications are only used for timer alerts.

Network: the app only downloads an updated built-in recipe list from GitHub Pages (https://ssbabysong.github.io/baker/catalog/recipes.json). No user data is uploaded.

The "AI assistant" section on the import screen only copies a text prompt for the user to paste into an AI app of their choice. This app does not call any AI service.

无需登录，数据都保存在设备本地。小组件：长按主屏幕 → 「+」→ 搜索「面包物语」，共三个。
```

---

## 6. 技术支持 / 隐私政策网址

两个页面在仓库根目录（`support.html`、`privacy.html`），由 GitHub Pages 发布，中英文写在同一页：

- 技术支持网址：`https://ssbabysong.github.io/baker/support.html`
- 隐私政策网址：`https://ssbabysong.github.io/baker/privacy.html`

改了 App 的联网、权限或数据存储方式时，记得同步更新 `privacy.html` 和上面第 3 节。
