from __future__ import annotations

import re
import unicodedata
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from crawler import WebSource
else:
    WebSource = object


def generate_product_content(product_name: str, sources: list[WebSource], additional_info: str = "") -> dict:
    """Create stable Vietnamese ecommerce content while preserving the old API shape."""
    name = standardize_name(product_name)
    category = infer_category(name, additional_info, sources)
    source_text = " ".join(source.content for source in sources if source.content)
    facts_text = " ".join(part for part in [additional_info.strip(), source_text] if part)

    specs = build_specifications(name, category, facts_text)
    benefits = build_benefits(category, name)
    target_customers = build_target_customers(category)
    pros = build_pros(category, benefits)
    cons = build_cons(category)
    summary = build_summary(name, category, specs, bool(sources), additional_info)
    description = build_description(name, category, benefits, specs, bool(sources))
    keywords = build_keywords(name, category)
    slug = slugify(name)

    return {
        "standardizedProductName": name,
        "productSummary": summary,
        "specifications": specs,
        "benefits": benefits,
        "description": description,
        "landingPage": {
            "heroTitle": build_hero_title(name, category),
            "heroSubtitle": summary,
            "cta": "Xem chi tiết",
            "benefitSection": " • ".join(benefits[:4]),
            "whyChooseSection": build_why_choose(name, benefits, bool(sources)),
        },
        "slogan": build_slogan(category),
        "socialContent": {
            "facebookPost": build_facebook_post(name, benefits, bool(sources)),
            "tiktokCaption": build_tiktok_caption(name, category),
            "hashtags": build_hashtags(name, category),
        },
        "seo": {
            "title": build_seo_title(name, category),
            "metaDescription": build_meta_description(name, benefits),
            "keywords": keywords,
            "slug": slug,
        },
        "faq": build_faq(name, category, bool(sources)),
        "targetCustomers": target_customers,
        "pros": pros,
        "cons": cons,
    }


def standardize_name(product_name: str) -> str:
    raw = " ".join(str(product_name or "").split()).strip()
    normalized = plain_text(raw)

    known_names = [
        (r"iphone\s*15\s*pro\s*max", "iPhone 15 Pro Max"),
        (r"iphone\s*15\s*pro", "iPhone 15 Pro"),
        (r"iphone\s*15\s*plus", "iPhone 15 Plus"),
        (r"iphone\s*15", "iPhone 15"),
        (r"iphone\s*16\s*pro\s*max", "iPhone 16 Pro Max"),
        (r"samsung.*s22\s*ultra|galaxy\s*s22\s*ultra|s22\s*ultra", "Samsung Galaxy S22 Ultra 5G"),
        (r"samsung.*s23\s*ultra|galaxy\s*s23\s*ultra|s23\s*ultra", "Samsung Galaxy S23 Ultra"),
        (r"samsung.*s24\s*ultra|galaxy\s*s24\s*ultra|s24\s*ultra", "Samsung Galaxy S24 Ultra"),
        (r"xiaomi\s*13t\s*pro", "Xiaomi 13T Pro"),
        (r"sony.*wh[-\s]?1000xm5|wh[-\s]?1000xm5", "Sony WH-1000XM5"),
        (r"ipad\s*air\s*5|ipad\s*air.*m1", "iPad Air 5"),
        (r"ipad\s*pro", "iPad Pro"),
        (r"galaxy\s*tab\s*s9", "Samsung Galaxy Tab S9"),
        (r"macbook\s*air\s*m2", "MacBook Air M2"),
        (r"lenovo\s*loq|laptop\s*lenovo\s*loq", "Lenovo LOQ"),
        (r"dell\s*inspiron", "Dell Inspiron"),
    ]
    for pattern, display_name in known_names:
        if re.search(pattern, normalized, re.I):
            return display_name

    brand_map = {
        "iphone": "iPhone",
        "ipad": "iPad",
        "samsung": "Samsung",
        "galaxy": "Galaxy",
        "xiaomi": "Xiaomi",
        "redmi": "Redmi",
        "oppo": "OPPO",
        "vivo": "Vivo",
        "realme": "Realme",
        "sony": "Sony",
        "lenovo": "Lenovo",
        "loq": "LOQ",
        "asus": "ASUS",
        "dell": "Dell",
        "hp": "HP",
        "msi": "MSI",
        "macbook": "MacBook",
        "airpods": "AirPods",
    }

    parts = re.split(r"(\s+)", raw or "Sản phẩm")
    titled = []
    for part in parts:
        key = part.lower()
        if part.isspace():
            titled.append(part)
        elif key in brand_map:
            titled.append(brand_map[key])
        elif re.fullmatch(r"[a-z]+\d+[a-z]*", key):
            titled.append(part.upper())
        else:
            titled.append(part[:1].upper() + part[1:])
    return "".join(titled).strip()


