// users\app\customer\products\[id]\page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: number;
  tensanpham: string;
  gia: number;
  hinhanh?: string;
  mota?: string;
  tendanhmuc?: string;
  soluong: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const productId = params.id as string;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success) setProduct(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id.toString(),
      name: product.tensanpham,
      price: product.gia,
      image: product.hinhanh,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    router.push('/customer/checkout');
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-10">Đang tải sản phẩm...</div>;

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
        <Link href="/customer/products" className="text-blue-600 hover:underline">← Quay lại danh sách</Link>
      </div>
    );
  }

  const isOutOfStock = product.soluong <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6">
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Ảnh sản phẩm */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
          {product.hinhanh ? (
            <img src={product.hinhanh} alt={product.tensanpham} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
        </div>

        {/* Thông tin */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.tensanpham}</h1>
          {product.tendanhmuc && <p className="text-sm text-gray-500 mb-4">{product.tendanhmuc}</p>}

          <div className="text-4xl font-bold text-red-600 mb-6">
            {product.gia.toLocaleString('vi-VN')}₫
          </div>

          {product.mota && <p className="text-gray-600 mb-8 whitespace-pre-line">{product.mota}</p>}

          {/* Tồn kho */}
          <div className="mb-6">
            {isOutOfStock ? (
              <span className="text-red-600 font-medium">Hết hàng</span>
            ) : (
              <span className="text-green-600 font-medium">Còn hàng ({product.soluong})</span>
            )}
          </div>

          {/* Số lượng */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 mb-8">
              <span className="font-medium">Số lượng:</span>
              <div className="flex items-center border border-gray-300 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-xl">−</button>
                <span className="px-6 font-semibold text-lg">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.soluong, quantity + 1))} className="px-4 py-2 text-xl">+</button>
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50
                ${added ? 'bg-green-600 text-white' : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'}`}
            >
              <ShoppingCart size={20} />
              {added ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ hàng'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 transition"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}