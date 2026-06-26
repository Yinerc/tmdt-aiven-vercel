# LoRA training cho ảnh sản phẩm local

Mục tiêu của thư mục này là chuẩn bị hướng fine-tune model ảnh theo từng nhóm sản phẩm, ví dụ:

- `smartphone`
- `headphone`
- `laptop`
- `smartwatch`

Đây là hướng nâng cao để cải thiện chất lượng ảnh so với text-to-image thuần. Demo chính vẫn chạy được bằng model local hiện tại; LoRA dùng khi nhóm có thời gian thu thập dataset và train thêm.

## Cấu trúc dataset đề xuất

```text
ai_service/
  lora_training/
    datasets/
      smartphone/
        images/
          iphone_15_001.jpg
          iphone_15_002.jpg
        captions.txt
      headphone/
        images/
        captions.txt
```

Mỗi dòng trong `captions.txt` nên có dạng:

```text
iphone_15_001.jpg | premium smartphone product photo, glass back, dual camera, ecommerce studio lighting
iphone_15_002.jpg | modern smartphone landing page hero image, clean background, realistic product render
```

## Cách dùng trong demo

1. Sản phẩm có ảnh thật hoặc ảnh mẫu: upload ảnh tham khảo trên trang admin để chạy image-to-image.
2. Sản phẩm chưa có trên thị trường: nhập mô tả bổ sung và upload phác thảo nếu có.
3. Khi có dataset đủ tốt, train LoRA riêng cho nhóm sản phẩm rồi đặt model vào thư mục `models/image-lora`.

## Ghi chú kỹ thuật

- RTX 2050 4GB VRAM có thể train LoRA rất chậm và dễ thiếu VRAM.
- Nên bắt đầu với ảnh 512x512, batch size 1, mixed precision fp16.
- Dataset tối thiểu nên có 20-50 ảnh cho một nhóm sản phẩm.
- Không nên train trực tiếp logo thương hiệu nếu mục tiêu là dùng thương mại thật; trong demo học phần có thể nói rõ ảnh AI là ảnh minh họa.

## Kết luận trình bày với giảng viên

Nhóm có 3 cơ chế tạo ảnh:

1. Text-to-image: nhập tên sản phẩm, model local tự tạo ảnh concept/quảng cáo.
2. Image-to-image: upload ảnh tham khảo, model local tạo 4 biến thể quảng cáo bám dáng sản phẩm.
3. LoRA fine-tune: hướng nâng cao để tự huấn luyện model theo nhóm sản phẩm, không gọi API bên ngoài.