def infer_category(name: str, additional_info: str, sources: list[WebSource]) -> str:
    value = plain_text(" ".join([name, additional_info, " ".join(source.title for source in sources)]))
    if any(token in value for token in ["op lung", "case", "spigen"]):
        return "phone_case"
    if any(token in value for token in ["sac du phong", "pin du phong", "power bank", "powerbank"]):
        return "power_bank"
    if any(token in value for token in ["cu sac", "sac nhanh", "charger", "anker"]):
        return "charger"
    if any(token in value for token in ["cap sac", "type-c", "lightning", "usb-c to lightning"]):
        return "phone_cable"
    if any(token in value for token in ["airpods", "tai nghe", "headphone", "earbud", "earphone", "wh-1000", "wf-1000"]):
        return "headphone"
    if any(token in value for token in ["chuot", "mouse", "mx master"]):
        return "mouse"
    if any(token in value for token in ["ban phim", "keyboard", "keychron"]):
        return "keyboard"
    if any(token in value for token in ["tui chong soc", "sleeve", "tomtoc"]):
        return "laptop_sleeve"
    if any(token in value for token in ["de tan nhiet", "cooler", "cooling pad"]):
        return "cooling_pad"
    if any(token in value for token in ["cap hdmi", "hdmi"]):
        return "hdmi_cable"
    if any(token in value for token in ["ipad", "tablet", "may tinh bang", "galaxy tab"]):
        return "tablet"
    if any(token in value for token in ["laptop", "notebook", "macbook", "inspiron", "thinkpad", "loq"]):
        return "laptop"
    if any(token in value for token in ["watch", "dong ho", "smartwatch"]):
        return "smartwatch"
    if any(token in value for token in ["iphone", "samsung", "galaxy s", "xiaomi", "oppo", "vivo", "dien thoai", "smartphone", "phone"]):
        return "smartphone"
    return "general"


def build_specifications(name: str, category: str, text: str) -> list[str]:
    known = known_specs(name)
    if known:
        return known

    extracted = extract_specs_from_text(category, text)
    if len(extracted) >= 3:
        return extracted[:8]

    defaults = {
        "smartphone": [
            "Màn hình: Cần kiểm chứng theo phiên bản bán ra",
            "Chip xử lý: Cần kiểm chứng từ nhà bán hàng",
            "Camera: Cần kiểm chứng từ nguồn chính thức",
            "Bộ nhớ: Cần kiểm chứng theo tùy chọn cấu hình",
            "Pin: Cần kiểm chứng theo điều kiện sử dụng",
        ],
        "tablet": [
            "Màn hình: Cần kiểm chứng theo phiên bản",
            "Chip xử lý: Cần kiểm chứng từ nhà bán hàng",
            "Bộ nhớ: Cần kiểm chứng theo tùy chọn cấu hình",
            "Kết nối: Wi-Fi hoặc 4G/5G tùy phiên bản",
        ],
        "laptop": [
            "CPU: Cần kiểm chứng theo cấu hình bán ra",
            "RAM: Cần kiểm chứng theo tùy chọn cấu hình",
            "Ổ cứng: Cần kiểm chứng theo tùy chọn cấu hình",
            "Màn hình: Cần kiểm chứng theo phiên bản",
            "Bảo hành: Cần xác nhận với nhà bán hàng",
        ],
        "headphone": [
            "Kết nối: Bluetooth",
            "Tính năng: Chống ồn hoặc lọc ồn tùy phiên bản",
            "Thời lượng pin: Cần kiểm chứng theo điều kiện sử dụng",
            "Kiểu dáng: Phù hợp nghe nhạc, học tập và làm việc",
        ],
        "phone_case": [
            "Chất liệu: Cần kiểm chứng theo phiên bản bán ra",
            "Khả năng bảo vệ: Chống sốc, chống trầy tùy thiết kế",
            "Tương thích: Cần kiểm tra đúng model điện thoại",
            "Thiết kế: Ưu tiên ôm máy, dễ cầm và không che cổng kết nối",
        ],
        "charger": [
            "Công suất: Cần kiểm chứng theo phiên bản bán ra",
            "Chuẩn sạc: USB-C/PD hoặc chuẩn tương thích tùy sản phẩm",
            "Thiết bị hỗ trợ: Điện thoại, tablet hoặc laptop tùy công suất",
            "An toàn: Nên kiểm tra chứng nhận và chính sách bảo hành",
        ],
        "phone_cable": [
            "Chuẩn kết nối: Cần kiểm chứng đúng Type-C, Lightning hoặc HDMI",
            "Chiều dài: Cần kiểm chứng theo phiên bản bán ra",
            "Tính năng: Hỗ trợ sạc nhanh hoặc truyền dữ liệu tùy loại cáp",
            "Độ bền: Nên kiểm tra vật liệu bọc và đầu cắm",
        ],
        "power_bank": [
            "Dung lượng: Cần kiểm chứng theo phiên bản bán ra",
            "Công suất sạc: Cần kiểm tra chuẩn sạc nhanh hỗ trợ",
            "Cổng kết nối: USB-A/USB-C tùy mẫu",
            "Phù hợp: Điện thoại, tablet và thiết bị di động",
        ],
        "mouse": [
            "Kết nối: Không dây hoặc Bluetooth tùy phiên bản",
            "Thiết kế: Công thái học, phù hợp làm việc lâu",
            "Tính năng: Có thể hỗ trợ nhiều thiết bị hoặc tùy chỉnh nút",
            "Phù hợp: Văn phòng, sáng tạo nội dung và làm việc đa nhiệm",
        ],
        "keyboard": [
            "Kiểu bàn phím: Cơ, low-profile hoặc văn phòng tùy mẫu",
            "Kết nối: Không dây/Bluetooth hoặc có dây tùy phiên bản",
            "Switch: Cần kiểm chứng theo tùy chọn bán ra",
            "Phù hợp: Gõ văn bản, làm việc văn phòng và setup tối giản",
        ],
        "laptop_sleeve": [
            "Kích thước: Cần chọn đúng size laptop",
            "Khả năng bảo vệ: Chống sốc, chống trầy tùy cấu tạo",
            "Chất liệu: Cần kiểm chứng theo phiên bản bán ra",
            "Phù hợp: Đi học, đi làm và di chuyển hằng ngày",
        ],
        "cooling_pad": [
            "Số quạt: Cần kiểm chứng theo phiên bản bán ra",
            "Điều chỉnh độ cao: Có hoặc không tùy mẫu",
            "Kích thước hỗ trợ: Cần kiểm tra theo size laptop",
            "Phù hợp: Laptop gaming, đồ họa hoặc dùng lâu trên bàn",
        ],
        "hdmi_cable": [
            "Chuẩn HDMI: Cần kiểm chứng HDMI 2.0/2.1 theo sản phẩm",
            "Độ phân giải hỗ trợ: 4K/8K tùy chuẩn cáp và thiết bị",
            "Chiều dài: Cần kiểm tra theo phiên bản bán ra",
            "Phù hợp: Kết nối laptop với màn hình, TV hoặc máy chiếu",
        ],
        "smartwatch": [
            "Màn hình: Cần kiểm chứng theo phiên bản",
            "Tính năng sức khỏe: Cần kiểm chứng từ nhà sản xuất",
            "Pin: Cần kiểm chứng theo điều kiện sử dụng",
            "Kết nối: Cần xác nhận theo phiên bản",
        ],
    }
    return defaults.get(category, ["Thông số kỹ thuật: Cần kiểm chứng từ nguồn chính thức trước khi đăng bán"])


