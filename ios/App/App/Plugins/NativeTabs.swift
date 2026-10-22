import UIKit
import Capacitor
import CoreText

/// 系统原生的菜单栏和导航栏：用 UITabBarController + UINavigationController 代替网页里画的底部胶囊和顶栏按钮。
/// 位置、玻璃效果都交给系统——普通 iPhone 菜单栏在底部、按钮在顶部；iPhone Duo 上系统会把它们竖着排到右边状态栏下面，折叠 / 展开也由系统处理。
/// 整个 App 只有一个网页（MainViewController），切到哪个标签，就把网页挪到那个标签的页面里，再让网页自己换路由；
/// 导航栏上显示什么（标题、返回、按钮）也由网页按当前页面告诉这里。
final class TabsController: UITabBarController, UITabBarControllerDelegate {
    static weak var shared: TabsController?

    let bridgeVC = MainViewController()
    private let keys = ["shop", "recipes", "logs"]
    private var slots: [String: TabSlot] = [:]

    override func viewDidLoad() {
        super.viewDidLoad()
        TabsController.shared = self
        delegate = self
        // 导航栏只放返回键和右边的手绘图标按钮：不要标题、不要底色（页面标题还是网页里原来的手绘大字）
        let clear = UINavigationBarAppearance()
        clear.configureWithTransparentBackground()
        let tabFont = TabsController.appFont(size: 11)
        let list = keys.map { key -> UINavigationController in
            let slot = TabSlot(bridge: bridgeVC)
            slots[key] = slot
            let nav = UINavigationController(rootViewController: slot)
            nav.navigationBar.standardAppearance = clear
            nav.navigationBar.scrollEdgeAppearance = clear
            nav.navigationBar.compactAppearance = clear
            nav.navigationBar.tintColor = TabsController.ink
            return nav
        }
        setViewControllers(list, animated: false)
        // 底部菜单的文字也用店里的字体（在菜单栏的外观上改，保留系统的玻璃效果）
        if let tabFont {
            let ap = tabBar.standardAppearance.copy()
            for layout in [ap.stackedLayoutAppearance, ap.inlineLayoutAppearance, ap.compactInlineLayoutAppearance] {
                for state in [layout.normal, layout.selected] {
                    state.titleTextAttributes[.font] = tabFont
                }
            }
            tabBar.standardAppearance = ap
            tabBar.scrollEdgeAppearance = ap
        }
        // 选中的文字用店里的朱红（和网页里的 --shu 一样，深色模式换亮一点的）
        tabBar.tintColor = UIColor { $0.userInterfaceStyle == .dark
            ? UIColor(red: 0xe0 / 255, green: 0x7a / 255, blue: 0x62 / 255, alpha: 1)
            : UIColor(red: 0xc4 / 255, green: 0x51 / 255, blue: 0x3a / 255, alpha: 1) }
        // 网页把标题和图标交过来之前先藏着，免得一闪一个空菜单栏
        hideBar(true, animated: false)
        watchHinge()
    }

    // MARK: 折叠屏的铰链（iPhone Duo）

