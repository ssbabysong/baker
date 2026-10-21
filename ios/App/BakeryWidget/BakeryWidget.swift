import WidgetKit
import SwiftUI

// 桌面小组件，三种：
//   「我的店面」小号：现在的店面插画、等级、出炉次数
//   「配方架」一层四款，中号一层 / 大号三层（带价签），放不下的显示「+N」；点哪款面包就打开哪个配方
//   「烘焙日历」中号这一周 / 大号这个月，做过面包的日子画上那款面包
// 数据和插画由 App 写进 App Group（见 WidgetBridgePlugin.swift），颜色跟着 App 当前主题。

private let appGroup = "group.com.ssbabysong.bakerydays"
// 所有文字（中英文、数字）都用 App 的店铺字体
private let titleFont = "YEFONTXiaoShiTou"
private let zh = Locale.preferredLanguages.first?.hasPrefix("zh") ?? true
private func T(_ a: String, _ b: String) -> String { zh ? a : b }

// MARK: - 数据

struct Colors: Codable {
    var paper: String?, card: String?, ink: String?, soft: String?, line: String?, wood: String?, brown: String?
}

struct ShopInfo: Codable {
    var lv: Int?
    var bakes: Int?
    var img: String?
}

struct RackItem: Codable {
    var id: String
    var name: String
    var img: String?
    var price: String?
}

struct BakeMark: Codable {
    var t: Double
    var id: String?
    var img: String?
    var date: Date { Date(timeIntervalSince1970: t / 1000) }
}

struct Payload: Codable {
    var colors: Colors?
    var shop: ShopInfo?
    var rack: [RackItem]?
    var recipeCount: Int?
    var bakes: [BakeMark]?
    var weekdays: [String]?
    var months: [String]?
    var text: [String: String]?

    func text(_ key: String, _ fallback: String) -> String { text?[key] ?? fallback }
}

private func picture(_ name: String?) -> UIImage? {
    guard let name, let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return nil }
    return UIImage(contentsOfFile: dir.appendingPathComponent("widget/\(name).png").path)
}

extension Color {
    init(hex: String?, _ fallback: String) {
        var s = (hex?.isEmpty == false ? hex! : fallback).trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        if s.count == 3 { s = s.map { "\($0)\($0)" }.joined() }
        let v = UInt64(s, radix: 16) ?? 0
        self.init(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
    }
}

struct Palette {
    let card, ink, soft, line, wood, brown: Color
    init(_ c: Colors?) {
        card = Color(hex: c?.card, "#fffcf5")
        ink = Color(hex: c?.ink, "#33291f")
        soft = Color(hex: c?.soft, "#9c9081")
        line = Color(hex: c?.line, "#4a3a2e")
        wood = Color(hex: c?.wood, "#d2a676")
        brown = Color(hex: c?.brown, "#9a5f2e")
    }
}

private func route(_ path: String) -> URL { URL(string: "bakerydays://route/\(path)")! }

// MARK: - 时间线

struct Entry: TimelineEntry {
    let date: Date
    let data: Payload?
}

struct Provider: TimelineProvider {
    func load() -> Payload? {
        guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: "data"),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Payload.self, from: data)
    }
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), data: nil) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: Date(), data: load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        // App 每次有改动都会主动刷新；这里过了午夜再刷新一次，让日历的「今天」跟着走
        let now = Date()
        let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86400)).addingTimeInterval(60)
        completion(Timeline(entries: [Entry(date: now, data: load())], policy: .after(midnight)))
    }
}

// MARK: - 小组件外观

/// 还没打开过 App 时的提示
struct EmptyHint: View {
    let p: Palette
    var body: some View {
        VStack(spacing: 6) {
            Text(T("面包物语", "Bakery Days")).font(.custom(titleFont, size: 17)).foregroundColor(p.ink)
            Text(T("打开 App 看看", "Open the app to start")).font(.custom(titleFont, size: 12)).foregroundColor(p.soft)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct Header: View {
    let title: String
    let detail: String
    let p: Palette
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.custom(titleFont, size: 16)).foregroundColor(p.ink)
            Spacer(minLength: 6)
            Text(detail).font(.custom(titleFont, size: 11)).foregroundColor(p.soft)
        }
    }
}