def known_specs(name: str) -> list[str]:
    normalized = plain_text(name)
    catalog = [
        (
            r"iphone\s*15$",
            [
                "Màn hình: 6.1 inch Super Retina XDR OLED",
                "Độ phân giải: 2556 x 1179 pixels",
                "Chip: Apple A16 Bionic",
                "Camera: Chính 48MP, góc siêu rộng 12MP",
                "Bộ nhớ: 128GB, 256GB hoặc 512GB",
                "Cổng kết nối: USB-C",
            ],
        ),
        (
            r"samsung.*s22\s*ultra",
            [
                "Màn hình: 6.8 inch Dynamic AMOLED 2X, 120Hz",
                "Độ phân giải: 1440 x 3088 pixels",
                "Chip: Snapdragon 8 Gen 1 hoặc Exynos 2200 tùy thị trường",
                "Camera: Chính 108MP, tele 10MP, tiềm vọng 10MP, góc rộng 12MP",
                "Bộ nhớ: 128GB, 256GB, 512GB hoặc 1TB",
                "Pin: 5000mAh, sạc nhanh 45W",
            ],
        ),
        (
            r"sony\s*wh[-\s]?1000xm5",
            [
                "Kiểu tai nghe: Chụp tai không dây",
                "Kết nối: Bluetooth",
                "Tính năng: Chống ồn chủ động",
                "Thời lượng pin: Tối đa khoảng 30 giờ tùy điều kiện sử dụng",
                "Cổng sạc: USB-C",
                "Phù hợp: Làm việc, học tập, di chuyển và giải trí",
            ],
        ),
        (
            r"airpods\s*pro\s*2",
            [
                "Kiểu tai nghe: True wireless",
                "Tính năng: Chống ồn chủ động và xuyên âm thích ứng",
                "Hệ sinh thái: Tối ưu cho iPhone, iPad và Mac",
                "Hộp sạc: Cần kiểm chứng theo phiên bản USB-C hoặc Lightning",
                "Phù hợp: Nghe nhạc, gọi điện, họp online và di chuyển",
            ],
        ),
        (
            r"anker.*65w",
            [
                "Công suất: 65W",
                "Chuẩn sạc: USB-C Power Delivery tùy phiên bản",
                "Phù hợp: Điện thoại, tablet và một số laptop USB-C",
                "Thiết kế: Gọn, tiện mang theo",
                "Lưu ý: Cần dùng cáp tương thích để đạt công suất tối ưu",
            ],
        ),
        (
            r"xiaomi.*20000mah|20000mah.*33w",
            [
                "Dung lượng: 20000mAh",
                "Công suất: 33W tùy phiên bản",
                "Cổng kết nối: Cần kiểm chứng USB-C/USB-A theo mẫu bán ra",
                "Phù hợp: Điện thoại, tablet và thiết bị di động",
                "Lưu ý: Thời gian sạc thay đổi theo thiết bị và cáp sử dụng",
            ],
        ),
        (
            r"logitech.*mx\s*master\s*3s",
            [
                "Kiểu chuột: Không dây công thái học",
                "Kết nối: Bluetooth/receiver tùy phiên bản",
                "Tính năng: Cuộn nhanh, thao tác đa thiết bị",
                "Phù hợp: Văn phòng, sáng tạo nội dung và làm việc đa nhiệm",
                "Lưu ý: Cần kiểm tra bảo hành và phụ kiện đi kèm",
            ],
        ),
        (
            r"keychron\s*k3",
            [
                "Kiểu bàn phím: Cơ low-profile",
                "Kết nối: Không dây hoặc có dây tùy phiên bản",
                "Switch: Gateron hoặc tùy chọn theo mẫu bán ra",
                "Phù hợp: Gõ văn bản, lập trình và setup làm việc gọn",
                "Lưu ý: Cần chọn đúng layout và switch trước khi mua",
            ],
        ),
        (
            r"hdmi\s*2\.1|baseus.*hdmi",
            [
                "Chuẩn cáp: HDMI 2.1",
                "Độ phân giải hỗ trợ: Có thể hỗ trợ 8K@60Hz tùy thiết bị",
                "Chiều dài: Cần kiểm tra theo phiên bản bán ra",
                "Phù hợp: Kết nối laptop, PC, console với màn hình hoặc TV",
                "Lưu ý: Chất lượng hiển thị phụ thuộc cả cổng và thiết bị nhận",
            ],
        ),
        (
            r"macbook\s*air\s*m2",
            [
                "Chip: Apple M2",
                "Màn hình: Liquid Retina 13.6 inch",
                "RAM: 8GB hoặc cao hơn tùy cấu hình",
                "Ổ cứng: SSD 256GB hoặc cao hơn tùy cấu hình",
                "Thiết kế: Mỏng nhẹ, phù hợp di chuyển",
            ],
        ),
    ]
    for pattern, specs in catalog:
        if re.search(pattern, normalized, re.I):
            return specs
    return []


