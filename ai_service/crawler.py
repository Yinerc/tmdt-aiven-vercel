from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import parse_qs, quote_plus, unquote, urlparse
import re

import requests
import trafilatura
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from duckduckgo_search.exceptions import DuckDuckGoSearchException


MAX_SOURCE_CHARS = 3500
BAD_CONTENT_PATTERNS = [
    "please click here if the page does not redirect automatically",
    "enable javascript",
    "access denied",
    "captcha",
    "robot check",
]


@dataclass
class WebSource:
    title: str
    url: str
    content: str


def search_product_sources(product_name: str, max_results: int = 5) -> list[WebSource]:
    """Search public web pages and extract readable text for product research."""
    search_name = normalize_product_name(product_name)
    results: list[WebSource] = []
    search_results = []
    queries = build_search_queries(search_name)

    seen_candidate_urls = set()
    for query in queries[:3]:
        candidates = search_bing(query, min(max_results, 3))
        if not candidates:
            candidates = search_duckduckgo(query, min(max_results, 3))
        for item in candidates:
            url = unwrap_search_url(item.get("href") or item.get("url") or "")
            if not url or url in seen_candidate_urls:
                continue
            seen_candidate_urls.add(url)
            item["href"] = url
            search_results.append(item)
        if len(search_results) >= max_results * 3:
            break

    ranked_results = sorted(
        search_results,
        key=lambda item: relevance_score(
            search_name,
            item.get("title") or "",
            item.get("body") or item.get("snippet") or item.get("description") or "",
            item.get("href") or item.get("url") or "",
        ),
        reverse=True,
    )

    seen_urls = set()
    for item in ranked_results:
        url = item.get("href") or item.get("url")
        title = item.get("title") or product_name
        snippet = item.get("body") or item.get("snippet") or item.get("description") or ""
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)

        content = fetch_page_text(url)
        if content and is_useful_content(content, search_name):
            results.append(WebSource(title=title, url=url, content=content[:MAX_SOURCE_CHARS]))
        elif is_relevant_search_result(title, snippet, search_name):
            fallback_content = " ".join(part for part in [title, snippet] if part).strip()
            results.append(WebSource(title=title, url=url, content=fallback_content[:MAX_SOURCE_CHARS]))
        if len(results) >= max_results:
            break

    trusted_results = search_trusted_product_sources(search_name, max_results)
    known_urls = {item.url for item in results}
    for trusted in trusted_results:
        if trusted.url not in known_urls:
            results.append(trusted)
            known_urls.add(trusted.url)
        if len(results) >= max_results:
            break

    return results


def build_search_queries(product_name: str) -> list[str]:
    category = infer_query_category(product_name)
    queries = [
        f'"{product_name}" thong so ky thuat',
        f'"{product_name}" specifications',
        f'"{product_name}" review specs',
    ]
    if category in ["phone", "tablet"]:
        queries.extend([
            f'"{product_name}" full specifications gsmarena',
            f'"{product_name}" device specifications',
            f'"{product_name}" official specs',
        ])
    elif category == "laptop":
        queries.extend([
            f'"{product_name}" setup and specifications',
            f'"{product_name}" notebookcheck',
            f'"{product_name}" official specifications',
        ])
    else:
        queries.extend([
            f'"{product_name}" official specifications',
            f'"{product_name}" manual specs',
            f'"{product_name}" product specifications',
        ])
    return queries


def normalize_product_name(product_name: str) -> str:
    value = normalize_query(product_name)
    replacements = [
        (r"\bss\b", "samsung"),
        (r"\bsam sung\b", "samsung"),
        (r"\bs22 ultra\b", "samsung galaxy s22 ultra"),
        (r"\bip\s?15\b", "iphone 15"),
        (r"\biphone15\b", "iphone 15"),
        (r"\bipad air5\b", "ipad air 5"),
        (r"\bmb air m2\b", "macbook air m2"),
        (r"\bmac air m2\b", "macbook air m2"),
        (r"\bxps 13 9315\b", "dell xps 13 9315"),
        (r"\bmx master 3s\b", "logitech mx master 3s"),
    ]
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value)
    return normalize_query(value)


def infer_query_category(product_name: str) -> str:
    value = normalize_query(product_name)
    if any(word in value for word in ["iphone", "samsung galaxy s", "xiaomi", "oppo", "vivo", "phone", "dien thoai"]):
        return "phone"
    if any(word in value for word in ["ipad", "tablet", "galaxy tab", "may tinh bang"]):
        return "tablet"
    if any(word in value for word in ["laptop", "macbook", "xps", "thinkpad", "vivobook", "inspiron"]):
        return "laptop"
    return "accessory"


