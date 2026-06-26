// users\components\customer\ProductCard.tsx
'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Product {
  id: number;
  tensanpham: string;
  gia: number;
  hinhanh?: string;
  mota?: string;
  tendanhmuc?: string;
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    addToCart({
      id: product.id.toString(),
      name: product.tensanpham,
      price: product.gia,
      image: product.hinhanh,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/customer/products/${product.id}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col cursor-pointer">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.hinhanh ? (
            <img
              src={product.hinhanh}
              alt={product.tensanpham}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
              📦
            </div>
          )}
        </div>

        <CardContent className="p-5 flex-1 flex flex-col">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
            {product.tensanpham}
          </h3>

          {product.tendanhmuc && (
            <span className="text-xs text-gray-500 mb-2">{product.tendanhmuc}</span>
          )}

          <div className="flex items-baseline gap-2 mb-4 mt-auto">
            <span className="text-xl font-bold text-red-600">
              {product.gia.toLocaleString('vi-VN')}₫
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            className={`w-full transition-colors ${added ? 'bg-green-600 hover:bg-green-700' : ''}`}
            size="default"
          >
            <ShoppingCart size={16} className="mr-2" />
            {added ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}