def extract_specs_from_text(category: str, text: str) -> list[str]:
    if not text:
        return []
    compact = " ".join(text.split())
    specs: list[str] = []

    patterns = [
        ("Màn hình", r"([0-9]+(?:\.[0-9]+)?\s?(?:inch|inches|inci)[^.]{0,80})"),
        ("Độ phân giải", r"([0-9]{3,4}\s?x\s?[0-9]{3,4}\s?(?:pixels|pixel|px)?[^.]{0,60})"),
        ("Chip/CPU", r"((?:Apple A[0-9]{2}|A[0-9]{2}|Snapdragon|Dimensity|Exynos|Intel Core|AMD Ryzen|Apple M[0-9])[^.]{0,100})"),
        ("Camera", r"((?:12|13|16|48|50|64|108|200)\s?MP[^.]{0,120})"),
        ("Bộ nhớ", r"((?:64|128|256|512)\s?GB|1\s?TB)"),
        ("Pin", r"([0-9]{3,5}\s?mAh[^.]{0,80}|[0-9]+(?:\.[0-9]+)?\s?giờ[^.]{0,80}|[0-9]+(?:\.[0-9]+)?\s?hours[^.]{0,80})"),
        ("Kết nối", r"(Bluetooth\s?[0-9.]*|USB-C|Wi-?Fi\s?[0-9A-Za-z.]*)"),
    ]
    for label, pattern in patterns:
        match = re.search(pattern, compact, flags=re.I)
        if match:
            specs.append(f"{label}: {match.group(1).strip()[:140]}")

    return dedupe(specs)


def build_benefits(category: str, name: str) -> list[str]:
    mapping = {
        "smartphone": [
            "Trải nghiệm sử dụng mượt mà cho liên lạc, học tập và giải trí",
            "Camera hỗ trợ ghi lại khoảnh khắc hằng ngày rõ nét hơn",
            "Thiết kế hiện đại, dễ mang theo và phù hợp nhiều phong cách",
            "Hệ sinh thái phụ kiện và ứng dụng phong phú",
        ],
        "tablet": [
            "Không gian màn hình rộng cho học tập, giải trí và ghi chú",
            "Dễ mang theo hơn laptop trong nhiều tình huống",
            "Phù hợp xem nội dung, đọc tài liệu và họp trực tuyến",
            "Có thể kết hợp bàn phím hoặc bút cảm ứng tùy nhu cầu",
        ],
        "laptop": [
            "Phù hợp học tập, làm việc văn phòng và xử lý tác vụ hằng ngày",
            "Thiết kế tiện mang theo khi đi học, đi làm hoặc làm việc từ xa",
            "Dễ triển khai cho nhu cầu cá nhân hoặc doanh nghiệp nhỏ",
            "Có nhiều cấu hình để lựa chọn theo ngân sách",
        ],
        "headphone": [
            "Giúp tập trung hơn khi học tập, làm việc hoặc di chuyển",
            "Kết nối không dây gọn gàng, hạn chế vướng víu",
            "Phù hợp nghe nhạc, xem phim, họp online và giải trí cá nhân",
            "Thiết kế tiện dùng trong nhiều bối cảnh hằng ngày",
        ],
        "phone_case": [
            "Bảo vệ điện thoại tốt hơn trước trầy xước và va chạm nhẹ",
            "Giữ cảm giác cầm chắc tay khi sử dụng hằng ngày",
            "Dễ phối với phong cách cá nhân nhờ nhiều kiểu dáng",
            "Phù hợp khách hàng muốn bảo vệ máy ngay sau khi mua",
        ],
        "charger": [
            "Rút ngắn thời gian sạc cho thiết bị tương thích",
            "Gọn nhẹ, dễ mang theo khi đi học, đi làm hoặc du lịch",
            "Có thể dùng cho nhiều thiết bị nếu hỗ trợ đúng chuẩn sạc",
            "Phù hợp người dùng cần bộ sạc dự phòng cho văn phòng và gia đình",
        ],
        "phone_cable": [
            "Hỗ trợ sạc và kết nối thiết bị ổn định hơn",
            "Dễ thay thế cáp cũ, đứt hoặc sạc chậm",
            "Phù hợp dùng tại bàn làm việc, xe hơi hoặc mang theo hằng ngày",
            "Giúp tối ưu trải nghiệm nếu dùng đúng chuẩn cáp và củ sạc",
        ],
        "power_bank": [
            "Bổ sung pin khi di chuyển, đi học, đi làm hoặc du lịch",
            "Dung lượng lớn giúp sạc nhiều lần tùy thiết bị",
            "Phù hợp người dùng thường xuyên ra ngoài cả ngày",
            "Tiện dùng cho điện thoại, tai nghe, tablet và phụ kiện di động",
        ],
        "mouse": [
            "Tăng sự thoải mái khi làm việc lâu với laptop",
            "Hỗ trợ thao tác chính xác hơn touchpad",
            "Phù hợp làm việc đa nhiệm và chuyển đổi giữa nhiều thiết bị",
            "Giúp setup bàn làm việc gọn gàng, chuyên nghiệp hơn",
        ],
        "keyboard": [
            "Cải thiện cảm giác gõ khi làm việc hoặc học tập nhiều giờ",
            "Tối ưu setup laptop với màn hình ngoài",
            "Phù hợp người viết nội dung, lập trình hoặc xử lý văn bản",
            "Thiết kế gọn giúp bàn làm việc ngăn nắp hơn",
        ],
        "laptop_sleeve": [
            "Bảo vệ laptop khi mang theo hằng ngày",
            "Giảm trầy xước khi để trong balo hoặc túi xách",
            "Thiết kế gọn, phù hợp đi học và đi làm",
            "Tạo cảm giác chuyên nghiệp khi di chuyển với thiết bị",
        ],
        "cooling_pad": [
            "Hỗ trợ laptop thoáng hơn khi sử dụng lâu",
            "Phù hợp laptop gaming, đồ họa hoặc làm việc cường độ cao",
            "Có thể cải thiện tư thế đặt máy nhờ điều chỉnh độ cao",
            "Giúp setup bàn làm việc ổn định và gọn gàng hơn",
        ],
        "hdmi_cable": [
            "Kết nối laptop với màn hình, TV hoặc máy chiếu dễ dàng",
            "Phù hợp thuyết trình, học online, giải trí và làm việc đa màn hình",
            "Hỗ trợ hình ảnh độ phân giải cao nếu thiết bị tương thích",
            "Là phụ kiện thiết yếu cho setup văn phòng và học tập",
        ],
        "smartwatch": [
            "Theo dõi hoạt động và nhắc nhở trong ngày tiện lợi",
            "Nhận thông báo nhanh mà không cần mở điện thoại liên tục",
            "Phù hợp người quan tâm sức khỏe và vận động",
            "Thiết kế nhỏ gọn, dễ phối với trang phục hằng ngày",
        ],
    }
    return mapping.get(category, [
        f"{name} hỗ trợ tốt các nhu cầu sử dụng hằng ngày",
        "Dễ giới thiệu trên trang bán hàng và kênh mạng xã hội",
        "Phù hợp khách hàng đang tìm sản phẩm công nghệ tiện dụng",
        "Có thể tùy biến nội dung theo giá bán và chính sách cửa hàng",
    ])


