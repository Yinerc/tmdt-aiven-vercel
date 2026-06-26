"use client";

import { useMemo, useState } from "react";
import styles from "./ai-content.module.css";

const AI_SERVICE_URL = "http://localhost:8000";

const stepsByType = {
  content: [
    "Đang tra cứu nguồn web...",
    "Đang tổng hợp thông tin sản phẩm...",
    "Đang tạo nội dung landing page...",
    "Đang đánh giá chất lượng nội dung...",
  ],
  image: ["Đang tạo ảnh sản phẩm..."],
  content_image: [
    "Đang tra cứu nguồn web...",
    "Đang tổng hợp thông tin sản phẩm...",
    "Đang tạo nội dung landing page...",
    "Đang đánh giá chất lượng nội dung...",
    "Đang tạo ảnh sản phẩm...",
  ],
};

const tabs = [
  ["overview", "Tổng quan"],
  ["landing", "Landing Page"],
  ["seo", "SEO"],
  ["social", "Mạng xã hội"],
  ["faq", "FAQ"],
  ["quality", "Đánh giá"],
  ["sources", "Nguồn tham khảo"],
  ["image", "Ảnh AI"],
];

function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${AI_SERVICE_URL}${path}`;
}

function toResult(data, productName, actionType, imageName) {
  const hasSources = Array.isArray(data.sources) && data.sources.length > 0;
  const isResearch = data.researchStatus === "success" && hasSources;
  const imageUrl = resolveImageUrl(data.generatedImageUrl);
  const imageUrls = (data.generatedImageUrls || []).map(resolveImageUrl).filter(Boolean);
  const landing = data.landingPage || {};
  const social = data.socialContent || {};
  const seo = data.seo || {};
  const quality = data.qualityEvaluation || {};

  const finalImageUrls = imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [];

  return {
    requestedAction: actionType,
    raw: data,
    normalizedName: data.standardizedProductName || productName,
    summary: data.productSummary || "Chưa có tóm tắt nội dung.",
    specs: data.specifications || [],
    benefits: data.benefits || [],
    landing: {
      headline: landing.heroTitle || `Khám phá ${productName}`,
      sub: landing.heroSubtitle || "",
      blocks: [landing.benefitSection, landing.whyChooseSection].filter(Boolean),
      cta: landing.cta || "Mua ngay",
    },
    slogan: data.slogan || "",
    social: [
      social.facebookPost,
      social.tiktokCaption,
      Array.isArray(social.hashtags) ? social.hashtags.join(" ") : "",
    ].filter(Boolean).join("\n\n"),
    seo: {
      title: seo.title || "",
      description: seo.metaDescription || "",
      keywords: seo.keywords || [],
      slug: seo.slug || "",
    },
    faq: normalizeFaq(data.faq),
    quality: {
      total: quality.totalScore ?? 0,
      seo: quality.seoScore ?? 0,
      appeal: quality.attractivenessScore ?? 0,
      clarity: quality.clarityScore ?? 0,
      research: quality.researchScore ?? 0,
    },
    suggestions: quality.improvementSuggestions || [],
    audience: data.targetCustomers || [],
    pros: data.pros || [],
    cons: data.cons || [],
    imageUrl,
    imageUrls: finalImageUrls,
    selectedImageUrl: finalImageUrls[0] || "",
    imageName,
    imageGenerationMode: data.imageGenerationMode || "text-to-image",
    mode: isResearch ? "Research mode" : "Concept mode",
    searchStatus: isResearch ? "Thành công" : "Không tìm thấy nguồn hoặc bị giới hạn truy cập",
    sources: (data.sources || []).map((source) => ({
      name: source.title || source.name || "Nguồn tham khảo",
      url: source.url,
    })),
    imageNote: data.imageGenerationMode === "reference-layout"
      ? "Ảnh sản phẩm lấy từ file admin upload và được hệ thống tạo lại thành 4 bố cục catalog mới. Chỉ nên dùng ảnh mà nhóm có quyền sử dụng."
      : isResearch
        ? "Ảnh minh họa AI dựa trên thông tin sản phẩm."
        : "Ảnh concept AI, không phải ảnh sản phẩm thực tế.",
  };
}

function imageOnlyResult(data, productName, imageName) {
  const imageUrl = resolveImageUrl(data.generatedImageUrl);
  const imageUrls = (data.generatedImageUrls || []).map(resolveImageUrl).filter(Boolean);
  const finalImageUrls = imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [];

  return {
    requestedAction: "image",
    raw: data,
    normalizedName: data.productName || productName,
    summary: "Chỉ tạo ảnh sản phẩm AI. Bấm 'Tạo nội dung + ảnh' để có đầy đủ nội dung TMĐT.",
    specs: [],
    benefits: [],
    landing: { headline: `Ảnh AI cho ${productName}`, sub: "", blocks: [], cta: "" },
    slogan: "",
    social: "",
    seo: { title: "", description: "", keywords: [], slug: "" },
    faq: [],
    quality: { total: 0, seo: 0, appeal: 0, clarity: 0, research: 0 },
    suggestions: [],
    audience: [],
    pros: [],
    cons: [],
    imageUrl,
    imageUrls: finalImageUrls,
    selectedImageUrl: finalImageUrls[0] || "",
    imageName,
    imageGenerationMode: data.imageGenerationMode || "text-to-image",
    mode: "Concept mode",
    searchStatus: "Chỉ tạo ảnh",
    sources: [],
    imageNote: data.imageGenerationMode === "reference-layout"
      ? "Ảnh sản phẩm lấy từ file admin upload và được hệ thống tạo lại thành 4 bố cục catalog mới. Chỉ nên dùng ảnh mà nhóm có quyền sử dụng."
      : "Ảnh sản phẩm được tạo bằng model AI local.",
  };
}

function normalizeFaq(faq) {
  if (!Array.isArray(faq)) return [];
  return faq.map((item) => {
    if (Array.isArray(item)) return [item[0], item[1]];
    const text = String(item);
    const [question, ...answer] = text.split("?");
    return answer.length ? [`${question}?`, answer.join("?").trim()] : [text, ""];
  });
}

async function callAI(endpoint, productName, additionalInfo, referenceImage) {
  if (referenceImage && endpoint !== "/generate-content") {
    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("additionalInfo", additionalInfo);
    formData.append("maxSources", "3");
    formData.append("generateImage", "true");
    formData.append("imageCount", "4");
    formData.append("referenceImage", referenceImage);

    const uploadEndpoint = endpoint === "/generate-image"
      ? "/generate-image-with-reference"
      : "/generate-product-with-image";

    const response = await fetch(`${AI_SERVICE_URL}${uploadEndpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `AI service lỗi HTTP ${response.status}`);
    }

    return response.json();
  }

  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productName,
      additionalInfo,
      maxSources: 3,
      generateImage: endpoint !== "/generate-content",
      imageCount: endpoint === "/generate-content" ? 1 : 4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `AI service lỗi HTTP ${response.status}`);
  }

  return response.json();
}