/// 我的店面（小号）
struct ShopView: View {
    let data: Payload
    var body: some View {
        let p = Palette(data.colors)
        ZStack(alignment: .topLeading) {
            VStack(spacing: 4) {
                if let img = picture(data.shop?.img) {
                    Image(uiImage: img).resizable().scaledToFit().frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                } else {
                    Spacer()
                }
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(data.shop?.bakes ?? 0)").font(.custom(titleFont, size: 24)).foregroundColor(p.brown)
                    Text(data.text("baked", T("次出炉", "baked"))).font(.custom(titleFont, size: 12)).foregroundColor(p.soft)
                }
            }
            Text("Lv.\(data.shop?.lv ?? 1)").font(.custom(titleFont, size: 11)).foregroundColor(p.soft)
        }
        .widgetURL(route(""))
    }
}

/// 配方架：一层摆 4 款，中号一层、大号三层；摆不下的最后一格写「+N」，点了去配方架
struct RackView: View {
    let data: Payload
    let large: Bool
    private let perRow = 4

    enum Slot { case bread(RackItem), more(Int), empty }

    var body: some View {
        let p = Palette(data.colors)
        let all = data.rack ?? []
        let count = max(data.recipeCount ?? all.count, all.count)
        let capacity = perRow * (large ? 3 : 1)
        // 放不下时，最后一格让给「+N」
        let shown = count > capacity ? capacity - 1 : min(count, capacity)
        var slots: [Slot] = all.prefix(shown).map { .bread($0) }
        if count > shown { slots.append(.more(count - shown)) }
        let rowCount = large ? 3 : 1
        let rows: [[Slot]] = (0..<rowCount).map { r in
            (0..<perRow).map { c in
                let i = r * perRow + c
                return i < slots.count ? slots[i] : .empty
            }
        }
        return VStack(spacing: 0) {
            Header(title: data.text("rack", T("配方架", "Recipe shelf")),
                   detail: data.text("rackCount", "%d").replacingOccurrences(of: "%d", with: "\(count)"), p: p)
            if all.isEmpty {
                Text(data.text("emptyRack", T("配方架还空着", "The shelf is empty")))
                    .font(.custom(titleFont, size: 12)).foregroundColor(p.soft)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ForEach(rows.indices, id: \.self) { r in
                    shelf(rows[r], p: p)
                }
            }
        }
        .widgetURL(route("recipes"))
    }

    func shelf(_ row: [Slot], p: Palette) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(row.indices, id: \.self) { i in
                    switch row[i] {
                    case .bread(let it):
                        Link(destination: route("r/\(it.id)")) { item(it, p: p) }
                    case .more(let n):
                        Link(destination: route("recipes")) {
                            Text("+\(n)").font(.custom(titleFont, size: 18)).foregroundColor(p.soft)
                                .frame(maxWidth: .infinity, maxHeight: large ? 46 : 54)
                        }
                    case .empty:
                        Color.clear.frame(maxWidth: .infinity)
                    }
                }
            }
            .frame(maxHeight: .infinity, alignment: .bottom)
            // 木板
            ZStack(alignment: .top) {
                LinearGradient(colors: [p.wood, p.wood.opacity(0)], startPoint: .top, endPoint: .bottom).opacity(0.7)
                Rectangle().fill(p.line).frame(height: 2)
            }
            .frame(height: 7)
            .padding(.horizontal, -4)
            .padding(.top, 2)
        }
    }

    func item(_ it: RackItem, p: Palette) -> some View {
        VStack(spacing: 2) {
            ZStack(alignment: .topTrailing) {
                if let img = picture(it.img) {
                    Image(uiImage: img).resizable().scaledToFit()
                }
                if large, let price = it.price, !price.isEmpty {
                    Text(price).font(.custom(titleFont, size: 10)).foregroundColor(p.ink)
                        .padding(.horizontal, 3)
                        .background(RoundedRectangle(cornerRadius: 3).fill(p.card))
                        .overlay(RoundedRectangle(cornerRadius: 3).stroke(p.line.opacity(0.5), lineWidth: 0.8))
                        .rotationEffect(.degrees(6))
                        .offset(x: 6, y: -2)
                }
            }
            .frame(maxHeight: large ? 46 : 54)
            Text(it.name).font(.custom(titleFont, size: 12)).foregroundColor(p.ink).lineLimit(1)
        }
        .frame(maxWidth: .infinity)
    }
}

/// 烘焙日历（中号这一周，大号这个月）
struct CalendarView: View {
    let data: Payload
    let large: Bool
    let now: Date
    private let cal = Calendar(identifier: .gregorian)

    var body: some View {
        let p = Palette(data.colors)
        let month = cal.component(.month, from: now)
        let year = cal.component(.year, from: now)
        let bakes = data.bakes ?? []
        let monthCount = bakes.filter { cal.component(.month, from: $0.date) == month && cal.component(.year, from: $0.date) == year }.count
        let months = data.months ?? cal.monthSymbols
        VStack(spacing: 4) {
            Header(title: months[(month - 1) % months.count],
                   detail: data.text("monthCount", "%d").replacingOccurrences(of: "%d", with: "\(monthCount)"), p: p)
            if large { monthGrid(p: p, bakes: bakes) } else { week(p: p, bakes: bakes) }
        }
        .widgetURL(route("logs"))
    }