    /// 有铰链的设备才允许横过来（比如 Duo 打开后横着、半折立起来当小桌子）；普通 iPhone 照旧只竖着用
    private var hasHinge = false {
        didSet { if hasHinge != oldValue { setNeedsUpdateOfSupportedInterfaceOrientations() } }
    }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        hasHinge ? .allButUpsideDown : .portrait
    }

    private var hingeStatus = "unknown"
    private var hingeAngle: CGFloat = 0
    private var lastPosture = ""
    /// 最近一次告诉网页的铰链姿态（网页刚启动时来取）
    static var posture: [String: Any] = ["status": "unknown"]

    private func watchHinge() {
        guard #available(iOS 27.1, *) else { return }
        let interaction = UIHingeInteraction { [weak self] _, update in
            guard let self else { return }
            if let hinge = update.hinge {
                self.hasHinge = true
                self.hingeAngle = hinge.angle * 180 / .pi
                switch hinge.status {
                case .closed: self.hingeStatus = "closed"
                case .partiallyOpen: self.hingeStatus = "partial"
                case .fullyOpen: self.hingeStatus = "open"
                default: self.hingeStatus = "unknown"
                }
            } else {
                self.hingeStatus = "unknown"
            }
            self.reportPosture()
        }
        view.addInteraction(interaction)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        reportPosture() // 转屏、折叠时折痕的位置会变
    }

    /// 告诉网页：铰链状态、角度，和折痕在网页里的位置（半折时才有）
    private func reportPosture() {
        var info: [String: Any] = ["status": hingeStatus, "angle": Int(hingeAngle.rounded())]
        if #available(iOS 27.1, *), let web = bridgeVC.webView,
           let fold = web.reservedRegions(kind: .division).first(where: { $0.isActive }) {
            let f = fold.frame
            info["fold"] = ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height]
        }
        let sig = "\(info)"
        guard sig != lastPosture else { return }
        lastPosture = sig
        TabsController.posture = info
        NativeTabsPlugin.shared?.notifyListeners("posture", data: info)
    }

    /// 网页发来的：每个标签的标题、（换主题时的）手绘图标、当前选中哪个
    func apply(titles: [String: String], icons: [String: (off: UIImage, on: UIImage)], active: String?) {
        for (key, slot) in slots {
            guard let item = slot.navigationController?.tabBarItem else { continue }
            if let title = titles[key] { item.title = title }
            if let icon = icons[key] {
                item.image = icon.off.withRenderingMode(.alwaysOriginal)
                item.selectedImage = icon.on.withRenderingMode(.alwaysOriginal)
            }
        }
        if let active, let i = keys.firstIndex(of: active), i != selectedIndex { selectedIndex = i }
        if barHidden { hideBar(false, animated: true) }
    }

    /// 当前这一页的导航栏
    var currentSlot: TabSlot? { (selectedViewController as? UINavigationController)?.viewControllers.first as? TabSlot }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        guard let i = viewControllers?.firstIndex(of: viewController) else { return }
        NativeTabsPlugin.shared?.notifyListeners("select", data: ["key": keys[i]])
    }

    // 兼容 iOS 17：setTabBarHidden / isTabBarHidden 是 iOS 18 才有的
    private var barHidden: Bool {
        if #available(iOS 18.0, *) { return isTabBarHidden }
        return tabBar.isHidden
    }
    private func hideBar(_ hidden: Bool, animated: Bool) {
        if #available(iOS 18.0, *) { setTabBarHidden(hidden, animated: animated) } else { tabBar.isHidden = hidden }
    }

    /// 墨色（按钮图标）：和网页里的 --ink 一样
    static let ink = UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 0xef / 255, green: 0xe6 / 255, blue: 0xd8 / 255, alpha: 1)
        : UIColor(red: 0x33 / 255, green: 0x29 / 255, blue: 0x1f / 255, alpha: 1) }

    /// App 的字体（小赖字体）：用网页那份 public/fonts/xiaolai.ttf，底部菜单的文字用它，和网页一致
    private static var appFontDescriptor: UIFontDescriptor? = {
        guard let url = Bundle.main.url(forResource: "xiaolai", withExtension: "ttf", subdirectory: "public/fonts") else { return nil }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        guard let descs = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor], let first = descs.first else { return nil }
        return first as UIFontDescriptor
    }()
    static func appFont(size: CGFloat) -> UIFont? {
        appFontDescriptor.map { UIFont(descriptor: $0, size: size) }
    }
}

/// 导航栏上的一个按钮（网页里带 data-tool 的按钮）；menu 不为空时是一个点开有选项的按钮
struct BarItem {
    let id: String
    let symbol: String
    let title: String
    let prominent: Bool
    let menu: [(id: String, title: String)]
    /// 网页画的手绘图标（没有就用 SF Symbols 的 symbol）
    let icon: UIImage?
}

