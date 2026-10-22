import UIKit
import Capacitor

/// 在这里注册 App 自带的原生插件（桌面小组件、原生菜单栏、照片抠图、iCloud 同步）。
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
        bridge?.registerPluginInstance(NativeTabsPlugin())
        bridge?.registerPluginInstance(PhotoCutoutPlugin())
        bridge?.registerPluginInstance(CloudSyncPlugin())
    }
}
