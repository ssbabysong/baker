import Foundation
import Capacitor
import CloudKit
import UIKit

/// iCloud 同步：配方、出炉记录、照片、店名放进用户自己的 iCloud 私有数据库（开发者看不到），同一个 Apple 账号的设备之间自动同步。
/// 上传下载、断网排队、别的设备改了推送过来，都交给系统的 CKSyncEngine（iOS 17+）。
/// 数据本身在网页的 IndexedDB 里，这里只做中转（合并规则在 js/cloud.js）：
///   - 要上传的放在 outbox/（每条一个 json，照片另存一个 jpg），CKSyncEngine 要发的时候从这里读，发成功了删掉
///   - 下载下来的放进 inbox/，通知网页来取；网页合并进 IndexedDB 后 ack，再删掉
/// - status() → { on, account: available|noAccount|restricted|unknown, syncing, lastSync（毫秒）, fetchedOnce, needsFullUpload, round }
///   round：第几轮「要把本地的全部传上去」，网页每轮只传一次
/// - setOn({ on }) → status
/// - save({ store, id, json, mtime, photo?: base64 JPEG })、remove({ store, id })
/// - takeInbox() → { items: [{ name, store, id, json?, mtime?, deleted?, photo?（文件路径） }] }、ack({ names })
/// - fullUploadDone()：网页已经把本地的全部数据交过来了
/// - syncNow()
/// - 事件 "changed"（inbox 里有新东西）、"status"（状态变了）
@objc(CloudSyncPlugin)
public class CloudSyncPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudSyncPlugin"
    public let jsName = "CloudSync"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setOn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeInbox", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fullUploadDone", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncNow", returnType: CAPPluginReturnPromise),
    ]
    private let sync = CloudSync.shared

    override public func load() {
        sync.onChange = { [weak self] in self?.notifyListeners("changed", data: [:]) }
        sync.onStatus = { [weak self] in
            guard let self else { return }
            self.notifyListeners("status", data: self.sync.statusDict())
        }
        sync.start()
        // 别的设备改了，iCloud 发静默推送过来，CKSyncEngine 收到就去取
        DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
        // 从后台回来主动取一次，推送没到也不会落下
        NotificationCenter.default.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: nil) { [weak self] _ in
            self?.sync.fetchNow()
        }
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(sync.statusDict())
    }

    @objc func setOn(_ call: CAPPluginCall) {
        sync.setOn(call.getBool("on") ?? true)
        call.resolve(sync.statusDict())
    }

    @objc func save(_ call: CAPPluginCall) {
        guard let store = call.getString("store"), let id = call.getString("id"), let json = call.getString("json") else {
            return call.reject("missing store / id / json")
        }
        let mtime = Int64(call.getDouble("mtime") ?? 0)
        let photo = call.getString("photo").flatMap { Data(base64Encoded: $0) }
        sync.save(store: store, id: id, json: json, mtime: mtime, photo: photo)
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let store = call.getString("store"), let id = call.getString("id") else { return call.reject("missing store / id") }
        sync.remove(store: store, id: id)
        call.resolve()
    }

    @objc func takeInbox(_ call: CAPPluginCall) {
        call.resolve(["items": sync.inboxItems()])
    }

    @objc func ack(_ call: CAPPluginCall) {
        sync.ack((call.getArray("names") as? [String]) ?? [])
        call.resolve()
    }

    @objc func fullUploadDone(_ call: CAPPluginCall) {
        sync.needsFullUpload = false
        call.resolve()
    }

    @objc func syncNow(_ call: CAPPluginCall) {
        sync.syncNow()
        call.resolve()
    }
}

// CKSyncEngine 的回调一次只来一个；网页那边的调用和它同时读写的只有 outbox 里的单个文件（原子写入），不另加锁
final class CloudSync: CKSyncEngineDelegate, @unchecked Sendable {
    static let shared = CloudSync()
    private static let containerID = "iCloud.com.ssbabysong.bakerydays"
    private static let recordTypes = ["recipes": "Recipe", "bakes": "Bake", "photos": "Photo", "kv": "Kv"]

    private let zoneID = CKRecordZone.ID(zoneName: "Baker", ownerName: CKCurrentUserDefaultName)
    private let container = CKContainer(identifier: CloudSync.containerID)
    private var engine: CKSyncEngine?
    private let defaults = UserDefaults.standard
    private let fm = FileManager.default
    private let root: URL
    private var outbox: URL { root.appendingPathComponent("outbox", isDirectory: true) }
    private var inbox: URL { root.appendingPathComponent("inbox", isDirectory: true) }
    private var sysDir: URL { root.appendingPathComponent("records", isDirectory: true) }   // 每条记录在云端的版本信息
    private var stateFile: URL { root.appendingPathComponent("engine-state") }