/// 网页这一页的导航栏：标题、副标题、有没有返回、右边的按钮
struct BarConfig {
    var title = ""
    var subtitle = ""
    var back: String?
    var backIcon: UIImage?
    var items: [BarItem] = []
    static var current = BarConfig()
}

/// 一个标签的页面：本身是空的，被选中时把唯一的网页接过来
final class TabSlot: UIViewController {
    private let bridge: UIViewController
    init(bridge: UIViewController) {
        self.bridge = bridge
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0xf7 / 255, green: 0xf2 / 255, blue: 0xe8 / 255, alpha: 1)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        applyBar(BarConfig.current)
        guard bridge.parent !== self else { return }
        bridge.willMove(toParent: nil)
        bridge.view.removeFromSuperview()
        bridge.removeFromParent()
        addChild(bridge)
        bridge.view.frame = view.bounds
        bridge.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(bridge.view)
        bridge.didMove(toParent: self)
    }

    // 导航栏是透明的、只在右上角浮几个按钮：网页不用给它让出一整条，页面顶上的手绘标题和这些按钮在同一行（和原来一样）
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let barH = navigationController?.navigationBar.frame.height ?? 0
        if additionalSafeAreaInsets.top != -barH { additionalSafeAreaInsets.top = -barH }
        if #available(iOS 26.0, *), let web = (bridge as? CAPBridgeViewController)?.webView {
            web.scrollView.topEdgeEffect.isHidden = true // 也不要顶上那层渐变模糊
        }
    }

    func applyBar(_ c: BarConfig) {
        let tap = { (id: String) in NativeTabsPlugin.shared?.notifyListeners("tap", data: ["id": id]) }
        navigationItem.title = c.title
        if #available(iOS 26.0, *) { navigationItem.subtitle = c.subtitle.isEmpty ? nil : c.subtitle }
        if let back = c.back {
            let item = UIBarButtonItem(image: c.backIcon ?? UIImage(systemName: "chevron.backward"), primaryAction: UIAction { _ in tap("back") })
            item.accessibilityLabel = back
            navigationItem.leftBarButtonItem = item
        } else {
            navigationItem.leftBarButtonItem = nil
        }
        // 网页里从左到右的顺序；系统的 rightBarButtonItems 是从右往左排
        navigationItem.rightBarButtonItems = c.items.reversed().map { b in
            let image = b.icon ?? UIImage(systemName: b.symbol)
            let item: UIBarButtonItem
            if b.menu.isEmpty {
                item = UIBarButtonItem(title: b.title, image: image, primaryAction: UIAction { _ in tap(b.id) })
            } else {
                item = UIBarButtonItem(title: b.title, image: image, menu: UIMenu(children: b.menu.map { m in
                    UIAction(title: m.title) { _ in tap(m.id) }
                }))
            }
            item.accessibilityLabel = b.title
            if b.prominent {
                if #available(iOS 26.0, *) { item.style = .prominent } else { item.style = .done }
            }
            return item
        }
    }
}

