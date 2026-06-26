# Ke hoach day output AI tu trang admin len trang user

## 1. Muc tieu

Sau khi admin nhap ten san pham, upload anh san pham, cho AI tao noi dung va chon 1 anh trong 4 bien the, he thong can co nut **Luu va dang len trang user**.

Ket qua cuoi cung:

- Admin tao noi dung san pham bang AI.
- Admin chon anh san pham muon dung.
- He thong luu toan bo noi dung da tao.
- Trang user doc du lieu da luu va hien thi thanh trang san pham/landing page.

Flow tong quat:

```text
Admin nhap ten san pham + upload anh
        ↓
AI research + sinh content + tao 4 anh
        ↓
Admin xem lai noi dung
        ↓
Admin chon 1 anh
        ↓
Admin bam "Luu va dang"
        ↓
Backend luu vao database
        ↓
Trang user hien thi san pham da publish
```

## 2. Output AI can luu

Khi AI tao xong, can luu cac truong sau:

```json
{
  "name": "Samsung Galaxy S22 Ultra 5G",
  "summary": "...",
  "description": "...",
  "specifications": [],
  "benefits": [],
  "landingPage": {
    "heroTitle": "...",
    "heroSubtitle": "...",
    "cta": "Mua ngay",
    "benefitSection": "...",
    "whyChooseSection": "..."
  },
  "slogan": "...",
  "socialContent": {
    "facebookPost": "...",
    "tiktokCaption": "...",
    "hashtags": []
  },
  "seo": {
    "title": "...",
    "metaDescription": "...",
    "keywords": [],
    "slug": "samsung-galaxy-s22-ultra-5g"
  },
  "faq": [],
  "targetCustomers": [],
  "pros": [],
  "cons": [],
  "sources": [],
  "selectedImageUrl": "http://localhost:8000/outputs/images/...",
  "generatedImageUrls": [],
  "qualityEvaluation": {},
  "status": "published"
}
```

Trong do quan trong nhat voi trang user:

- `name`: ten san pham chuan hoa.
- `summary`: tom tat san pham.
- `description`: mo ta san pham.
- `specifications`: thong so ky thuat.
- `benefits`: diem noi bat.
- `landingPage`: noi dung landing page.
- `seo`: du lieu SEO.
- `faq`: cau hoi thuong gap.
- `pros`, `cons`: uu diem va han che.
- `selectedImageUrl`: anh admin da chon.
- `status`: trang thai hien thi tren user.

## 3. Database de xuat

Neu chua co database, co the demo tam bang file JSON/localStorage. Tuy nhien ban chinh thuc nen luu database.

Bang de xuat: `ai_generated_products`

```sql
CREATE TABLE ai_generated_products (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  slug NVARCHAR(255) NOT NULL,
  summary NVARCHAR(MAX),
  description NVARCHAR(MAX),
  specifications NVARCHAR(MAX),
  benefits NVARCHAR(MAX),
  landing_page NVARCHAR(MAX),
  slogan NVARCHAR(500),
  social_content NVARCHAR(MAX),
  seo NVARCHAR(MAX),
  faq NVARCHAR(MAX),
  target_customers NVARCHAR(MAX),
  pros NVARCHAR(MAX),
  cons NVARCHAR(MAX),
  sources NVARCHAR(MAX),
  selected_image_url NVARCHAR(MAX),
  generated_image_urls NVARCHAR(MAX),
  quality_evaluation NVARCHAR(MAX),
  status NVARCHAR(50) DEFAULT 'draft',
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);
```

Ghi chu:

- Cac truong mang/object nen luu dang JSON string: `specifications`, `benefits`, `landing_page`, `seo`, `faq`, ...
- `status` co the gom: `draft`, `published`, `hidden`.
- Trang user chi lay san pham co `status = 'published'`.

## 4. API backend can co

### 4.1. API luu san pham AI

Endpoint de xuat:

```http
POST /api/admin/ai-products
```

Body:

