# TMDT Local AI Service

Module nay chay AI local, khong goi API AI ben ngoai.

## Chuc nang

- Crawl thong tin san pham tu web cong khai.
- Fine-tune text model bang dataset TMĐT tu xay dung.
- Sinh 13 output noi dung TMĐT da chot:
  ten san pham chuan hoa, tom tat, thong so, loi ich, landing page,
  slogan, social content, SEO, FAQ, danh gia chat luong, nguon tham khao,
  khach hang muc tieu, uu diem/han che.
- Tao anh san pham bang Stable Diffusion local.
- Danh gia chat luong noi dung bang rule-based scoring.

## Cai dat

```bat
cd /d D:\Chuyen_nganh\Dang_hoc\TMDT\ai_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Fine-tune text model

```bat
python train_text_model.py
```

Model sau khi train nam tai:

```text
models/text-generator
```

## Chay AI service

```bat
uvicorn app:app --reload --port 8000
```

Test:

```text
http://localhost:8000/health
```

## Endpoint demo

Chi tao noi dung, khong tao anh:

```text
POST http://localhost:8000/generate-content
```

Body:

```json
{
  "productName": "Tai nghe Bluetooth Sony WH-1000XM5",
  "maxSources": 3,
  "generateImage": false
}
```

Tao day du noi dung va anh:

```text
POST http://localhost:8000/generate-product
```

Body:

```json
{
  "productName": "Tai nghe Bluetooth Sony WH-1000XM5",
  "maxSources": 3,
  "generateImage": true
}
```

Voi RTX 2050 4GB VRAM, lan dau tao anh se cham vi model Stable Diffusion
can tai ve va nap vao GPU. Khi demo, nen test `/generate-content` truoc,
sau do moi test tao anh.