    var onChange: (() -> Void)?
    var onStatus: (() -> Void)?
    private var account = "unknown"
    private var syncing = false

    var isOn: Bool {
        get { defaults.object(forKey: "cloud.on") as? Bool ?? true }   // 默认开
        set { defaults.set(newValue, forKey: "cloud.on") }
    }
    var needsFullUpload: Bool {
        get { defaults.object(forKey: "cloud.needsFullUpload") as? Bool ?? true }   // 第一次要把本地的全部传上去
        set {
            if newValue && !needsFullUpload { defaults.set(round + 1, forKey: "cloud.round") }
            defaults.set(newValue, forKey: "cloud.needsFullUpload")
        }
    }
    private var round: Int { defaults.integer(forKey: "cloud.round") }
    private var fetchedOnce: Bool {
        get { defaults.bool(forKey: "cloud.fetchedOnce") }
        set { defaults.set(newValue, forKey: "cloud.fetchedOnce") }
    }
    private var lastSync: Double {
        get { defaults.double(forKey: "cloud.lastSync") }
        set { defaults.set(newValue, forKey: "cloud.lastSync") }
    }

    private init() {
        root = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("CloudSync", isDirectory: true)
        makeDirs()
    }

    private func makeDirs() {
        for d in [outbox, inbox, sysDir] { try? fm.createDirectory(at: d, withIntermediateDirectories: true) }
    }

    // MARK: 开关

    func start() {
        guard isOn, engine == nil else { return }
        let saved = (try? Data(contentsOf: stateFile)).flatMap { try? JSONDecoder().decode(CKSyncEngine.State.Serialization.self, from: $0) }
        let engine = CKSyncEngine(CKSyncEngine.Configuration(database: container.privateCloudDatabase, stateSerialization: saved, delegate: self))
        self.engine = engine
        if saved == nil { engine.state.add(pendingDatabaseChanges: [.saveZone(CKRecordZone(zoneID: zoneID))]) }
        // outbox 里还没发出去的（上次没网、App 被关掉）重新排上
        engine.state.add(pendingRecordZoneChanges: names(in: outbox, ext: "json").map { .saveRecord(recordID($0)) })
        refreshAccount()
    }

    func setOn(_ on: Bool) {
        guard on != isOn else { return }
        isOn = on
        if on {
            start()
        } else {
            // 关掉：云端的数据不动，本机的同步进度清掉；再打开时重新对一遍
            engine = nil
            reset()
        }
        onStatus?()
    }

    /// 同步进度清零（关掉同步、换了 iCloud 账号）：本地数据不动，下次重新整个对一遍
    private func reset() {
        for d in [outbox, inbox, sysDir] { try? fm.removeItem(at: d) }
        try? fm.removeItem(at: stateFile)
        makeDirs()
        needsFullUpload = true
        fetchedOnce = false
        lastSync = 0
    }

    func statusDict() -> [String: Any] {
        ["on": isOn, "account": account, "syncing": syncing, "lastSync": lastSync, "fetchedOnce": fetchedOnce, "needsFullUpload": needsFullUpload, "round": round]
    }

    private func refreshAccount() {
        container.accountStatus { [weak self] status, _ in
            guard let self else { return }
            switch status {
            case .available: self.account = "available"
            case .noAccount: self.account = "noAccount"
            case .restricted: self.account = "restricted"
            default: self.account = "unknown"
            }
            self.onStatus?()
        }
    }

    func fetchNow() {
        guard let engine else { return }
        Task { try? await engine.fetchChanges() }
    }

    func syncNow() {
        guard let engine else { return }
        refreshAccount()
        Task {
            try? await engine.fetchChanges()
            try? await engine.sendChanges()
        }
    }

    // MARK: 网页交过来的改动

    private func recordID(_ name: String) -> CKRecord.ID { CKRecord.ID(recordName: name, zoneID: zoneID) }
    private func name(_ store: String, _ id: String) -> String { "\(store).\(id)" }

    func save(store: String, id: String, json: String, mtime: Int64, photo: Data?) {
        guard let engine, CloudSync.recordTypes[store] != nil else { return }
        let n = name(store, id)
        let item: [String: Any] = ["store": store, "id": id, "json": json, "mtime": mtime]
        if let photo { try? photo.write(to: outbox.appendingPathComponent("\(n).jpg"), options: .atomic) }
        writeJSON(item, to: outbox.appendingPathComponent("\(n).json"))
        engine.state.add(pendingRecordZoneChanges: [.saveRecord(recordID(n))])
    }