```json
{
  "name": "Samsung Galaxy S22 Ultra 5G",
  "slug": "samsung-galaxy-s22-ultra-5g",
  "summary": "...",
  "description": "...",
  "specifications": [],
  "benefits": [],
  "landingPage": {},
  "slogan": "...",
  "socialContent": {},
  "seo": {},
  "faq": [],
  "targetCustomers": [],
  "pros": [],
  "cons": [],
  "sources": [],
  "selectedImageUrl": "...",
  "generatedImageUrls": [],
  "qualityEvaluation": {},
  "status": "published"
}
```

Response:

```json
{
  "success": true,
  "id": 1,
  "slug": "samsung-galaxy-s22-ultra-5g"
}
```

### 4.2. API lay danh sach san pham user

Endpoint de xuat:

```http
GET /api/products
```

Chi tra ve san pham da publish.

Response:

```json
[
  {
    "id": 1,
    "name": "Samsung Galaxy S22 Ultra 5G",
    "slug": "samsung-galaxy-s22-ultra-5g",
    "summary": "...",
    "selectedImageUrl": "..."
  }
]
```

### 4.3. API lay chi tiet san pham user

Endpoint de xuat:

```http
GET /api/products/:slug
```

Response tra ve day du noi dung landing page, SEO, FAQ, specs, benefits, anh.

## 5. Sua giao dien admin

Trang admin AI hien tai can them cac phan sau.

### 5.1. Nut luu va dang

Them nut:

```text
Luu va dang len trang user
```

Dieu kien cho phep bam:

- Da co ket qua AI.
- Da co `selectedImageUrl`.
- Da co `standardizedProductName`.

Khi bam nut:

1. Lay object `result`.
2. Lay anh dang chon `result.selectedImageUrl`.
3. Goi API `POST /api/admin/ai-products`.
4. Neu thanh cong, hien thong bao: `Da luu va dang san pham`.
5. Co the hien link: `Xem tren trang user`.

### 5.2. Trang thai dang

Can co cac state:

- `saving`: dang luu.
- `success`: luu thanh cong.
- `error`: luu that bai.

Thong bao goi y:

```text
Dang luu san pham...
Da luu va dang san pham len trang user.
Luu that bai, vui long thu lai.
```

### 5.3. Cho phep chinh sua truoc khi dang

Nen co, neu kip lam:

- Sua ten san pham.
- Sua tom tat.
- Sua thong so ky thuat.
- Sua diem noi bat.
- Sua FAQ.
- Doi anh da chon.

Neu khong kip, demo van co the dung output AI truc tiep.

## 6. Yeu cau trang user

Trang user nen co 2 loai man hinh.

### 6.1. Trang danh sach san pham

Route goi y:

```text
/products
```

Hien thi:

- Anh san pham da chon.
- Ten san pham.
- Tom tat ngan.
- 3 diem noi bat.
- Nut `Xem chi tiet`.

Layout goi y:

```text
[Anh] Samsung Galaxy S22 Ultra 5G
      Tom tat ngan...
      - Camera 108MP
      - Man hinh AMOLED
      - Pin 5000mAh
      [Xem chi tiet]
```

### 6.2. Trang chi tiet/landing page san pham

Route goi y:

```text
/products/[slug]
```

Cac section can co:

1. Hero section
   - Anh san pham.
   - Hero title.
   - Hero subtitle.
   - CTA.

2. Tong quan
   - Tom tat.
   - Mo ta san pham.

3. Diem noi bat
   - Hien 3-6 benefits.

4. Thong so ky thuat
   - Hien dang bang hoac list.

5. Vi sao nen chon san pham nay
   - Lay tu `landingPage.whyChooseSection`.

6. Uu diem / han che
   - Chia 2 cot.

7. FAQ
   - 3-5 cau hoi thuong gap.

8. Nguon tham khao
   - Hien URL nguon crawler da dung.

## 7. SEO cho trang user

Trang chi tiet san pham nen dung:

- `seo.title` cho title.
- `seo.metaDescription` cho meta description.
- `seo.keywords` cho keywords.
- `seo.slug` cho URL.

Neu dung Next.js App Router, co the tao metadata dong theo san pham.