def build_target_customers(category: str) -> list[str]:
    mapping = {
        "smartphone": ["Sinh viên", "Nhân viên văn phòng", "Người cần thiết bị liên lạc và giải trí mỗi ngày"],
        "tablet": ["Người học online", "Người đọc tài liệu và ghi chú", "Gia đình cần thiết bị giải trí gọn nhẹ"],
        "laptop": ["Sinh viên", "Nhân viên văn phòng", "Người làm việc từ xa"],
        "headphone": ["Sinh viên", "Nhân viên văn phòng", "Người thường xuyên di chuyển"],
        "phone_case": ["Người mới mua điện thoại", "Người muốn bảo vệ máy", "Khách hàng thích phụ kiện cá nhân hóa"],
        "charger": ["Người dùng nhiều thiết bị", "Nhân viên văn phòng", "Người thường xuyên di chuyển"],
        "phone_cable": ["Người cần thay cáp sạc", "Người dùng iPhone/Android", "Khách hàng cần phụ kiện dự phòng"],
        "power_bank": ["Sinh viên", "Người đi làm", "Người hay du lịch hoặc di chuyển cả ngày"],
        "mouse": ["Nhân viên văn phòng", "Designer/creator", "Người dùng laptop làm việc lâu"],
        "keyboard": ["Nhân viên văn phòng", "Lập trình viên", "Người muốn setup bàn làm việc gọn"],
        "laptop_sleeve": ["Sinh viên", "Nhân viên văn phòng", "Người thường xuyên mang laptop"],
        "cooling_pad": ["Người dùng laptop gaming", "Người làm đồ họa", "Người dùng laptop nhiều giờ"],
        "hdmi_cable": ["Nhân viên văn phòng", "Người thuyết trình", "Người dùng màn hình ngoài hoặc TV"],
        "smartwatch": ["Người chơi thể thao", "Nhân viên văn phòng", "Người quan tâm sức khỏe"],
    }
    return mapping.get(category, ["Người mua sắm online", "Khách hàng trẻ", "Người dùng cần sản phẩm công nghệ tiện dụng"])


