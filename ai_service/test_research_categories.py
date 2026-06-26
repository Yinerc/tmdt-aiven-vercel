from __future__ import annotations

import sys

from crawler import search_product_sources
from generator import generate_product_content


TEST_PRODUCTS = [
    ("phone", "samsung s22 ultra"),
    ("phone", "iphone 15"),
    ("phone", "xiaomi 13t pro"),
    ("tablet", "ipad air 5"),
    ("tablet", "samsung galaxy tab s9"),
    ("laptop", "macbook air m2"),
    ("laptop", "dell xps 13 9315"),
    ("phone_accessory", "anker nano 20w charger"),
    ("phone_accessory", "baseus 20000mah power bank"),
    ("laptop_accessory", "logitech mx master 3s"),
    ("laptop_accessory", "ugreen usb c hub 7 in 1"),
]


def safe_text(value: str) -> str:
    return value.encode("ascii", errors="ignore").decode("ascii")


def main() -> int:
    failures = []
    for category, product_name in TEST_PRODUCTS:
        print(f"\n=== {category}: {product_name} ===")
        sources = search_product_sources(product_name, 5)
        print(f"sources={len(sources)}")
        for source in sources[:3]:
            print(f"- {safe_text(source.title)} | {source.url}")

        if not sources:
            failures.append((category, product_name, "no_sources"))
            continue

        content = generate_product_content(product_name, sources)
        specs = content.get("specifications") or []
        summary = content.get("productSummary") or ""
        print(f"summary={safe_text(summary[:180])}")
        print(f"spec_count={len(specs)}")
        for spec in specs[:5]:
            print(f"  * {safe_text(str(spec))}")

        if not specs:
            failures.append((category, product_name, "no_specs"))
        elif all("Can kiem chung" in safe_text(str(spec)) or "Cần kiểm chứng" in str(spec) for spec in specs):
            failures.append((category, product_name, "only_unverified_specs"))

    print("\n=== SUMMARY ===")
    if not failures:
        print("PASS: all products have sources and at least some specs.")
        return 0

    print("FAILURES:")
    for item in failures:
        print(item)
    return 1


if __name__ == "__main__":
    sys.exit(main())
