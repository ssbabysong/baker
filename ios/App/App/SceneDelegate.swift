import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        // 外面套一层系统原生菜单栏，网页放在里面（见 NativeTabs.swift）
        window?.rootViewController = TabsController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
        // 点桌面小组件冷启动 App
        if let url = connectionOptions.urlContexts.first?.url { WidgetBridgePlugin.open(url) }
        #if DEBUG
        // 调试用：xcrun simctl launch <设备> com.ssbabysong.bakerydays -route recipes  → 直接打开某一页
        if let i = CommandLine.arguments.firstIndex(of: "-route"), i + 1 < CommandLine.arguments.count,
           let url = URL(string: "bakerydays://route/" + CommandLine.arguments[i + 1]) { WidgetBridgePlugin.open(url) }
        #endif
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
        // 点桌面小组件回到 App
        for context in URLContexts { WidgetBridgePlugin.open(context.url) }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