    func remove(store: String, id: String) {
        guard let engine else { return }
        let n = name(store, id)
        removeFiles(n, in: outbox)
        engine.state.remove(pendingRecordZoneChanges: [.saveRecord(recordID(n))])
        engine.state.add(pendingRecordZoneChanges: [.deleteRecord(recordID(n))])
    }

    // MARK: 交给网页的改动

    func inboxItems() -> [[String: Any]] {
        names(in: inbox, ext: "json").compactMap { n in
            guard var item = readJSON(inbox.appendingPathComponent("\(n).json")) else { return nil }
            item["name"] = n
            let jpg = inbox.appendingPathComponent("\(n).jpg")
            if fm.fileExists(atPath: jpg.path) { item["photo"] = jpg.path }
            return item
        }
    }

    func ack(_ names: [String]) {
        for n in names { removeFiles(n, in: inbox) }
    }

    /// 云端来的一条记录 → inbox
    private func receive(_ record: CKRecord) {
        let n = record.recordID.recordName
        saveSystemFields(record)
        guard let store = record["store"] as? String, let id = record["rid"] as? String, let json = record["json"] as? String else { return }
        // 这条本地还有没发出去的改动、而且比云端的新：以本地的为准，不往网页送
        if let pending = readJSON(outbox.appendingPathComponent("\(n).json")), (pending["mtime"] as? Int64 ?? 0) > mtime(of: record) { return }
        if let asset = record["photo"] as? CKAsset, let url = asset.fileURL {
            let dest = inbox.appendingPathComponent("\(n).jpg")
            try? fm.removeItem(at: dest)
            try? fm.copyItem(at: url, to: dest)
        }
        writeJSON(["store": store, "id": id, "json": json, "mtime": mtime(of: record)], to: inbox.appendingPathComponent("\(n).json"))
    }

    private func mtime(of record: CKRecord) -> Int64 { (record["mtime"] as? NSNumber)?.int64Value ?? 0 }

    // MARK: CKSyncEngineDelegate

    func handleEvent(_ event: CKSyncEngine.Event, syncEngine: CKSyncEngine) async {
        switch event {
        case .stateUpdate(let e):
            if let data = try? JSONEncoder().encode(e.stateSerialization) { try? data.write(to: stateFile, options: .atomic) }

        case .accountChange(let e):
            switch e.changeType {
            case .signIn: needsFullUpload = true
            case .signOut, .switchAccounts: reset()
            @unknown default: break
            }
            refreshAccount()

        case .fetchedDatabaseChanges(let e):
            // 用户在系统设置里清掉了 App 的 iCloud 数据：本地的不动，重新建区、整个传一遍
            if e.deletions.contains(where: { $0.zoneID == zoneID }) {
                try? fm.removeItem(at: sysDir)
                makeDirs()
                needsFullUpload = true
                syncEngine.state.add(pendingDatabaseChanges: [.saveZone(CKRecordZone(zoneID: zoneID))])
                onStatus?()
            }

        case .fetchedRecordZoneChanges(let e):
            for m in e.modifications { receive(m.record) }
            for d in e.deletions {
                let n = d.recordID.recordName
                removeFiles(n, in: sysDir)
                removeFiles(n, in: outbox)
                guard let dot = n.firstIndex(of: ".") else { continue }
                writeJSON(["store": String(n[..<dot]), "id": String(n[n.index(after: dot)...]), "deleted": true], to: inbox.appendingPathComponent("\(n).json"))
            }
            if !e.modifications.isEmpty || !e.deletions.isEmpty { onChange?() }

        case .sentRecordZoneChanges(let e):
            handleSent(e, syncEngine)

        case .willFetchChanges, .willSendChanges:
            syncing = true
            onStatus?()

        case .didFetchChanges:
            fetchedOnce = true
            syncing = false
            lastSync = Date().timeIntervalSince1970 * 1000
            onStatus?()

        case .didSendChanges:
            syncing = false
            lastSync = Date().timeIntervalSince1970 * 1000
            onStatus?()

        default:
            break
        }
    }