def build_pros(category: str, benefits: list[str]) -> list[str]:
    defaults = {
        "smartphone": ["Dễ sử dụng hằng ngày", "Thiết kế hiện đại", "Phù hợp nhiều nhu cầu phổ biến"],
        "tablet": ["Màn hình rộng", "Dễ mang theo", "Phù hợp học tập và giải trí"],
        "laptop": ["Phù hợp công việc văn phòng", "Nhiều lựa chọn cấu hình", "Dễ triển khai cho học tập và làm việc"],
        "headphone": ["Tiện dùng khi di chuyển", "Hỗ trợ tập trung", "Phù hợp nghe nhạc và họp online"],
        "phone_case": ["Bảo vệ máy tốt hơn", "Dễ dùng hằng ngày", "Nhiều kiểu dáng dễ chọn"],
        "charger": ["Sạc nhanh hơn với thiết bị tương thích", "Gọn nhẹ", "Dùng được cho nhiều bối cảnh"],
        "phone_cable": ["Dễ thay thế", "Hữu ích hằng ngày", "Phù hợp làm phụ kiện mua kèm"],
        "power_bank": ["Dung lượng dự phòng tiện lợi", "Phù hợp di chuyển", "Dùng cho nhiều thiết bị di động"],
        "mouse": ["Thoải mái khi làm việc lâu", "Thao tác chính xác", "Setup gọn hơn"],
        "keyboard": ["Cảm giác gõ tốt hơn", "Phù hợp làm việc dài giờ", "Tối ưu setup laptop"],
        "laptop_sleeve": ["Bảo vệ laptop khi di chuyển", "Thiết kế gọn", "Dễ bán kèm laptop"],
        "cooling_pad": ["Hỗ trợ tản nhiệt", "Cải thiện góc đặt máy", "Phù hợp dùng lâu"],
        "hdmi_cable": ["Kết nối màn hình ngoài dễ dàng", "Hỗ trợ trình chiếu", "Hữu ích cho học tập và văn phòng"],
        "smartwatch": ["Theo dõi nhanh trong ngày", "Thiết kế gọn", "Phù hợp lối sống năng động"],
    }
    return defaults.get(category, benefits[:3])


def build_cons(category: str) -> list[str]:
    defaults = {
        "smartphone": ["Giá và cấu hình cần so sánh theo từng phiên bản", "Thông số thực tế cần kiểm chứng từ nhà bán hàng"],
        "tablet": ["Một số tác vụ nặng vẫn cần laptop", "Phụ kiện như bút hoặc bàn phím có thể bán riêng"],
        "laptop": ["Không phải cấu hình nào cũng phù hợp tác vụ nặng", "Cần kiểm tra RAM, CPU, ổ cứng và bảo hành trước khi mua"],
        "headphone": ["Chất âm và độ thoải mái phụ thuộc cảm nhận cá nhân", "Thời lượng pin thay đổi theo âm lượng và chế độ sử dụng"],
        "phone_case": ["Cần chọn đúng model điện thoại", "Độ bảo vệ phụ thuộc thiết kế và chất liệu"],
        "charger": ["Cần thiết bị và cáp tương thích để đạt sạc nhanh", "Nên kiểm tra chứng nhận an toàn và bảo hành"],
        "phone_cable": ["Cần chọn đúng chuẩn đầu cắm", "Tốc độ sạc phụ thuộc cả củ sạc và thiết bị"],
        "power_bank": ["Trọng lượng có thể tăng theo dung lượng", "Công suất sạc phụ thuộc cáp và thiết bị"],
        "mouse": ["Cảm giác cầm tùy kích thước tay", "Một số tính năng cần phần mềm hỗ trợ"],
        "keyboard": ["Cần chọn đúng layout và loại switch", "Âm thanh gõ có thể không phù hợp mọi môi trường"],
        "laptop_sleeve": ["Cần chọn đúng kích thước laptop", "Không thay thế balo chống sốc chuyên dụng trong va đập mạnh"],
        "cooling_pad": ["Hiệu quả phụ thuộc thiết kế laptop", "Có thể phát sinh tiếng quạt khi dùng"],
        "hdmi_cable": ["Chất lượng hiển thị phụ thuộc cả thiết bị nguồn và màn hình", "Cần chọn đúng chuẩn nếu muốn 4K/8K"],
        "smartwatch": ["Tính năng sức khỏe chỉ mang tính tham khảo", "Thời lượng pin thay đổi theo cách dùng"],
    }
    return defaults.get(category, ["Cần kiểm chứng thông tin từ nguồn chính thức", "Giá bán có thể thay đổi theo thời điểm"])


def build_summary(name: str, category: str, specs: list[str], has_sources: bool, additional_info: str) -> str:
    source_note = (
        "Nội dung đã được tổng hợp từ nguồn công khai và vẫn nên kiểm chứng giá, phiên bản, bảo hành trước khi đăng bán."
        if has_sources
        else "Nội dung đang ở chế độ concept dựa trên tên sản phẩm và thông tin bổ sung, cần kiểm chứng trước khi đăng bán."
    )
    category_label = {
        "smartphone": "điện thoại thông minh",
        "tablet": "máy tính bảng",
        "laptop": "laptop",
        "headphone": "tai nghe",
        "phone_case": "ốp lưng điện thoại",
        "charger": "củ sạc nhanh",
        "phone_cable": "cáp kết nối",
        "power_bank": "sạc dự phòng",
        "mouse": "chuột không dây",
        "keyboard": "bàn phím",
        "laptop_sleeve": "túi chống sốc laptop",
        "cooling_pad": "đế tản nhiệt laptop",
        "hdmi_cable": "cáp HDMI",
        "smartwatch": "đồng hồ thông minh",
    }.get(category, "sản phẩm công nghệ")
    highlight = {
        "smartphone": "trải nghiệm kết nối, giải trí và chụp ảnh hằng ngày",
        "tablet": "không gian màn hình rộng cho học tập, ghi chú và giải trí",
        "laptop": "khả năng hỗ trợ học tập, làm việc văn phòng và di chuyển",
        "headphone": "khả năng hỗ trợ tập trung, nghe nhạc và họp online tiện lợi",
        "phone_case": "khả năng bảo vệ máy, tăng độ bám và làm mới phong cách thiết bị",
        "charger": "khả năng sạc nhanh, gọn nhẹ và dùng linh hoạt cho nhiều thiết bị",
        "phone_cable": "khả năng sạc/kết nối ổn định và dễ mang theo",
        "power_bank": "khả năng bổ sung pin khi di chuyển và dùng thiết bị cả ngày",
        "mouse": "khả năng thao tác chính xác, thoải mái và hỗ trợ làm việc đa nhiệm",
        "keyboard": "cảm giác gõ tốt hơn và setup bàn làm việc gọn gàng",
        "laptop_sleeve": "khả năng bảo vệ laptop khi đi học, đi làm hoặc di chuyển",
        "cooling_pad": "khả năng hỗ trợ laptop thoáng hơn khi dùng lâu",
        "hdmi_cable": "khả năng kết nối màn hình ngoài phục vụ học tập, làm việc và giải trí",
        "smartwatch": "khả năng theo dõi nhanh hoạt động và thông báo trong ngày",
    }.get(category, "thiết kế tiện dụng và dễ giới thiệu trên kênh bán hàng")
    return f"{name} là {category_label} phù hợp cho nhu cầu sử dụng hằng ngày, nổi bật ở {highlight}. {source_note}"