def search_duckduckgo(query: str, max_results: int) -> list[dict]:
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    except DuckDuckGoSearchException:
        return []
    except Exception:
        return []


def search_trusted_product_sources(product_name: str, max_results: int) -> list[WebSource]:
    """Fallback to trusted spec pages when search engines are blocked or rate limited."""
    trusted_urls = trusted_product_urls(product_name)
    results: list[WebSource] = []
    for title, url in trusted_urls:
        content = fetch_page_text(url)
        if content and is_useful_content(content, product_name):
            results.append(WebSource(title=title, url=url, content=content[:MAX_SOURCE_CHARS]))
        elif is_relevant_search_result(title, "", product_name):
            results.append(WebSource(title=title, url=url, content=title[:MAX_SOURCE_CHARS]))
        if len(results) >= max_results:
            break
    return results


def trusted_product_urls(product_name: str) -> list[tuple[str, str]]:
    normalized = normalize_query(product_name)
    if "iphone 15" in normalized and "pro" not in normalized:
        return [
            ("iPhone 15 - Tech Specs - Apple Support", "https://support.apple.com/en-us/111831"),
            ("iPhone 15 - Apple", "https://www.apple.com/iphone-15/specs/"),
        ]
    if "samsung" in normalized and "s22" in normalized and "ultra" in normalized:
        return [
            ("Galaxy S22 Ultra - Samsung Global Specs", "https://www.samsung.com/global/galaxy/galaxy-s22-ultra/specs/"),
            ("Samsung Galaxy S22 Ultra 5G - GSMArena", "https://www.gsmarena.com/samsung_galaxy_s22_ultra_5g-11251.php"),
        ]
    if "xiaomi" in normalized and "13t" in normalized and "pro" in normalized:
        return [
            ("Xiaomi 13T Pro - Xiaomi Global Specs", "https://www.mi.com/global/product/xiaomi-13t-pro-leica/specs/"),
            ("Xiaomi 13T Pro - GSMArena", "https://www.gsmarena.com/xiaomi_13t_pro-12388.php"),
        ]
    if "ipad air" in normalized and ("5" in normalized or "m1" in normalized):
        return [
            ("iPad Air 5th generation - Technical Specifications", "https://support.apple.com/en-us/111887"),
            ("Apple iPad Air (2022) - GSMArena", "https://www.gsmarena.com/apple_ipad_air_(2022)-11333.php"),
        ]
    if "galaxy tab s9" in normalized:
        return [
            ("Samsung Galaxy Tab S9 - Samsung US", "https://www.samsung.com/us/tablets/galaxy-tab-s9/"),
            ("Samsung Galaxy Tab S9 - GSMArena", "https://www.gsmarena.com/samsung_galaxy_tab_s9-12439.php"),
        ]
    if "macbook air" in normalized and "m2" in normalized:
        return [
            ("MacBook Air M2 - Apple Technical Specifications", "https://support.apple.com/en-us/111867"),
            ("MacBook Air M2 - Apple", "https://www.apple.com/macbook-air/specs/"),
        ]
    if "dell xps 13" in normalized and "9315" in normalized:
        return [
            ("Dell XPS 13 9315 Setup and Specifications", "https://www.dell.com/support/manuals/en-us/xps-13-9315-laptop/xps-13-9315-setup-and-specifications/specifications-of-xps-13-9315"),
            ("Dell XPS 13 9315 - Notebookcheck", "https://www.notebookcheck.net/Dell-XPS-13-9315.633527.0.html"),
        ]
    if "anker" in normalized and "20w" in normalized:
        return [
            ("Anker Nano 20W Charger - Anker", "https://www.anker.com/products/a2633"),
        ]
    if "baseus" in normalized and "20000" in normalized:
        return [
            ("Baseus 20000mAh Power Bank - Baseus", "https://www.baseus.com/products/adaman-power-bank-20000mah-30w"),
        ]
    if "logitech" in normalized and "mx master 3s" in normalized:
        return [
            ("Logitech MX Master 3S - Logitech", "https://www.logitech.com/en-us/products/mice/mx-master-3s.910-006556.html"),
        ]
    if "ugreen" in normalized and "hub" in normalized:
        return [
            ("UGREEN USB C Hub - UGREEN", "https://www.ugreen.com/collections/usb-c-hub"),
        ]
    return []