Vi du:

```js
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  return {
    title: product.seo.title,
    description: product.seo.metaDescription,
    keywords: product.seo.keywords,
  };
}
```

## 8. Xu ly anh

Hien tai anh AI nam o FastAPI:

```text
http://localhost:8000/outputs/images/...
```

Co 2 cach:

### Cach 1: Luu URL anh

Luu thang `selectedImageUrl` vao database.

Uu diem:

- De lam.
- Phu hop demo nhanh.

Nhuoc diem:

- Khi deploy that, can dam bao FastAPI/static image van chay.

### Cach 2: Copy anh sang folder public cua Next.js

Khi admin bam luu, backend copy anh sang:

```text
tmdt-next/public/uploads/ai-products
```

Sau do luu URL:

```text
/uploads/ai-products/samsung-galaxy-s22-ultra-5g.png
```

Uu diem:

- Trang user hien anh on dinh hon.

Nhuoc diem:

- Can them logic copy file.

De demo hien tai, nen lam Cach 1 truoc.

## 9. Phan cong theo task nhom

### Task Admin

- Them nut `Luu va dang len trang user`.
- Gui output AI va anh da chon sang backend.
- Hien thong bao thanh cong/that bai.
- Co the them chuc nang sua noi dung truoc khi dang.

### Task Backend

- Tao bang/database luu output AI.
- Tao API `POST /api/admin/ai-products`.
- Tao API `GET /api/products`.
- Tao API `GET /api/products/:slug`.
- Xu ly JSON fields.
- Xu ly status `draft/published/hidden`.

### Task User

- Tao trang danh sach san pham.
- Tao trang chi tiet landing page.
- Lay du lieu tu API.
- Hien anh, thong so, benefits, FAQ, SEO.

### Task AI

- Dam bao output co day du cac truong da chot.
- Dam bao `selectedImageUrl` duoc gui dung.
- Dam bao ten san pham chuan hoa.
- Dam bao thong so ky thuat khong bi rong/sai voi san pham demo.

## 10. Lo trinh thuc hien de demo nhanh

### Buoc 1: Hoan thien output AI

Kiem tra cac san pham demo:

- iPhone 15
- Samsung Galaxy S22 Ultra 5G
- Lenovo LOQ
- iPad Air 5
- Galaxy Tab S9

Moi san pham can co:

- Ten chuan hoa.
- Tom tat.
- Thong so.
- Benefits.
- Anh da chon.

### Buoc 2: Them nut luu trong admin

Nut `Luu va dang len trang user` nam gan khu vuc `Copy JSON` / `Tao lai`.

### Buoc 3: Luu tam bang file JSON neu chua co DB

Neu backend database chua xong, co the demo tam bang file:

```text
data/ai-products.json
```

Moi lan bam luu thi append san pham vao file.

### Buoc 4: Trang user doc file/API

Trang user hien danh sach san pham da luu.

### Buoc 5: Chuyen sang database

Khi backend san sang, thay file JSON bang SQL Server.

## 11. Checklist truoc khi bao cao

- [ ] Admin nhap ten san pham va upload anh.
- [ ] AI sinh du noi dung.
- [ ] AI tao 4 anh catalog.
- [ ] Admin chon duoc 1 anh.
- [ ] Admin bam luu va dang.
- [ ] Du lieu duoc luu.
- [ ] Trang user hien san pham moi.
- [ ] Trang chi tiet hien landing page.
- [ ] Anh tren trang user dung anh da chon.
- [ ] Thong so ky thuat khong bi rong.
- [ ] Ten san pham viet hoa/chuan hoa dung.
- [ ] Co nguon tham khao.

## 12. Ket luan

Co the push output AI len trang user. Cach lam dung nhat la xem output AI nhu mot ban nhap san pham do admin duyet. Admin khong nen dang tu dong ngay sau khi AI tao xong, ma nen co buoc chon anh, xem lai noi dung, roi bam **Luu va dang**. Cach nay vua dung flow thuong mai dien tu, vua de giai thich voi giang vien trong phan demo.