function Score({ label, value }) {
  const safeValue = Number(value || 0);
  const type = safeValue >= 8 ? "good" : safeValue >= 6 ? "medium" : "weak";
  const text = safeValue >= 8 ? "Tốt" : safeValue >= 6 ? "Cần cải thiện" : "Yếu";
  return (
    <div className={styles.scoreRow}>
      <span>{label}</span><b>{safeValue}/10</b><em className={styles[type]}>{text}</em>
    </div>
  );
}

export default function AIContentDemo() {
  const [product, setProduct] = useState("");
  const [imageName, setImageName] = useState("");
  const [referenceImage, setReferenceImage] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [tab, setTab] = useState("overview");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const json = useMemo(() => {
    if (!result) return "";
    return JSON.stringify({ ...(result.raw || result), selectedImageUrl: result.selectedImageUrl || "" }, null, 2);
  }, [result]);

  async function run(type) {
    const productName = product.trim();
    if (!productName) return alert("Vui lòng nhập tên sản phẩm.");
    if (type !== "content" && !referenceImage) {
      setError("Để giữ đúng hình ảnh sản phẩm thực tế, vui lòng mở Tùy chọn nâng cao và upload ảnh sản phẩm được phép sử dụng trước khi tạo ảnh.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      for (const currentStep of stepsByType[type]) {
        setStep(currentStep);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      const endpoint =
        type === "content"
          ? "/generate-content"
          : type === "image"
            ? "/generate-image"
            : "/generate-product";

      const data = await callAI(endpoint, productName, additionalInfo.trim(), referenceImage);
      const nextResult = type === "image"
        ? imageOnlyResult(data, productName, imageName)
        : toResult(data, productName, type, imageName);

      setResult(nextResult);
      setTab(type === "image" ? "image" : "overview");
    } catch (err) {
      setError(
        `Không gọi được AI service. Hãy kiểm tra service Python ở ${AI_SERVICE_URL}. Chi tiết: ${err.message}`
      );
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(json);
    alert("Đã copy JSON.");
  }

  function selectImage(url) {
    setResult((current) => current ? { ...current, selectedImageUrl: url } : current);
  }

  return (
    <>
      <section className={styles.panel}>
        <h2>Demo AI tạo nội dung thương mại điện tử</h2>
        <div className={styles.inputGrid}>
          <label><span>Tên sản phẩm</span><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Ví dụ: Tai nghe Bluetooth Sony WH-1000XM5" /></label>
          <button onClick={()=>setAdvanced(!advanced)}>{advanced ? "Ẩn tùy chọn" : "Tùy chọn nâng cao"}</button>
        </div>
        <div className={styles.uploadBox}><b>Upload ảnh sản phẩm được phép sử dụng</b><input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0] || null; setReferenceImage(file); setImageName(file?.name || "");}} /><p></p>{imageName && <small>Đã chọn: {imageName}</small>}</div>
        {advanced && <div className={styles.advanced}><b>Thông tin bổ sung về sản phẩm</b><textarea value={additionalInfo} onChange={e=>setAdditionalInfo(e.target.value)} rows={4} placeholder="Ví dụ: Tai nghe không dây cho sinh viên, pin 30 giờ, có chống ồn, giá dự kiến 990.000đ" /><p>Không bắt buộc. Nếu sản phẩm chưa có thông tin công khai, bạn có thể nhập thêm mô tả ngắn để AI tạo nội dung concept chính xác hơn.</p></div>}
        <div className={styles.actions}><button onClick={()=>run("content")} disabled={loading}>Tạo nội dung</button><button onClick={()=>run("image")} disabled={loading}>Tạo ảnh</button><button className={styles.primary} onClick={()=>run("content_image")} disabled={loading}>Tạo nội dung + ảnh</button></div>
        {loading && <div className={styles.loading}><div className={styles.spinner}/><div><b>{step}</b><p>Tạo ảnh AI có thể mất vài phút trong lần đầu chạy model local.</p></div></div>}
        {error && <div className={styles.warning}>{error}</div>}
      </section>

      {result && <>
        <section className={styles.mode}><div><span>Mode</span><b className={result.mode === "Research mode" ? styles.research : styles.concept}>{result.mode}</b></div><div><span>Trạng thái tra cứu</span><b>{result.searchStatus}</b></div></section>
        {result.mode === "Concept mode" && result.requestedAction !== "image" && <div className={styles.warning}>Không tìm thấy nguồn thông tin công khai đáng tin cậy. Hãy mở Tùy chọn nâng cao, nhập mô tả sản phẩm hoặc upload ảnh sản phẩm được phép sử dụng, sau đó tạo lại. Nội dung Concept mode cần kiểm chứng trước khi sử dụng thương mại.</div>}
        <section className={styles.copyBar}><button onClick={copyJson}>Copy JSON</button><button onClick={()=>run("content_image")}>Tạo lại</button></section>
        <section className={styles.result}>
          <div className={styles.tabs}>{tabs.map(([k,l])=><button key={k} className={tab===k?styles.active:""} onClick={()=>setTab(k)}>{l}</button>)}</div>
          {tab === "overview" && <div className={styles.grid}><Block title="Tên sản phẩm chuẩn hóa"><p>{result.normalizedName}</p></Block><Block title="Tóm tắt"><p>{result.summary}</p></Block><Block title="Thông số kỹ thuật"><List data={result.specs}/></Block><Block title="Điểm nổi bật / lợi ích"><List data={result.benefits}/></Block><Block title="Đối tượng khách hàng"><List data={result.audience}/></Block><Block title="Ưu điểm / hạn chế"><h4>Ưu điểm</h4><List data={result.pros}/><h4>Hạn chế</h4><List data={result.cons}/></Block></div>}
          {tab === "landing" && <Block title={result.landing.headline}><p>{result.landing.sub}</p><List data={result.landing.blocks}/>{result.landing.cta && <b>CTA: {result.landing.cta}</b>}<div className={styles.slogan}>{result.slogan}</div></Block>}
          {tab === "seo" && <Block title="SEO Content"><p><b>Title:</b> {result.seo.title}</p><p><b>Description:</b> {result.seo.description}</p><p><b>Slug:</b> {result.seo.slug}</p><p><b>Keywords:</b> {result.seo.keywords.join(", ")}</p></Block>}
          {tab === "social" && <Block title="Nội dung quảng cáo mạng xã hội"><p>{result.social}</p></Block>}
          {tab === "faq" && <Block title="FAQ">{result.faq.length ? result.faq.map(([q,a])=><div className={styles.faq} key={q}><b>{q}</b><p>{a}</p></div>) : <p>Chưa có FAQ.</p>}</Block>}
          {tab === "quality" && <Block title="Đánh giá chất lượng"><Score label="Điểm tổng" value={result.quality.total}/><Score label="Điểm SEO" value={result.quality.seo}/><Score label="Điểm hấp dẫn" value={result.quality.appeal}/><Score label="Điểm rõ ràng" value={result.quality.clarity}/><Score label="Điểm nghiên cứu nguồn" value={result.quality.research}/><h4>Gợi ý cải thiện</h4><List data={result.suggestions}/></Block>}
          {tab === "sources" && <Block title="Nguồn tham khảo">{result.sources.length ? <ul>{result.sources.map(s=><li key={s.url}><b>{s.name}</b>: <a href={s.url} target="_blank" rel="noreferrer">{s.url}</a></li>)}</ul> : <p>Chưa có nguồn tham khảo. Hệ thống đang ở Concept mode hoặc bị giới hạn truy cập.</p>}</Block>}
          {tab === "image" && <Block title="Hình ảnh sản phẩm AI tạo">{result.selectedImageUrl && <p><b>Ảnh đang chọn:</b> {result.selectedImageUrl}</p>}{result.imageUrls?.length ? <div className={styles.imageGrid}>{result.imageUrls.map((url, index)=><figure key={url} role="button" tabIndex={0} onClick={()=>selectImage(url)} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectImage(url);}}} className={result.selectedImageUrl === url ? styles.selectedImage : ""}><img className={styles.aiImage} src={url} alt={`Ảnh sản phẩm AI tạo ${index + 1}`}/><figcaption>Biến thể {index + 1}</figcaption>{result.selectedImageUrl === url && <span className={styles.selectedBadge}>Ảnh đã chọn</span>}</figure>)}</div> : <p>Chưa có ảnh AI. Hãy bấm nút Tạo ảnh hoặc Tạo nội dung + ảnh.</p>}</Block>}
        </section>
      </>}
    </>
  );
}

function Block({ title, children }) { return <div className={styles.block}><h2>{title}</h2>{children}</div>; }
function List({ data }) { return data?.length ? <ul>{data.map(x=><li key={x}>{x}</li>)}</ul> : <p>Chưa có dữ liệu.</p>; }
