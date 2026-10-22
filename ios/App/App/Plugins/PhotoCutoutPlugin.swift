import Foundation
import Capacitor
import Vision
import CoreImage
import UIKit

/// 照片抠图：用系统的主体识别（和相册里长按把主体拎出来是同一套，iOS 17+），把背景去掉
/// - cutout({ data: base64 图片 }) → { data: base64 PNG }：和原图一样大，背景透明（不裁到主体范围，网页那边的缩放、拖动位置不用变）
/// - 找不到主体时 reject("no subject")
@objc(PhotoCutoutPlugin)
public class PhotoCutoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhotoCutoutPlugin"
    public let jsName = "PhotoCutout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "cutout", returnType: CAPPluginReturnPromise)
    ]

    @objc func cutout(_ call: CAPPluginCall) {
        guard let b64 = call.getString("data"),
              let data = Data(base64Encoded: b64),
              let ui = UIImage(data: data), let cg = ui.cgImage else {
            return call.reject("bad image")
        }
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let request = VNGenerateForegroundInstanceMaskRequest()
                let handler = VNImageRequestHandler(cgImage: cg, orientation: .up)
                try handler.perform([request])
                guard let result = request.results?.first, !result.allInstances.isEmpty else {
                    return call.reject("no subject")
                }
                let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
                let ci = CIImage(cvPixelBuffer: buffer)
                guard let out = CIContext().createCGImage(ci, from: ci.extent),
                      let png = UIImage(cgImage: out).pngData() else {
                    return call.reject("render failed")
                }
                call.resolve(["data": png.base64EncodedString()])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }
}
