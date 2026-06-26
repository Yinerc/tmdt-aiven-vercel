from __future__ import annotations

import os
from pathlib import Path
import shutil
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import File, Form, UploadFile
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from crawler import search_product_sources
from evaluator import evaluate_content
from generator import generate_product_content
from img_generator import generate_product_image, generate_product_images


load_dotenv()

app = FastAPI(title="TMDT Local AI Service")
Path("outputs/images").mkdir(parents=True, exist_ok=True)
Path("outputs/uploads").mkdir(parents=True, exist_ok=True)


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv(
        "AI_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")


class GenerateProductRequest(BaseModel):
    productName: str = Field(..., min_length=2)
    additionalInfo: str = ""
    maxSources: int = Field(default=5, ge=1, le=8)
    generateImage: bool = True
    imageCount: int = Field(default=1, ge=1, le=4)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "local-model"}


@app.post("/generate-product")
def generate_product(request: GenerateProductRequest):
    sources = search_product_sources(request.productName, request.maxSources)
    content = generate_product_content(request.productName, sources, request.additionalInfo)
    content["sources"] = [{"title": item.title, "url": item.url} for item in sources]
    content["researchStatus"] = "success" if sources else "no_sources_or_rate_limited"

    if request.generateImage:
        slug = content.get("seo", {}).get("slug") or "san-pham"
        image_paths = generate_product_images(
            content["standardizedProductName"],
            slug,
            request.imageCount,
            specifications=content.get("specifications", []),
            benefits=content.get("benefits", []),
        )
        content["generatedImageUrls"] = [f"/{path}" for path in image_paths]
        content["generatedImageUrl"] = content["generatedImageUrls"][0]
    else:
        content["generatedImageUrl"] = ""
        content["generatedImageUrls"] = []

    content["qualityEvaluation"] = evaluate_content(content)
    return content


@app.post("/generate-product-with-image")
def generate_product_with_image(
    productName: str = Form(..., min_length=2),
    additionalInfo: str = Form(default=""),
    maxSources: int = Form(default=5),
    generateImage: bool = Form(default=True),
    imageCount: int = Form(default=4),
    referenceImage: UploadFile | None = File(default=None),
):
    sources = search_product_sources(productName, max(1, min(int(maxSources or 5), 8)))
    content = generate_product_content(productName, sources, additionalInfo)
    content["sources"] = [{"title": item.title, "url": item.url} for item in sources]
    content["researchStatus"] = "success" if sources else "no_sources_or_rate_limited"

    reference_path = save_upload(referenceImage) if referenceImage else ""
    if generateImage:
        slug = content.get("seo", {}).get("slug") or "san-pham"
        image_paths = generate_product_images(
            content["standardizedProductName"],
            slug,
            max(1, min(int(imageCount or 4), 4)),
            reference_image_path=reference_path,
            specifications=content.get("specifications", []),
            benefits=content.get("benefits", []),
        )
        content["generatedImageUrls"] = [f"/{path}" for path in image_paths]
        content["generatedImageUrl"] = content["generatedImageUrls"][0]
        content["imageGenerationMode"] = "reference-layout" if reference_path else "text-to-image"
    else:
        content["generatedImageUrl"] = ""
        content["generatedImageUrls"] = []
        content["imageGenerationMode"] = "none"

    content["qualityEvaluation"] = evaluate_content(content)
    return content


@app.post("/generate-content")
def generate_content(request: GenerateProductRequest):
    sources = search_product_sources(request.productName, request.maxSources)
    content = generate_product_content(request.productName, sources, request.additionalInfo)
    content["sources"] = [{"title": item.title, "url": item.url} for item in sources]
    content["researchStatus"] = "success" if sources else "no_sources_or_rate_limited"
    content["generatedImageUrl"] = ""
    content["qualityEvaluation"] = evaluate_content(content)
    return content


@app.post("/generate-image")
def generate_image(request: GenerateProductRequest):
    slug = request.productName.lower().replace(" ", "-")
    image_name = request.productName
    if request.additionalInfo:
        image_name = f"{request.productName}. {request.additionalInfo}"
    image_paths = generate_product_images(image_name, slug, request.imageCount)
    image_urls = [f"/{path}" for path in image_paths]
    return {
        "productName": request.productName,
        "generatedImageUrl": image_urls[0],
        "generatedImageUrls": image_urls,
    }


@app.post("/generate-image-with-reference")
def generate_image_with_reference(
    productName: str = Form(..., min_length=2),
    additionalInfo: str = Form(default=""),
    imageCount: int = Form(default=4),
    referenceImage: UploadFile | None = File(default=None),
):
    slug = productName.lower().replace(" ", "-")
    image_name = productName
    if additionalInfo:
        image_name = f"{productName}. {additionalInfo}"

    reference_path = save_upload(referenceImage) if referenceImage else ""
    image_paths = generate_product_images(
        image_name,
        slug,
        max(1, min(int(imageCount or 4), 4)),
        reference_image_path=reference_path,
    )
    image_urls = [f"/{path}" for path in image_paths]
    return {
        "productName": productName,
        "generatedImageUrl": image_urls[0],
        "generatedImageUrls": image_urls,
        "imageGenerationMode": "reference-layout" if reference_path else "text-to-image",
    }


def save_upload(file: UploadFile) -> str:
    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    extension = allowed_types.get(file.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WEBP images are supported")

    target = Path("outputs/uploads") / f"{uuid4().hex}{extension}"
    max_bytes = 5 * 1024 * 1024
    total_bytes = 0

    with target.open("wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="Uploaded image is larger than 5MB")
            buffer.write(chunk)

    return str(target)
