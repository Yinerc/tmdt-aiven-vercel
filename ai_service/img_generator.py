from __future__ import annotations

import os
from pathlib import Path
import re

import torch
from diffusers import StableDiffusionImg2ImgPipeline, StableDiffusionPipeline
from PIL import Image, ImageDraw, ImageFilter, ImageFont


PREFERRED_IMAGE_MODELS = [
    os.getenv("TMDT_IMAGE_MODEL", "").strip(),
    "dreamlike-art/dreamlike-photoreal-2.0",
    "runwayml/stable-diffusion-v1-5",
]
OUTPUT_DIR = Path("outputs/images")
IMAGE_WIDTH = 512
IMAGE_HEIGHT = 512
INFERENCE_STEPS = 28
IMG2IMG_STRENGTH = float(os.getenv("TMDT_IMG2IMG_STRENGTH", "0.62"))

_pipe = None
_img2img_pipe = None


def get_image_pipeline():
    global _pipe, _img2img_pipe
    if _pipe is None:
        if _img2img_pipe is not None:
            _img2img_pipe = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        last_error = None
        for model_name in [name for name in PREFERRED_IMAGE_MODELS if name]:
            try:
                _pipe = StableDiffusionPipeline.from_pretrained(
                    model_name,
                    torch_dtype=dtype,
                    safety_checker=None,
                )
                break
            except Exception as error:
                last_error = error
                _pipe = None

        if _pipe is None:
            raise RuntimeError(f"Cannot load any local image model: {last_error}")

        device = "cuda" if torch.cuda.is_available() else "cpu"
        _pipe = _pipe.to(device)
        _pipe.enable_attention_slicing()
        if hasattr(_pipe, "enable_vae_slicing"):
            _pipe.enable_vae_slicing()
    return _pipe


def get_img2img_pipeline():
    global _pipe, _img2img_pipe
    if _img2img_pipe is None:
        if _pipe is not None:
            _pipe = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        last_error = None
        for model_name in [name for name in PREFERRED_IMAGE_MODELS if name]:
            try:
                _img2img_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
                    model_name,
                    torch_dtype=dtype,
                    safety_checker=None,
                )
                break
            except Exception as error:
                last_error = error
                _img2img_pipe = None

        if _img2img_pipe is None:
            raise RuntimeError(f"Cannot load any local image-to-image model: {last_error}")

        device = "cuda" if torch.cuda.is_available() else "cpu"
        _img2img_pipe = _img2img_pipe.to(device)
        _img2img_pipe.enable_attention_slicing()
        if hasattr(_img2img_pipe, "enable_vae_slicing"):
            _img2img_pipe.enable_vae_slicing()
    return _img2img_pipe


def generate_product_image(product_name: str, slug: str, reference_image_path: str = "") -> str:
    return generate_product_images(product_name, slug, count=1, reference_image_path=reference_image_path)[0]


def generate_product_images(
    product_name: str,
    slug: str,
    count: int = 1,
    reference_image_path: str = "",
    specifications: list[str] | None = None,
    benefits: list[str] | None = None,
) -> list[str]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    category = _infer_image_category(product_name)
    prompt = build_image_prompt(product_name)
    negative_prompt = build_negative_prompt(category)
    safe_count = max(1, min(int(count or 1), 4))
    generated_paths = []
    if reference_image_path:
        return compose_reference_layouts(
            reference_image_path,
            slug,
            safe_count,
            product_name,
            specifications or [],
            benefits or [],
        )

    for index in range(safe_count):
        generator = None
        if torch.cuda.is_available():
            generator = torch.Generator(device="cuda").manual_seed(torch.seed() + index)

        image = get_image_pipeline()(
            prompt,
            negative_prompt=negative_prompt,
            width=IMAGE_WIDTH,
            height=IMAGE_HEIGHT,
            num_inference_steps=INFERENCE_STEPS,
            guidance_scale=8.5,
            generator=generator,
        ).images[0]
        suffix = "" if safe_count == 1 else f"-v{index + 1}"
        output_path = OUTPUT_DIR / f"{slug}{suffix}.png"
        image.save(output_path)
        generated_paths.append(str(output_path).replace("\\", "/"))

    return generated_paths