/// 网页 ⇄ 原生菜单栏、导航栏
/// - set({ active, titles: {shop: '店铺', …}, icons?: {shop: {off: base64PNG, on: base64PNG}, …} })：底部菜单
/// - bar({ title, subtitle, back?, backIcon?, items: [{ id, symbol, icon?, title, prominent, menu?: [{ id, title }] }] })：顶部导航栏（icon 是网页画的手绘图标 PNG）
/// - share({ title, text })：系统分享面板
/// - posture()：当前铰链姿态 { status: closed|partial|open|unknown, angle（度）, fold?: { x, y, w, h }（折痕在网页里的位置） }
/// - 事件：用户点了某个标签 "select" { key }；点了导航栏上的按钮 "tap" { id }（返回是 "back"）；铰链姿态变了 "posture" { 同上 }
@objc(NativeTabsPlugin)
public class NativeTabsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeTabsPlugin"
    public let jsName = "NativeTabs"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "posture", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "devSeed", returnType: CAPPluginReturnPromise)
    ]
    static weak var shared: NativeTabsPlugin?

    override public func load() {
        NativeTabsPlugin.shared = self
    }

    @objc func set(_ call: CAPPluginCall) {
        let titles = (call.getObject("titles") ?? [:]).compactMapValues { $0 as? String }
        var icons: [String: (off: UIImage, on: UIImage)] = [:]
        for (key, value) in call.getObject("icons") ?? [:] {
            guard let pair = value as? JSObject,
                  let off = NativeTabsPlugin.image(pair["off"]), let on = NativeTabsPlugin.image(pair["on"]) else { continue }
            icons[key] = (off, on)
        }
        let active = call.getString("active")
        DispatchQueue.main.async {
            TabsController.shared?.apply(titles: titles, icons: icons, active: active)
            call.resolve()
        }
    }

    @objc func bar(_ call: CAPPluginCall) {
        var c = BarConfig()
        c.title = call.getString("title") ?? ""
        c.subtitle = call.getString("subtitle") ?? ""
        c.back = call.getString("back")
        c.items = (call.getArray("items", JSObject.self) ?? []).compactMap { o in
            guard let id = o["id"] as? String, let symbol = o["symbol"] as? String else { return nil }
            let menu = (o["menu"] as? [JSObject] ?? []).compactMap { m -> (id: String, title: String)? in
                guard let mid = m["id"] as? String, let t = m["title"] as? String else { return nil }
                return (mid, t)
            }
            return BarItem(id: id, symbol: symbol, title: o["title"] as? String ?? "", prominent: o["prominent"] as? Bool ?? false, menu: menu,
                           icon: NativeTabsPlugin.image(o["icon"], template: true))
        }
        c.backIcon = NativeTabsPlugin.image(call.getString("backIcon"), template: true)
        DispatchQueue.main.async {
            BarConfig.current = c
            TabsController.shared?.currentSlot?.applyBar(c)
            call.resolve()
        }
    }

    @objc func share(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        DispatchQueue.main.async {
            guard let tabs = TabsController.shared else { return call.reject("not ready") }
            let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
            // iPad / 宽屏上是个小气泡，从导航栏的分享按钮弹出来
            if let pop = sheet.popoverPresentationController {
                if let item = tabs.currentSlot?.navigationItem.rightBarButtonItems?.last {
                    pop.sourceItem = item
                } else {
                    pop.sourceView = tabs.view
                    pop.sourceRect = CGRect(x: tabs.view.bounds.midX, y: tabs.view.bounds.midY, width: 0, height: 0)
                }
            }
            tabs.present(sheet, animated: true)
            call.resolve()
        }
    }

    /// 调试用的假数据开关：只有调试版、用启动参数 -seed 50（塞到 50 款配方、50 个作品）、-seed 100 8（配方 100、作品 8）或 -unseed（清掉假数据）才有；
    /// 正式版永远返回 0，网页那边就什么都不做。只给一次，免得每次刷新都再塞
    private static var devSeedTaken = false
    @objc func devSeed(_ call: CAPPluginCall) {
        var n = 0, bakes = 0, clear = false
        #if DEBUG
        let args = CommandLine.arguments
        if !NativeTabsPlugin.devSeedTaken {
            if let i = args.firstIndex(of: "-seed"), i + 1 < args.count {
                n = Int(args[i + 1]) ?? 0
                bakes = i + 2 < args.count ? Int(args[i + 2]) ?? n : n // -seed 100 8：100 款配方、8 个作品
            }
            clear = args.contains("-unseed")
        }
        NativeTabsPlugin.devSeedTaken = true
        #endif
        call.resolve(["n": n, "bakes": bakes, "clear": clear])
    }

    @objc func posture(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(TabsController.posture) }
    }

    /// 网页按 @3x 出的 PNG。template：只取形状，颜色跟着系统（导航栏按钮的墨色、深浅色、突出按钮的白字）
    private static func image(_ value: JSValue?, template: Bool = false) -> UIImage? {
        guard let b64 = value as? String, let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 3) else { return nil }
        return template ? img.withRenderingMode(.alwaysTemplate) : img
    }
}