def build_description(name: str, category: str, benefits: list[str], specs: list[str], has_sources: bool) -> str:
    proof = "Dữ liệu tham khảo được tổng hợp từ các nguồn công khai." if has_sources else "Thông tin hiện là bản nháp concept và cần được kiểm chứng."
    return (
        f"{name} được định vị cho nhóm khách hàng cần một lựa chọn công nghệ tiện dụng, dễ sử dụng và phù hợp mua sắm trực tuyến. "
        f"Sản phẩm nổi bật ở các điểm như {', '.join(benefits[:3]).lower()}. "
        f"{proof} Khi đăng bán chính thức, cửa hàng nên bổ sung giá, phiên bản cấu hình, chính sách bảo hành và tình trạng hàng để tăng độ tin cậy."
    )


def build_hero_title(name: str, category: str) -> str:
    mapping = {
        "smartphone": f"{name} - Kết nối nhanh, trải nghiệm gọn gàng",
        "tablet": f"{name} - Màn hình rộng cho học tập và giải trí",
        "laptop": f"{name} - Làm việc gọn gàng, học tập hiệu quả",
        "headphone": f"{name} - Tập trung hơn trong từng khoảnh khắc",
        "phone_case": f"{name} - Bảo vệ máy, giữ phong cách riêng",
        "charger": f"{name} - Sạc nhanh gọn cho ngày bận rộn",
        "phone_cable": f"{name} - Kết nối ổn định, dùng bền mỗi ngày",
        "power_bank": f"{name} - Thêm pin cho mọi hành trình",
        "mouse": f"{name} - Thao tác mượt hơn trên mọi bàn làm việc",
        "keyboard": f"{name} - Gõ thoải mái, setup gọn gàng",
        "laptop_sleeve": f"{name} - Mang laptop an tâm hơn",
        "cooling_pad": f"{name} - Giữ laptop thoáng hơn khi làm việc lâu",
        "hdmi_cable": f"{name} - Kết nối màn hình lớn trong vài giây",
        "smartwatch": f"{name} - Theo dõi ngày mới thông minh hơn",
    }
    return mapping.get(category, f"{name} - Nâng cấp trải nghiệm mua sắm của bạn")


def build_why_choose(name: str, benefits: list[str], has_sources: bool) -> str:
    trust = "Nội dung có nguồn tham khảo công khai, giúp khách hàng dễ đối chiếu trước khi ra quyết định." if has_sources else "Nên bổ sung nguồn kiểm chứng và giá bán trước khi dùng cho chiến dịch thật."
    return f"Nên chọn {name} nếu bạn cần {', '.join(benefits[:2]).lower()}. {trust}"


def build_slogan(category: str) -> str:
    mapping = {
        "smartphone": "Kết nối nhanh, trải nghiệm trọn vẹn.",
        "tablet": "Rộng hơn để học, gọn hơn để mang theo.",
        "laptop": "Gọn nhẹ mỗi ngày, hiệu quả mọi việc.",
        "headphone": "Âm thanh rõ nét, tập trung từng phút.",
        "phone_case": "Bảo vệ chắc hơn, dùng máy tự tin hơn.",
        "charger": "Sạc nhanh gọn, sẵn sàng cả ngày.",
        "phone_cable": "Cắm là kết nối, dùng là yên tâm.",
        "power_bank": "Thêm năng lượng cho mọi hành trình.",
        "mouse": "Làm việc mượt hơn, kiểm soát tốt hơn.",
        "keyboard": "Gõ êm tay, làm việc gọn hơn.",
        "laptop_sleeve": "Bảo vệ laptop, đồng hành mỗi ngày.",
        "cooling_pad": "Thoáng máy hơn, làm việc bền bỉ hơn.",
        "hdmi_cable": "Kết nối lớn hơn, trình chiếu rõ hơn.",
        "smartwatch": "Sống chủ động, theo dõi thông minh.",
    }
    return mapping.get(category, "Mua sắm thông minh, trải nghiệm tốt hơn.")


def build_facebook_post(name: str, benefits: list[str], has_sources: bool) -> str:
    note = "Thông tin nên được kiểm chứng theo phiên bản bán ra." if has_sources else "Đây là nội dung concept, phù hợp để chỉnh sửa trước khi đăng bán."
    return f"Khám phá {name}: {', '.join(benefits[:3]).lower()}. {note} Inbox cửa hàng để được tư vấn phiên bản, giá và chính sách bảo hành phù hợp."


