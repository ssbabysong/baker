import UIKit
import Capacitor

/// 在这里注册 App 自带的原生插件（桌面小组件、原生菜单栏）。
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
        bridge?.registerPluginInstance(NativeTabsPlugin())
    }
}
