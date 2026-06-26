from __future__ import annotations

from crawler import search_product_sources


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
        sources = search_product_sources(product_name, 5)
        print(f"\n=== {category}: {product_name} ===", flush=True)
        print(f"sources={len(sources)}", flush=True)
        for source in sources[:3]:
            print(f"- {safe_text(source.title)} | {source.url}", flush=True)
        if not sources:
            failures.append((category, product_name))

    print("\n=== SUMMARY ===", flush=True)
    if failures:
        print(f"FAIL: {len(failures)} products have no sources", flush=True)
        for item in failures:
            print(item, flush=True)
        return 1
    print("PASS: all tested products have sources", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