def build_tiktok_caption(name: str, category: str) -> str:
    return f"{name} có gì đáng chú ý? Xem nhanh điểm nổi bật trước khi chọn mua."


def build_seo_title(name: str, category: str) -> str:
    labels = {
        "smartphone": "điện thoại",
        "tablet": "máy tính bảng",
        "laptop": "laptop",
        "headphone": "tai nghe",
        "phone_case": "ốp lưng",
        "charger": "củ sạc nhanh",
        "phone_cable": "cáp sạc",
        "power_bank": "sạc dự phòng",
        "mouse": "chuột không dây",
        "keyboard": "bàn phím",
        "laptop_sleeve": "túi chống sốc laptop",
        "cooling_pad": "đế tản nhiệt laptop",
        "hdmi_cable": "cáp HDMI",
        "smartwatch": "đồng hồ thông minh",
    }
    return f"{name} - {labels.get(category, 'sản phẩm công nghệ')} chính hãng, thông tin và ưu đãi"


def build_meta_description(name: str, benefits: list[str]) -> str:
    text = f"Tìm hiểu {name}: {', '.join(benefits[:3]).lower()}. Xem thông tin, lợi ích, FAQ và nguồn tham khảo trước khi mua."
    return text[:155]


def build_keywords(name: str, category: str) -> list[str]:
    category_keywords = {
        "smartphone": ["điện thoại", "smartphone", "điện thoại chính hãng"],
        "tablet": ["máy tính bảng", "tablet", "tablet học tập"],
        "laptop": ["laptop", "laptop văn phòng", "laptop học tập"],
        "headphone": ["tai nghe bluetooth", "tai nghe chống ồn", "tai nghe không dây"],
        "phone_case": ["ốp lưng điện thoại", "ốp chống sốc", "phụ kiện điện thoại"],
        "charger": ["củ sạc nhanh", "sạc USB-C", "phụ kiện điện thoại"],
        "phone_cable": ["cáp sạc", "cáp Type-C", "cáp Lightning"],
        "power_bank": ["sạc dự phòng", "pin dự phòng", "sạc nhanh di động"],
        "mouse": ["chuột không dây", "chuột công thái học", "phụ kiện laptop"],
        "keyboard": ["bàn phím không dây", "bàn phím cơ", "phụ kiện laptop"],
        "laptop_sleeve": ["túi chống sốc laptop", "túi laptop", "phụ kiện laptop"],
        "cooling_pad": ["đế tản nhiệt laptop", "cooling pad", "phụ kiện laptop"],
        "hdmi_cable": ["cáp HDMI", "HDMI 2.1", "cáp màn hình"],
        "smartwatch": ["đồng hồ thông minh", "smartwatch", "thiết bị đeo"],
    }
    return dedupe([name, f"{name} chính hãng", f"{name} giá tốt", *category_keywords.get(category, ["sản phẩm công nghệ"])])[:8]


def build_faq(name: str, category: str, has_sources: bool) -> list[str]:
    source_answer = (
        "Có, nội dung có nguồn tham khảo công khai nhưng vẫn nên đối chiếu lại với nhà bán hàng."
        if has_sources
        else "Chưa đủ. Đây là nội dung concept và cần kiểm chứng trước khi đăng bán."
    )
    return [
        f"{name} phù hợp với ai? Sản phẩm phù hợp với {', '.join(build_target_customers(category)[:2]).lower()} và người cần một lựa chọn công nghệ tiện dụng.",
        f"Thông số của {name} đã chính xác tuyệt đối chưa? {source_answer}",
        f"Có nên dùng nội dung này cho landing page không? Có, nội dung đã có cấu trúc hero, lợi ích, SEO, FAQ và social post để admin chỉnh sửa trước khi xuất bản.",
        "Cần bổ sung gì trước khi bán thật? Nên bổ sung giá, tồn kho, phiên bản cấu hình, bảo hành và hình ảnh sản phẩm thực tế.",
    ]


def build_hashtags(name: str, category: str) -> list[str]:
    compact_name = re.sub(r"[^A-Za-z0-9]", "", plain_text(name).title())
    category_tag = {
        "smartphone": "#DienThoai",
        "tablet": "#MayTinhBang",
        "laptop": "#Laptop",
        "headphone": "#TaiNghe",
        "phone_case": "#OpLung",
        "charger": "#CuSacNhanh",
        "phone_cable": "#CapSac",
        "power_bank": "#SacDuPhong",
        "mouse": "#ChuotKhongDay",
        "keyboard": "#BanPhim",
        "laptop_sleeve": "#TuiChongSoc",
        "cooling_pad": "#DeTanNhiet",
        "hdmi_cable": "#CapHDMI",
        "smartwatch": "#DongHoThongMinh",
    }.get(category, "#CongNghe")
    return [f"#{compact_name[:28]}", category_tag, "#TMDT", "#MuaSamOnline"]


def slugify(value: str) -> str:
    normalized = plain_text(value)
    normalized = normalized.replace("đ", "d")
    normalized = re.sub(r"[^a-z0-9\s-]", "", normalized)
    normalized = re.sub(r"[\s-]+", "-", normalized)
    return normalized.strip("-") or "san-pham"


def plain_text(value: str) -> str:
    value = unicodedata.normalize("NFD", str(value or "").lower().strip())
    return "".join(char for char in value if unicodedata.category(char) != "Mn")


def dedupe(items: list[str]) -> list[str]:
    result: list[str] = []
    for item in items:
        value = str(item).strip()
        if value and value not in result:
            result.append(value)
    return result
