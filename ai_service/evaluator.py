from __future__ import annotations


def evaluate_content(payload: dict) -> dict:
    """Rule-based quality score used by the admin preview."""
    description = payload.get("description", "") or ""
    summary = payload.get("productSummary", "") or ""
    benefits = payload.get("benefits", []) or []
    specs = payload.get("specifications", []) or []
    seo = payload.get("seo", {}) or {}
    landing = payload.get("landingPage", {}) or {}
    social = payload.get("socialContent", {}) or {}
    sources = payload.get("sources", []) or []

    seo_score = _score(
        bool(seo.get("title")),
        bool(seo.get("metaDescription")) and 80 <= len(seo.get("metaDescription", "")) <= 160,
        len(seo.get("keywords", [])) >= 4,
        bool(seo.get("slug")),
    )
    clarity_score = _score(
        len(summary) >= 120,
        len(description) >= 220,
        len(benefits) >= 4,
        len(specs) >= 4,
    )
    attractiveness_score = _score(
        bool(landing.get("heroTitle")),
        bool(landing.get("heroSubtitle")),
        bool(landing.get("cta")),
        len(payload.get("slogan", "")) >= 12,
        bool(social.get("facebookPost")),
    )
    research_score = min(10, 4 + len(sources) * 1.5)

    total = round((seo_score + clarity_score + attractiveness_score + research_score) / 4, 1)
    suggestions = []
    if seo_score < 8:
        suggestions.append("Bổ sung SEO title, meta description 80-160 ký tự, slug và ít nhất 4 từ khóa.")
    if clarity_score < 8:
        suggestions.append("Mô tả nên dài hơn, có ít nhất 4 lợi ích và 4 thông số rõ ràng.")
    if attractiveness_score < 8:
        suggestions.append("Hero, CTA, slogan và bài social cần cụ thể hơn để tăng khả năng chuyển đổi.")
    if research_score < 8:
        suggestions.append("Nên tra cứu thêm nguồn tham khảo hoặc bổ sung thông tin sản phẩm trước khi đăng bán.")

    return {
        "totalScore": total,
        "seoScore": round(seo_score, 1),
        "clarityScore": round(clarity_score, 1),
        "attractivenessScore": round(attractiveness_score, 1),
        "researchScore": round(research_score, 1),
        "improvementSuggestions": suggestions,
    }


def _score(*checks: bool) -> float:
    if not checks:
        return 0
    return round(sum(1 for item in checks if item) / len(checks) * 10, 1)