def compose_reference_layouts(
    reference_image_path: str,
    slug: str,
    count: int,
    product_name: str,
    specifications: list[str],
    benefits: list[str],
) -> list[str]:
    product = extract_product_cutout(reference_image_path)
    layouts = [
        {
            "scale": 0.55,
            "x": 0.68,
            "y": 0.48,
            "bg": ((241, 247, 255), (218, 230, 255)),
            "accent": (37, 99, 235),
            "accent2": (14, 165, 233),
        },
        {
            "scale": 0.55,
            "x": 0.68,
            "y": 0.48,
            "bg": ((251, 244, 255), (229, 232, 255)),
            "accent": (124, 58, 237),
            "accent2": (236, 72, 153),
        },
        {
            "scale": 0.55,
            "x": 0.68,
            "y": 0.48,
            "bg": ((240, 253, 250), (221, 250, 239)),
            "accent": (20, 184, 166),
            "accent2": (34, 197, 94),
        },
        {
            "scale": 0.55,
            "x": 0.68,
            "y": 0.48,
            "bg": ((255, 247, 237), (255, 237, 213)),
            "accent": (249, 115, 22),
            "accent2": (244, 63, 94),
        },
    ]
    paths = []
    for index in range(count):
        layout = layouts[index % len(layouts)]
        image = build_catalog_layout(product, layout, product_name, specifications, benefits)
        suffix = "" if count == 1 else f"-v{index + 1}"
        output_path = OUTPUT_DIR / f"{slug}{suffix}.png"
        image.save(output_path)
        paths.append(str(output_path).replace("\\", "/"))
    return paths


def extract_product_cutout(path: str) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    image.thumbnail((430, 430), Image.Resampling.LANCZOS)
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r > 238 and g > 238 and b > 238:
                pixels[x, y] = (r, g, b, 0)

    bbox = image.getbbox()
    return image.crop(bbox) if bbox else image


def build_catalog_layout(
    product: Image.Image,
    layout: dict,
    product_name: str,
    specifications: list[str],
    benefits: list[str],
) -> Image.Image:
    canvas = gradient_background(layout["bg"][0], layout["bg"][1])
    accent = layout["accent"]
    accent2 = layout["accent2"]

    target_w = int(IMAGE_WIDTH * layout["scale"])
    resized = product.copy()
    resized.thumbnail((target_w, target_w), Image.Resampling.LANCZOS)

    draw_premium_ad_background(canvas, resized, layout, accent, accent2, product_name, specifications, benefits)

    left = int(IMAGE_WIDTH * layout["x"] - resized.width / 2)
    top = int(IMAGE_HEIGHT * layout["y"] - resized.height / 2)

    shadow = Image.new("RGBA", resized.size, (0, 0, 0, 0))
    shadow_alpha = resized.getchannel("A").filter(ImageFilter.GaussianBlur(18))
    shadow.putalpha(shadow_alpha.point(lambda value: int(value * 0.22)))
    canvas.alpha_composite(shadow, (left + 16, top + 20))
    canvas.alpha_composite(resized, (left, top))

    return canvas.convert("RGB")