    private func handleSent(_ e: CKSyncEngine.Event.SentRecordZoneChanges, _ syncEngine: CKSyncEngine) {
        var changed = false
        for r in e.savedRecords {
            saveSystemFields(r)
            let n = r.recordID.recordName
            // 发出去之后本地又改过（outbox 里的更新）就留着，等下一轮
            if let item = readJSON(outbox.appendingPathComponent("\(n).json")), (item["mtime"] as? Int64 ?? -1) == mtime(of: r) {
                removeFiles(n, in: outbox)
            }
        }
        for f in e.failedRecordSaves {
            let id = f.record.recordID
            let n = id.recordName
            switch f.error.code {
            case .serverRecordChanged:
                // 别的设备先改了：比修改时间，云端的新就收下云端的，本地的新就带上云端的版本信息再发一次
                guard let server = f.error.serverRecord else { break }
                saveSystemFields(server)
                let localM = readJSON(outbox.appendingPathComponent("\(n).json"))?["mtime"] as? Int64 ?? 0
                if mtime(of: server) >= localM {
                    removeFiles(n, in: outbox)
                    receive(server)
                    changed = true
                } else {
                    syncEngine.state.add(pendingRecordZoneChanges: [.saveRecord(id)])
                }
            case .zoneNotFound:
                removeFiles(n, in: sysDir)
                syncEngine.state.add(pendingDatabaseChanges: [.saveZone(CKRecordZone(zoneID: zoneID))])
                syncEngine.state.add(pendingRecordZoneChanges: [.saveRecord(id)])
            case .unknownItem:
                removeFiles(n, in: sysDir)
                syncEngine.state.add(pendingRecordZoneChanges: [.saveRecord(id)])
            default:
                // 断网、限流这些 CKSyncEngine 会自己重试
                print("CloudSync: save \(n) failed: \(f.error)")
            }
        }
        if changed { onChange?() }
    }

    func nextRecordZoneChangeBatch(_ context: CKSyncEngine.SendChangesContext, syncEngine: CKSyncEngine) async -> CKSyncEngine.RecordZoneChangeBatch? {
        let changes = syncEngine.state.pendingRecordZoneChanges.filter { context.options.scope.contains($0) }
        guard !changes.isEmpty else { return nil }
        return await CKSyncEngine.RecordZoneChangeBatch(pendingChanges: changes) { id in
            guard let record = self.outgoingRecord(id) else {
                syncEngine.state.remove(pendingRecordZoneChanges: [.saveRecord(id)])   // outbox 里已经没有了（比如后来删掉了）
                return nil
            }
            return record
        }
    }

    private func outgoingRecord(_ id: CKRecord.ID) -> CKRecord? {
        let n = id.recordName
        guard let item = readJSON(outbox.appendingPathComponent("\(n).json")),
              let store = item["store"] as? String, let type = CloudSync.recordTypes[store],
              let rid = item["id"] as? String, let json = item["json"] as? String else { return nil }
        let record = systemFields(n) ?? CKRecord(recordType: type, recordID: id)
        record["store"] = store as NSString
        record["rid"] = rid as NSString
        record["json"] = json as NSString
        record["mtime"] = NSNumber(value: item["mtime"] as? Int64 ?? 0)
        let jpg = outbox.appendingPathComponent("\(n).jpg")
        if fm.fileExists(atPath: jpg.path) { record["photo"] = CKAsset(fileURL: jpg) }
        return record
    }

    // MARK: 文件

    /// 云端版本信息（change tag）：下次改这条时带上，CloudKit 才知道是在哪个版本上改的
    private func saveSystemFields(_ record: CKRecord) {
        let coder = NSKeyedArchiver(requiringSecureCoding: true)
        record.encodeSystemFields(with: coder)
        coder.finishEncoding()
        try? coder.encodedData.write(to: sysDir.appendingPathComponent(record.recordID.recordName), options: .atomic)
    }

    private func systemFields(_ n: String) -> CKRecord? {
        guard let data = try? Data(contentsOf: sysDir.appendingPathComponent(n)),
              let coder = try? NSKeyedUnarchiver(forReadingFrom: data) else { return nil }
        coder.requiresSecureCoding = true
        defer { coder.finishDecoding() }
        return CKRecord(coder: coder)
    }

    private func names(in dir: URL, ext: String) -> [String] {
        ((try? fm.contentsOfDirectory(atPath: dir.path)) ?? []).filter { $0.hasSuffix(".\(ext)") }.map { String($0.dropLast(ext.count + 1)) }
    }

    private func removeFiles(_ n: String, in dir: URL) {
        for f in [n, "\(n).json", "\(n).jpg"] { try? fm.removeItem(at: dir.appendingPathComponent(f)) }
    }

    private func writeJSON(_ dict: [String: Any], to url: URL) {
        if let data = try? JSONSerialization.data(withJSONObject: dict) { try? data.write(to: url, options: .atomic) }
    }

    private func readJSON(_ url: URL) -> [String: Any]? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }
}