def search_bing(query: str, max_results: int) -> list[dict]:
    try:
        response = requests.get(
            f"https://www.bing.com/search?q={quote_plus(query)}",
            timeout=6,
            headers={"User-Agent": "Mozilla/5.0 TMDT-AI-Research/1.0"},
        )
        response.raise_for_status()
    except requests.RequestException:
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    results = []
    for result_item in soup.select("li.b_algo"):
        link = result_item.select_one("h2 a")
        if not link:
            continue
        href = unwrap_search_url(link.get("href") or "")
        title = link.get_text(" ", strip=True)
        snippet_node = result_item.select_one(".b_caption p")
        snippet = snippet_node.get_text(" ", strip=True) if snippet_node else ""
        if href and title:
            results.append({"title": title, "href": href, "body": snippet})
        if len(results) >= max_results:
            break
    return results


def fetch_page_text(url: str) -> str:
    try:
        response = requests.get(
            url,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0 TMDT-AI-Research/1.0"},
        )
        response.raise_for_status()
    except requests.RequestException:
        return ""

    extracted = trafilatura.extract(response.text, include_comments=False, include_tables=False)
    if extracted:
        return " ".join(extracted.split())

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    return " ".join(soup.get_text(" ").split())


def is_useful_content(content: str, product_name: str) -> bool:
    normalized = content.lower().strip()
    if len(normalized) < 160:
        return False
    if any(pattern in normalized for pattern in BAD_CONTENT_PATTERNS):
        return False

    if not is_relevant_text(product_name, normalized):
        return False

    return True


def is_relevant_search_result(title: str, snippet: str, product_name: str) -> bool:
    text = f"{title} {snippet}".lower().strip()
    if len(text) < 20:
        return False
    if any(pattern in text for pattern in BAD_CONTENT_PATTERNS):
        return False

    return is_relevant_text(product_name, text)


def is_relevant_text(product_name: str, text: str) -> bool:
    tokens = [
        token.lower()
        for token in re_split_product_tokens(product_name)
        if len(token) >= 3 or token.isdigit()
    ]
    if not tokens:
        return False

    model_tokens = [token for token in tokens if any(char.isdigit() for char in token)]
    if model_tokens:
        return all(token in text for token in model_tokens) and any(
            token in text for token in tokens if token not in model_tokens
        )

    return sum(1 for token in tokens if token in text) >= min(2, len(tokens))


def relevance_score(product_name: str, title: str, snippet: str, url: str) -> int:
    text = f"{title} {snippet} {url}".lower()
    category = infer_query_category(product_name)
    tokens = [
        token.lower()
        for token in re_split_product_tokens(product_name)
        if len(token) >= 3 or token.isdigit()
    ]
    score = sum(3 for token in tokens if token in text)
    if product_name.lower() in text:
        score += 8
    if any(word in text for word in ["spec", "thong-so", "thong so", "technical", "support.apple.com", "gsmarena.com", "samsung.com"]):
        score += 4
    if category in ["phone", "tablet"] and any(domain in text for domain in ["gsmarena.com", "devicespecifications.com", "support.apple.com", "samsung.com", "mi.com"]):
        score += 8
    if category == "laptop" and any(domain in text for domain in ["support.apple.com", "dell.com/support", "notebookcheck.net", "lenovo.com", "asus.com", "hp.com"]):
        score += 8
    if category == "accessory" and any(domain in text for domain in ["anker.com", "baseus.com", "logitech.com", "ugreen.com", "belkin.com"]):
        score += 8
    if any(bad in text for bad in ["price in bangladesh", "category/", "smartphones/?", "/mobile/?", "search?"]):
        score -= 5
    if any(word in text for word in ["price", "gia", "review", "danh gia"]):
        score += 1
    return score


def normalize_query(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower().strip())


def unwrap_search_url(url: str) -> str:
    if "bing.com/ck/a" not in url:
        return url
    parsed = urlparse(url)
    target = parse_qs(parsed.query).get("u", [""])[0]
    if target.startswith("a1"):
        import base64

        try:
            return base64.urlsafe_b64decode(target[2:] + "==").decode("utf-8", errors="ignore")
        except Exception:
            return url
    return unquote(target) if target else url


def re_split_product_tokens(product_name: str) -> list[str]:
    import re

    return re.findall(r"[A-Za-z0-9À-ỹ]+", product_name)


def build_research_context(product_name: str, sources: list[WebSource]) -> str:
    blocks = [f"San pham can nghien cuu: {product_name}"]
    for index, source in enumerate(sources, start=1):
        blocks.append(
            f"Nguon {index}: {source.title}\nURL: {source.url}\nNoi dung: {source.content}"
        )
    return "\n\n".join(blocks)