def draw_premium_ad_background(
    canvas: Image.Image,
    product: Image.Image,
    layout: dict,
    accent: tuple[int, int, int],
    accent2: tuple[int, int, int],
    product_name: str,
    specifications: list[str],
    benefits: list[str],
) -> None:
    draw = ImageDraw.Draw(canvas, "RGBA")

    draw_leaf_cluster(draw)
    draw_marble_podium(draw)
    draw_left_info_panel(draw, accent, accent2, product_name, specifications, benefits)

    backdrop = product.copy()
    backdrop.thumbnail((390, 390), Image.Resampling.LANCZOS)
    backdrop = backdrop.filter(ImageFilter.GaussianBlur(26))
    backdrop_alpha = backdrop.getchannel("A").point(lambda value: int(value * 0.09))
    backdrop.putalpha(backdrop_alpha)
    back_left = int(IMAGE_WIDTH * layout["x"] - backdrop.width / 2 + 12)
    back_top = int(IMAGE_HEIGHT * layout["y"] - backdrop.height / 2 - 12)
    canvas.alpha_composite(backdrop, (back_left, back_top))

    glow = Image.new("RGBA", (IMAGE_WIDTH, IMAGE_HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow, "RGBA")
    glow_draw.ellipse((205, 30, 580, 392), fill=(*accent, 20))
    glow_draw.ellipse((255, 170, 570, 510), fill=(*accent2, 14))
    glow = glow.filter(ImageFilter.GaussianBlur(46))
    canvas.alpha_composite(glow)

    floor_shadow = Image.new("RGBA", (IMAGE_WIDTH, IMAGE_HEIGHT), (0, 0, 0, 0))
    floor_draw = ImageDraw.Draw(floor_shadow, "RGBA")
    floor_draw.ellipse((248, 388, 494, 448), fill=(15, 23, 42, 24))
    floor_shadow = floor_shadow.filter(ImageFilter.GaussianBlur(20))
    canvas.alpha_composite(floor_shadow)


def draw_left_info_panel(
    draw: ImageDraw.ImageDraw,
    accent: tuple[int, int, int],
    accent2: tuple[int, int, int],
    product_name: str,
    specifications: list[str],
    benefits: list[str],
) -> None:
    title_font = load_font(30, bold=True)
    subtitle_font = load_font(20, bold=True)
    body_font = load_font(15)
    small_font = load_font(13, bold=True)

    y_title = 68
    for line in _poster_title_lines(product_name):
        draw.text((30, y_title), line, fill=(17, 24, 39), font=title_font)
        y_title += 36

    badge_text = _poster_badge(product_name)
    badge_width = min(max(_text_width(draw, badge_text, subtitle_font) + 28, 120), 180)
    draw.rounded_rectangle((30, 160, 30 + badge_width, 192), radius=16, fill=(55, 65, 81, 230))
    draw.text((44, 165), _fit_text(draw, badge_text, subtitle_font, badge_width - 28), fill=(255, 255, 255), font=subtitle_font)

    y = 238
    for label, desc in _poster_features(product_name, specifications, benefits):
        draw.ellipse((34, y, 66, y + 32), fill=(17, 24, 39, 220))
        draw.rounded_rectangle((43, y + 8, 57, y + 22), radius=3, outline=(255, 255, 255, 230), width=2)
        draw.text((80, y - 1), _fit_text(draw, label, subtitle_font, 130), fill=(17, 24, 39), font=subtitle_font)
        draw.text((80, y + 23), _fit_text(draw, desc, body_font, 130), fill=(75, 85, 99), font=body_font)
        draw.line((30, y + 52, 205, y + 52), fill=(148, 163, 184, 95), width=1)
        y += 70

    draw.rounded_rectangle((18, 426, 220, 500), radius=22, fill=(255, 255, 255, 180))
    services = [("BH", "Bảo hành"), ("7N", "Đổi trả"), ("GH", "Giao hàng")]
    x = 38
    for code, label in services:
        draw.ellipse((x + 12, 440, x + 42, 470), outline=(17, 24, 39, 210), width=2)
        draw.text((x + 17, 446), code, fill=(17, 24, 39), font=small_font)
        draw.text((x, 474), label, fill=(17, 24, 39), font=small_font)
        x += 64


def _poster_title_lines(product_name: str) -> list[str]:
    clean = re.sub(r"\s+", " ", product_name).strip()
    clean = re.sub(
        r"\b(laptop|dien thoai|điện thoại|smartphone|tablet|may tinh bang|máy tính bảng)\b",
        "",
        clean,
        flags=re.I,
    ).strip()
    words = clean.split()
    if not words:
        return ["Sản phẩm", "mới"]

    category = _infer_image_category(product_name)
    if category == "laptop":
        brand = _first_matching(words, ["lenovo", "asus", "acer", "dell", "hp", "msi", "macbook", "apple"]) or words[0]
        rest = " ".join([word for word in words if word.lower() != brand.lower()]) or "Laptop"
        return [_title_case_brand(brand), _fit_line_text(rest, 14)]
    if category == "smartphone":
        brand = _first_matching(words, ["iphone", "samsung", "xiaomi", "oppo", "vivo", "realme"]) or words[0]
        rest = " ".join(words[1:]) if brand.lower() == words[0].lower() else " ".join([word for word in words if word.lower() != brand.lower()])
        return [_title_case_brand(brand), _fit_line_text(rest or "Smartphone", 14)]
    if category == "tablet":
        brand = _first_matching(words, ["ipad", "samsung", "xiaomi", "lenovo"]) or words[0]
        rest = " ".join([word for word in words if word.lower() != brand.lower()]) or "Tablet"
        return [_title_case_brand(brand), _fit_line_text(rest, 14)]

    return [_fit_line_text(clean, 13), _poster_badge(product_name)]


def _poster_badge(product_name: str) -> str:
    category = _infer_image_category(product_name)
    if category == "laptop":
        return "Gaming laptop" if re.search(r"loq|rog|tuf|nitro|predator|gaming", product_name, re.I) else "Laptop"
    if category == "smartphone":
        return "Smartphone"
    if category == "tablet":
        return "Tablet"
    if category == "headphone":
        return "Audio"
    if category == "smartwatch":
        return "Smartwatch"
    return "Sản phẩm mới"


def _poster_features(product_name: str, specifications: list[str], benefits: list[str]) -> list[tuple[str, str]]:
    category = _infer_image_category(product_name)
    specs = [str(item) for item in specifications if str(item).strip()]
    found: list[tuple[str, str]] = []

    if category == "laptop":
        wanted = [
            ("CPU", r"\b(cpu|chip|processor|intel|amd|ryzen|core i[3579])\b"),
            ("RAM", r"\b(ram|memory)\b"),
            ("SSD", r"\b(ssd|storage|ổ cứng|bo nho|bộ nhớ)\b"),
            ("GPU", r"\b(gpu|rtx|gtx|graphics|nvidia|radeon)\b"),
            ("Màn hình", r"\b(display|screen|màn hình|inch|hz)\b"),
        ]
        fallback = [("CPU/GPU", "Hiệu năng mạnh"), ("RAM/SSD", "Đa nhiệm mượt"), ("Màn hình", "Trải nghiệm rõ nét")]
    elif category == "tablet":
        wanted = [
            ("Màn hình", r"\b(display|screen|màn hình|inch)\b"),
            ("Chip", r"\b(chip|processor|cpu|m1|m2|snapdragon)\b"),
            ("Pin", r"\b(pin|battery|mah)\b"),
            ("Kết nối", r"\b(wifi|5g|lte|bluetooth)\b"),
        ]
        fallback = [("Màn hình", "Hiển thị rộng"), ("Pin", "Dùng cả ngày"), ("Gọn nhẹ", "Dễ mang theo")]
    elif category == "smartphone":
        wanted = [
            ("Camera", r"\b(camera|mp|megapixel)\b"),
            ("Chip", r"\b(chip|processor|cpu|a16|a17|snapdragon|exynos)\b"),
            ("Màn hình", r"\b(display|screen|màn hình|oled|amoled|inch|hz)\b"),
            ("Pin", r"\b(pin|battery|mah|sạc)\b"),
            ("Bộ nhớ", r"\b(storage|rom|gb|tb|bộ nhớ)\b"),
        ]
        fallback = [("Camera", "Chụp ảnh sắc nét"), ("Chip", "Hiệu năng mạnh"), ("Màn hình", "Hiển thị cao cấp")]
    else:
        wanted = [
            ("Kết nối", r"\b(bluetooth|wifi|usb|type-c|wireless)\b"),
            ("Pin", r"\b(pin|battery|mah)\b"),
            ("Thiết kế", r"\b(design|thiết kế|gọn|nhẹ)\b"),
        ]
        fallback = [("Tiện dụng", "Dễ sử dụng"), ("Tương thích", "Phù hợp nhiều thiết bị"), ("Bền bỉ", "Dùng hằng ngày")]

    used_indexes: set[int] = set()
    for label, pattern in wanted:
        matched = False
        for index, spec in enumerate(specs):
            if index in used_indexes:
                continue
            if re.search(pattern, spec, re.I):
                found.append((label, _spec_value(label, spec, specs, product_name)))
                used_indexes.add(index)
                matched = True
                break
        if not matched:
            cross_spec = _extract_cross_spec_value(label, specs, product_name)
            if cross_spec:
                found.append((label, cross_spec))
        if len(found) >= 3:
            break

    if len(found) < 3:
        for benefit in benefits:
            if len(found) >= 3:
                break
            found.append(("Lợi ích", _fit_line_text(str(benefit), 18)))

    while len(found) < 3:
        found.append(fallback[len(found)])

    return found[:3]


def _spec_value(label: str, spec: str, all_specs: list[str] | None = None, product_name: str = "") -> str:
    text = re.sub(r"\s+", " ", spec).strip(" -•")
    if ":" in text:
        text = text.split(":", 1)[1].strip()
    text = re.sub(r"\b(cần kiểm chứng|can kiem chung)\b", "", text, flags=re.I).strip(" -")
    normalized_label = _remove_vietnamese_accents(label).lower()
    normalized_text = _remove_vietnamese_accents(text).lower()

    patterns_by_label = {
        "cpu": [
            r"(intel\s+core\s+i[3579][- ]?\w*)",
            r"(core\s+i[3579][- ]?\w*)",
            r"(amd\s+ryzen\s+[3579][- ]?\w*)",
            r"(ryzen\s+[3579][- ]?\w*)",
            r"(apple\s+m[1234]\w*)",
            r"(snapdragon\s+\w+)",
            r"(exynos\s+\w+)",
            r"(a1[5-9]\s?\w*)",
        ],
        "chip": [
            r"(apple\s+m[1234]\w*)",
            r"(snapdragon\s+\w+)",
            r"(exynos\s+\w+)",
            r"(a1[5-9]\s?\w*)",
            r"(intel\s+core\s+i[3579][- ]?\w*)",
            r"(ryzen\s+[3579][- ]?\w*)",
        ],
        "ram": [r"(\d{1,3}\s?gb\s+ram)", r"(ram\s+\d{1,3}\s?gb)", r"(\d{1,3}\s?gb)"],
        "ssd": [r"(\d{3,4}\s?gb\s+ssd)", r"(\d\s?tb\s+ssd)", r"(ssd\s+\d{3,4}\s?gb)", r"(ssd\s+\d\s?tb)"],
        "gpu": [r"(rtx\s?\d{4})", r"(gtx\s?\d{4})", r"(nvidia\s+\w+\s?\d{3,4})", r"(radeon\s+\w+\s?\d*)"],
        "man hinh": [
            r"(\d{2}(?:\.\d)?\s?(?:inch|\"))",
            r"(\d{2,3}\s?hz)",
            r"(oled|amoled|ips|fhd|qhd|retina|super retina)",
        ],
        "camera": [r"(\d{1,3}\s?mp)", r"(camera\s+\d{1,3}\s?mp)"],
        "pin": [r"(\d{3,5}\s?mah)", r"(\d{1,3}\s?w)", r"(sạc nhanh|fast charging)"],
        "bo nho": [r"(\d{2,4}\s?gb)", r"(\d\s?tb)"],
        "ket noi": [r"(wifi\s?\d?)", r"(5g)", r"(lte)", r"(bluetooth\s?\d(?:\.\d)?)", r"(type-c|usb-c)"],
    }

    for key, patterns in patterns_by_label.items():
        if key in normalized_label:
            for pattern in patterns:
                match = re.search(pattern, normalized_text, re.I)
                if match:
                    return _clean_short_spec(match.group(1))

    concise = _extract_first_concise_spec(text)
    if concise:
        return concise

    cross_spec = _extract_cross_spec_value(label, all_specs or [], product_name)
    if cross_spec:
        return cross_spec

    fallback_by_label = {
        "cpu": "Hiệu năng mạnh",
        "chip": "Hiệu năng mạnh",
        "ram": "Đa nhiệm mượt",
        "ssd": "Lưu trữ nhanh",
        "gpu": "Đồ họa mạnh",
        "man hinh": "Hiển thị rõ nét",
        "camera": "Chụp ảnh sắc nét",
        "pin": "Dùng bền bỉ",
        "bo nho": "Lưu trữ rộng",
        "ket noi": "Kết nối nhanh",
    }
    for key, fallback in fallback_by_label.items():
        if key in normalized_label:
            return fallback
    return "Thông số nổi bật"


def _extract_first_concise_spec(text: str) -> str:
    candidates = [
        r"(rtx\s?\d{4})",
        r"(gtx\s?\d{4})",
        r"(core\s+i[3579][- ]?\w*)",
        r"(ryzen\s+[3579][- ]?\w*)",
        r"(\d{1,4}\s?(?:gb|tb|mah|mp|hz|w))",
        r"(oled|amoled|ips|fhd|qhd|retina)",
    ]
    normalized = _remove_vietnamese_accents(text).lower()
    for pattern in candidates:
        match = re.search(pattern, normalized, re.I)
        if match:
            return _clean_short_spec(match.group(1))
    return ""


def _extract_cross_spec_value(label: str, all_specs: list[str], product_name: str) -> str:
    normalized_label = _remove_vietnamese_accents(label).lower()
    joined = _remove_vietnamese_accents(" | ".join(str(item) for item in all_specs)).lower()
    product_fallback = _known_mobile_tablet_spec(product_name, normalized_label)

    if "ssd" in normalized_label:
        for pattern in [
            r"(\d\s?tb)\s*(?:ssd|nvme|pcie)",
            r"(\d{3,4}\s?gb)\s*(?:ssd|nvme|pcie)",
            r"(?:ssd|nvme|pcie)\D{0,24}(\d\s?tb)",
            r"(?:ssd|nvme|pcie)\D{0,24}(\d{3,4}\s?gb)",
        ]:
            match = re.search(pattern, joined, re.I)
            if match:
                return f"{_clean_short_spec(match.group(1))} SSD"
        if re.search(r"\bloq\b|thinkpad|ideapad|legion|vivobook|zenbook|nitro|tuf|rog", product_name, re.I):
            return "512GB SSD"

    if "man hinh" in normalized_label:
        size = ""
        refresh = ""
        panel = ""
        for pattern in [r"(\d{2}(?:[.,]\d)?\s?(?:inch|\"))", r"(\d{2}(?:[.,]\d)?\s?(?:inches))"]:
            match = re.search(pattern, joined, re.I)
            if match:
                size = _clean_short_spec(match.group(1).replace(",", "."))
                break
        match = re.search(r"(\d{2,3}\s?hz)", joined, re.I)
        if match:
            refresh = _clean_short_spec(match.group(1))
        match = re.search(r"\b(oled|amoled|ips|fhd|qhd|uhd|retina|super retina)\b", joined, re.I)
        if match:
            panel = _clean_short_spec(match.group(1))
        value = " ".join(part for part in [size, panel, refresh] if part)
        if value:
            return _fit_line_text(value, 18)
        if product_fallback:
            return product_fallback
        if re.search(r"\bloq\b|legion|nitro|tuf|rog", product_name, re.I):
            return "15.6\" FHD"

    if any(key in normalized_label for key in ["camera", "chip", "pin", "bo nho", "ket noi"]):
        mobile_value = _extract_mobile_tablet_value(normalized_label, joined)
        if mobile_value:
            return mobile_value
        if product_fallback:
            return product_fallback

    if "ram" in normalized_label:
        for pattern in [r"(?:ram)\D{0,16}(\d{1,3}\s?gb)", r"(\d{1,3}\s?gb)\s*(?:ram|ddr[45])"]:
            match = re.search(pattern, joined, re.I)
            if match:
                return f"{_clean_short_spec(match.group(1))} RAM"

    if "gpu" in normalized_label:
        match = re.search(r"\b(rtx\s?\d{4}|gtx\s?\d{4}|radeon\s+\w+\s?\d*)\b", joined, re.I)
        if match:
            return _clean_short_spec(match.group(1))

    if "cpu" in normalized_label or "chip" in normalized_label:
        match = re.search(r"\b(intel\s+core\s+i[3579][- ]?\w*|core\s+i[3579][- ]?\w*|amd\s+ryzen\s+[3579][- ]?\w*|ryzen\s+[3579][- ]?\w*)\b", joined, re.I)
        if match:
            return _clean_short_spec(match.group(1))
        if product_fallback:
            return product_fallback

    return ""


def _extract_mobile_tablet_value(normalized_label: str, joined: str) -> str:
    if "camera" in normalized_label:
        patterns = [
            r"(\d{1,3}\s?mp)\s*(?:camera|main|wide|chinh|chính)",
            r"(?:camera|main|wide|chinh|chính)\D{0,18}(\d{1,3}\s?mp)",
            r"(\d{1,3}\s?mp)",
        ]
    elif "chip" in normalized_label:
        patterns = [
            r"\b(a1[3-9]\s?(?:bionic|pro)?)\b",
            r"\b(snapdragon\s+\d\w*\s?(?:gen\s?\d)?)\b",
            r"\b(exynos\s+\d{4})\b",
            r"\b(tensor\s+g\d)\b",
            r"\b(apple\s+m[1234])\b",
        ]
    elif "pin" in normalized_label:
        patterns = [
            r"(\d{3,5}\s?mah)",
            r"(\d{1,3}\s?w)\s*(?:charging|sac|sạc)",
        ]
    elif "bo nho" in normalized_label:
        patterns = [
            r"(\d{2,4}\s?gb)\s*(?:storage|rom|bo nho|bộ nhớ)",
            r"(?:storage|rom|bo nho|bộ nhớ)\D{0,16}(\d{2,4}\s?gb)",
            r"(\d{2,4}\s?gb)",
        ]
    elif "ket noi" in normalized_label:
        patterns = [
            r"\b(wi-?fi\s?\d)\b",
            r"\b(5g)\b",
            r"\b(lte)\b",
            r"\b(bluetooth\s?\d(?:\.\d)?)\b",
            r"\b(usb-c|type-c)\b",
        ]
    else:
        patterns = []

    for pattern in patterns:
        match = re.search(pattern, joined, re.I)
        if match:
            return _clean_short_spec(match.group(1))
    return ""


def _known_mobile_tablet_spec(product_name: str, normalized_label: str) -> str:
    name = _remove_vietnamese_accents(product_name).lower()
    presets = [
        (r"iphone\s*15\s*pro\s*max", {"camera": "48MP", "chip": "A17 Pro", "man hinh": "6.7\" OLED", "pin": "4422mAh", "bo nho": "256GB"}),
        (r"iphone\s*15\s*pro", {"camera": "48MP", "chip": "A17 Pro", "man hinh": "6.1\" OLED", "pin": "3274mAh", "bo nho": "128GB"}),
        (r"iphone\s*15\s*plus", {"camera": "48MP", "chip": "A16 Bionic", "man hinh": "6.7\" OLED", "pin": "4383mAh", "bo nho": "128GB"}),
        (r"iphone\s*15", {"camera": "48MP", "chip": "A16 Bionic", "man hinh": "6.1\" OLED", "pin": "3349mAh", "bo nho": "128GB"}),
        (r"samsung.*s22\s*ultra|galaxy\s*s22\s*ultra", {"camera": "108MP", "chip": "Snapdragon 8 Gen 1", "man hinh": "6.8\" AMOLED", "pin": "5000mAh", "bo nho": "256GB"}),
        (r"samsung.*s23\s*ultra|galaxy\s*s23\s*ultra", {"camera": "200MP", "chip": "Snapdragon 8 Gen 2", "man hinh": "6.8\" AMOLED", "pin": "5000mAh", "bo nho": "256GB"}),
        (r"samsung.*s24\s*ultra|galaxy\s*s24\s*ultra", {"camera": "200MP", "chip": "Snapdragon 8 Gen 3", "man hinh": "6.8\" AMOLED", "pin": "5000mAh", "bo nho": "256GB"}),
        (r"xiaomi\s*13t\s*pro", {"camera": "50MP", "chip": "Dimensity 9200+", "man hinh": "144Hz AMOLED", "pin": "5000mAh", "bo nho": "256GB"}),
        (r"ipad\s*air\s*5|ipad\s*air.*m1", {"camera": "12MP", "chip": "Apple M1", "man hinh": "10.9\" Retina", "pin": "Dùng cả ngày", "bo nho": "64GB", "ket noi": "Wi-Fi 6"}),
        (r"ipad\s*pro.*m2|ipad\s*pro", {"camera": "12MP", "chip": "Apple M2", "man hinh": "Liquid Retina", "pin": "Dùng cả ngày", "bo nho": "128GB", "ket noi": "Wi-Fi 6E"}),
        (r"galaxy\s*tab\s*s9", {"camera": "13MP", "chip": "Snapdragon 8 Gen 2", "man hinh": "AMOLED 120Hz", "pin": "8400mAh", "bo nho": "128GB", "ket noi": "Wi-Fi 6E"}),
    ]

    for pattern, values in presets:
        if re.search(pattern, name, re.I):
            for key, value in values.items():
                if key in normalized_label:
                    return value

    generic = {}
    if "iphone" in name:
        generic = {"camera": "48MP", "chip": "A16/A17", "man hinh": "OLED", "pin": "Pin cả ngày", "bo nho": "128GB"}
    elif "samsung" in name or "galaxy" in name:
        generic = {"camera": "50MP+", "chip": "Snapdragon", "man hinh": "AMOLED", "pin": "5000mAh", "bo nho": "128GB"}
    elif "xiaomi" in name or "redmi" in name:
        generic = {"camera": "50MP", "chip": "Snapdragon", "man hinh": "AMOLED", "pin": "5000mAh", "bo nho": "256GB"}
    elif "ipad" in name:
        generic = {"camera": "12MP", "chip": "Apple M-series", "man hinh": "Retina", "pin": "Dùng cả ngày", "bo nho": "64GB", "ket noi": "Wi-Fi"}
    elif "tablet" in name or "tab" in name:
        generic = {"camera": "13MP", "chip": "Hiệu năng tốt", "man hinh": "Màn hình lớn", "pin": "Pin lớn", "bo nho": "128GB", "ket noi": "Wi-Fi"}

    for key, value in generic.items():
        if key in normalized_label:
            return value
    return ""


def _clean_short_spec(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    replacements = {
        "gb": "GB",
        "tb": "TB",
        "mah": "mAh",
        "mp": "MP",
        "hz": "Hz",
        "w": "W",
        "ssd": "SSD",
        "ram": "RAM",
        "rtx": "RTX",
        "gtx": "GTX",
        "fhd": "FHD",
        "qhd": "QHD",
        "oled": "OLED",
        "amoled": "AMOLED",
        "ips": "IPS",
        "wifi": "Wi-Fi",
    }
    words = []
    for word in text.split():
        lower = word.lower()
        words.append(replacements.get(lower, word[:1].upper() + word[1:] if word.isalpha() else word.upper()))
    return " ".join(words[:4])


def _remove_vietnamese_accents(text: str) -> str:
    replacements = {
        "àáạảãâầấậẩẫăằắặẳẵ": "a",
        "èéẹẻẽêềếệểễ": "e",
        "ìíịỉĩ": "i",
        "òóọỏõôồốộổỗơờớợởỡ": "o",
        "ùúụủũưừứựửữ": "u",
        "ỳýỵỷỹ": "y",
        "đ": "d",
    }
    result = text.lower()
    for chars, replacement in replacements.items():
        for char in chars:
            result = result.replace(char, replacement)
    return result


def _first_matching(words: list[str], candidates: list[str]) -> str:
    for candidate in candidates:
        for word in words:
            if word.lower() == candidate:
                return word
    return ""


def _title_case_brand(text: str) -> str:
    upper = {"loq", "rog", "tuf", "hp", "msi", "lg"}
    return text.upper() if text.lower() in upper else text[:1].upper() + text[1:]


def _fit_line_text(text: str, max_chars: int) -> str:
    text = re.sub(r"\s+", " ", str(text)).strip()
    return text if len(text) <= max_chars else text[: max_chars - 1].rstrip() + "…"


def _text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def _fit_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> str:
    text = str(text)
    if _text_width(draw, text, font) <= max_width:
        return text
    while len(text) > 2 and _text_width(draw, text + "…", font) > max_width:
        text = text[:-1]
    return text.rstrip() + "…"


def draw_marble_podium(draw: ImageDraw.ImageDraw) -> None:
    draw.rounded_rectangle((190, 384, 520, 520), radius=36, fill=(248, 250, 252, 235))
    draw.ellipse((190, 346, 520, 438), fill=(255, 255, 255, 245), outline=(226, 232, 240, 200), width=2)
    for offset in [218, 266, 322, 384, 438]:
        draw.arc((offset, 386, offset + 92, 464), 210, 330, fill=(203, 213, 225, 90), width=1)
    draw.line((190, 432, 520, 432), fill=(203, 213, 225, 110), width=2)


def draw_leaf_cluster(draw: ImageDraw.ImageDraw) -> None:
    greens = [(22, 101, 52, 120), (34, 197, 94, 92), (21, 128, 61, 105)]
    leaves = [
        (430, -24, 506, 54, 24),
        (468, 28, 540, 104, -18),
        (430, 74, 506, 148, 18),
    ]
    for index, (x1, y1, x2, y2, _angle) in enumerate(leaves):
        draw.ellipse((x1, y1, x2, y2), fill=greens[index % len(greens)])


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient_background(top_color: tuple[int, int, int], bottom_color: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (IMAGE_WIDTH, IMAGE_HEIGHT), top_color + (255,))
    draw = ImageDraw.Draw(image)
    for y in range(IMAGE_HEIGHT):
        ratio = y / max(IMAGE_HEIGHT - 1, 1)
        color = tuple(int(top_color[i] * (1 - ratio) + bottom_color[i] * ratio) for i in range(3))
        draw.line((0, y, IMAGE_WIDTH, y), fill=color + (255,))
    return image


def load_reference_image(path: str) -> Image.Image:
    image = Image.open(path).convert("RGB")
    source_ratio = image.width / image.height
    target_ratio = IMAGE_WIDTH / IMAGE_HEIGHT
    if source_ratio > target_ratio:
        new_height = IMAGE_HEIGHT
        new_width = int(new_height * source_ratio)
    else:
        new_width = IMAGE_WIDTH
        new_height = int(new_width / source_ratio)
    image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    left = (new_width - IMAGE_WIDTH) // 2
    top = (new_height - IMAGE_HEIGHT) // 2
    return image.crop((left, top, left + IMAGE_WIDTH, top + IMAGE_HEIGHT))


def build_image_prompt(product_name: str) -> str:
    category = _infer_image_category(product_name)
    if category == "headphone":
        product_phrase = (
            "only one pair of premium wireless over-ear headphones, black matte finish, "
            "soft ear cushions, sleek headband, isolated product, no people, no packaging"
        )
    elif category == "laptop":
        product_phrase = (
            "only one modern slim laptop computer, open screen, clean keyboard, metallic body, "
            "isolated product, no people, no packaging"
        )
    elif category == "smartphone":
        product_phrase = (
            "only a modern premium smartphone product, front and back view of the phone, "
            "realistic glass and aluminum body, black or dark blue color, dual rear camera lenses, "
            "thin black bezel, clean blank screen, isolated product, no case, no hand, no person, no packaging"
        )
    elif category == "smartwatch":
        product_phrase = (
            "only one modern smartwatch product, rounded display, silicone strap, premium finish, "
            "isolated product, no people, no packaging"
        )
    else:
        product_phrase = f"modern ecommerce product based on {product_name}"

    return (
        "realistic ecommerce product catalog photo, product-only studio shot, single product focus, "
        "clean light gray seamless background, centered composition, soft studio lighting, soft shadow, "
        "sharp focus, high detail, premium online store catalog photography, no text, no logo, "
        f"{product_phrase}"
    )


def build_negative_prompt(category: str) -> str:
    common = (
        "low quality, blurry, noisy, pixelated, watermark, logo, brand logo, apple logo, "
        "text, letters, numbers, poster, banner, sign, label, badge, sticker, packaging, box, "
        "food, drink, coffee, snack bag, cosmetic bottle, bottle, cup, car, vehicle, outdoor scene, "
        "human, person, woman, man, face, portrait, hands, fingers, model, lifestyle photo, "
        "collage, split screen, multiple panels, copied layout, same composition as reference image, "
        "distorted, deformed, duplicate, extra objects, broken product, cropped product"
    )
    if category == "smartphone":
        return (
            common
            + ", tablet, laptop, camera, microphone, tripod, washing machine, appliance, "
            + "phone case, protective case, app screenshot, website screenshot, UI mockup"
        )
    return common


def _infer_image_category(product_name: str) -> str:
    name = product_name.lower()
    if re.search(r"tai nghe|headphone|earbud|earphone|wh-1000|wf-1000|bluetooth", name):
        return "headphone"
    if re.search(r"laptop|notebook|macbook|lenovo|loq|thinkpad|ideapad|asus|acer|dell|hp|msi", name):
        return "laptop"
    if re.search(r"ipad|tablet|galaxy tab|máy tính bảng|may tinh bang", name):
        return "tablet"
    if re.search(r"iphone|phone|smartphone|samsung|xiaomi|oppo|vivo|realme|điện thoại|dien thoai", name):
        return "smartphone"
    if re.search(r"watch|smartwatch|đồng hồ|dong ho", name):
        return "smartwatch"
    if re.search(r"sạc|sac|charger|cáp|cap|cable|hub|adapter|mouse|chuột|ban phim|bàn phím", name):
        return "accessory"
    return "general"
