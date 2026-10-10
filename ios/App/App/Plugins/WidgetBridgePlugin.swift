import Foundation
import Capacitor
import WidgetKit

/// 桌面小组件和网页之间的桥：
/// - update：把小组件要显示的数据（JSON）和插画（PNG）写进 App Group，然后刷新小组件
/// - 点小组件打开 App 时（bakerydays://route/...），把要去的页面交给网页
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeRoute", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.com.ssbabysong.bakerydays"
    private static weak var shared: WidgetBridgePlugin?
    private static var pendingRoute: String?

    override public func load() {
        WidgetBridgePlugin.shared = self
    }

    /// SceneDelegate 收到链接时调用；网页还没准备好就先记下来，等它来取
    @discardableResult
    static func open(_ url: URL) -> Bool {
        guard url.scheme == "bakerydays" else { return false }
        let path = url.host == "route" ? String(url.path.drop(while: { $0 == "/" })) : ""
        let hash = "#/" + path
        if let plugin = shared, plugin.hasListeners("route") {
            plugin.notifyListeners("route", data: ["hash": hash])
        } else {
            pendingRoute = hash
        }
        return true
    }

    @objc func takeRoute(_ call: CAPPluginCall) {
        call.resolve(["hash": WidgetBridgePlugin.pendingRoute ?? ""])
        WidgetBridgePlugin.pendingRoute = nil
    }

    @objc func update(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else { return call.reject("missing json") }
        guard let defaults = UserDefaults(suiteName: WidgetBridgePlugin.appGroup),
              let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: WidgetBridgePlugin.appGroup) else {
            return call.reject("App Group not configured")
        }
        let dir = container.appendingPathComponent("widget", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for (name, value) in call.getObject("images") ?? [:] {
            guard let b64 = value as? String, let data = Data(base64Encoded: b64),
                  name.range(of: "^[\\w-]+$", options: .regularExpression) != nil else { continue }
            try? data.write(to: dir.appendingPathComponent("\(name).png"), options: .atomic)
        }
        defaults.set(json, forKey: "data")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