    var weekdays: [String] { data.weekdays ?? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] }

    func bake(on day: Date, _ bakes: [BakeMark]) -> BakeMark? {
        bakes.first { cal.isDate($0.date, inSameDayAs: day) }
    }

    @ViewBuilder
    func cell(_ day: Date, bakes: [BakeMark], size: CGFloat, font: CGFloat, p: Palette) -> some View {
        let today = cal.isDate(day, inSameDayAs: now)
        ZStack {
            if let b = bake(on: day, bakes), let img = picture(b.img) {
                Image(uiImage: img).resizable().scaledToFit()
            } else {
                Text("\(cal.component(.day, from: day))").font(.custom(titleFont, size: font)).foregroundColor(p.ink)
            }
            if today {
                Circle().stroke(p.soft, style: StrokeStyle(lineWidth: 1.2, dash: [3, 2]))
            }
        }
        .frame(width: size, height: size)
    }

    func week(p: Palette, bakes: [BakeMark]) -> some View {
        let start = cal.date(byAdding: .day, value: -(cal.component(.weekday, from: now) - 1), to: cal.startOfDay(for: now))!
        return HStack(spacing: 4) {
            ForEach(0..<7, id: \.self) { i in
                VStack(spacing: 4) {
                    Text(weekdays[i % weekdays.count]).font(.custom(titleFont, size: 11)).foregroundColor(p.soft)
                    cell(cal.date(byAdding: .day, value: i, to: start)!, bakes: bakes, size: 38, font: 14, p: p)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(maxHeight: .infinity)
    }

    func monthGrid(p: Palette, bakes: [BakeMark]) -> some View {
        let first = cal.date(from: cal.dateComponents([.year, .month], from: now))!
        let lead = cal.component(.weekday, from: first) - 1
        let days = cal.range(of: .day, in: .month, for: first)!.count
        let rows = (lead + days + 6) / 7
        return VStack(spacing: 1) {
            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { i in
                    Text(weekdays[i % weekdays.count]).font(.custom(titleFont, size: 10)).foregroundColor(p.soft).frame(maxWidth: .infinity)
                }
            }
            ForEach(0..<rows, id: \.self) { r in
                HStack(spacing: 0) {
                    ForEach(0..<7, id: \.self) { c in
                        let n = r * 7 + c - lead
                        Group {
                            if n >= 0 && n < days {
                                cell(cal.date(byAdding: .day, value: n, to: first)!, bakes: bakes, size: 34, font: 11, p: p)
                            } else {
                                Color.clear
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
        }
    }
}

// MARK: - 三个小组件

struct Card<Content: View>: View {
    let data: Payload?
    @ViewBuilder let content: (Payload) -> Content
    var body: some View {
        let p = Palette(data?.colors)
        Group {
            if let data { content(data) } else { EmptyHint(p: p) }
        }
        .containerBackground(p.card, for: .widget)
    }
}

struct ShopWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BakeryShop", provider: Provider()) { entry in
            Card(data: entry.data) { ShopView(data: $0) }
        }
        .configurationDisplayName(T("我的店面", "My shop"))
        .description(T("现在的小店和出炉次数", "Your bakery and how many bakes so far"))
        .supportedFamilies([.systemSmall])
    }
}

struct RackWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BakeryRack", provider: Provider()) { entry in
            RackFamilyView(entry: entry)
        }
        .configurationDisplayName(T("配方架", "Recipe shelf"))
        .description(T("点一款面包，直接打开配方", "Tap a bread to open its recipe"))
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct RackFamilyView: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry
    var body: some View {
        Card(data: entry.data) { RackView(data: $0, large: family == .systemLarge) }
    }
}

struct CalendarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BakeryCalendar", provider: Provider()) { entry in
            CalendarFamilyView(entry: entry)
        }
        .configurationDisplayName(T("烘焙日历", "Bake calendar"))
        .description(T("做过面包的日子都画上那款面包", "Every day you baked, drawn with that bread"))
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct CalendarFamilyView: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry
    var body: some View {
        Card(data: entry.data) { CalendarView(data: $0, large: family == .systemLarge, now: entry.date) }
    }
}

@main
struct BakeryWidgets: WidgetBundle {
    var body: some Widget {
        ShopWidget()
        RackWidget()
        CalendarWidget()
    }
}
