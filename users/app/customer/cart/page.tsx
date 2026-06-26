// app/customer/cart/page.tsx
'use client';

import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, Percent, X } from 'lucide-react';
import { useState } from 'react';

interface AppliedVoucher {
  code: string;
  discountAmount: number;
  label: string;
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  const subtotal = getTotalPrice() || 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  // ==================== ÁP DỤNG VOUCHER ====================
  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    setVoucherLoading(true);
    setVoucherError('');

    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode, orderAmount: subtotal }),
      });

      const data = await res.json();

      if (!data.success) {
        setVoucherError(data.message);
        return;
      }

      setAppliedVoucher(data.data);
      setVoucherCode('');

      // ✅ Lưu voucher vào localStorage
      localStorage.setItem('appliedVoucher', JSON.stringify(data.data));
    } catch (error) {
      setVoucherError('Không thể áp dụng voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  // ==================== XÓA VOUCHER ====================
  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
    localStorage.removeItem('appliedVoucher');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="mx-auto h-24 w-24 text-gray-300 mb-8" />
        <h2 className="text-3xl font-bold mb-4">Giỏ hàng trống</h2>
        <Link href="/customer/products" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Danh sách sản phẩm */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-6 p-6 border-b last:border-b-0">
                <div className="w-24 h-24 relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  {typeof item.image === 'string' && item.image.length > 0 ? (
  <Image
    src={item.image}
    alt={item.name || 'Sản phẩm'}
    fill
    className="object-cover"
  />
) : (
  <ShoppingCart className="m-auto" />
)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-red-600 font-bold text-xl">
  {(item.price ?? 0).toLocaleString('vi-VN')}₫
</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2"><Minus size={18} /></button>
                      <span className="px-6 font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2"><Plus size={18} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="font-semibold text-lg whitespace-nowrap">
                  {((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('vi-VN')}₫
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tóm tắt + Voucher */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow p-6 sticky top-24">
            <h3 className="font-semibold text-xl mb-6">Thông tin thanh toán</h3>

            {/* VOUCHER */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Percent size={18} /> Mã giảm giá
              </div>

              {!appliedVoucher ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã voucher"
                    className="flex-1 border px-4 py-2.5 rounded-xl text-sm"
                  />
                  <button onClick={applyVoucher} disabled={voucherLoading} className="bg-green-600 text-white px-5 rounded-xl text-sm font-semibold">
                    {voucherLoading ? '...' : 'Áp dụng'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-xl">
                  <div>
                    <p className="font-semibold text-green-700 text-sm">{appliedVoucher.code}</p>
                    <p className="text-xs text-green-600">-{appliedVoucher.discountAmount.toLocaleString('vi-VN')}₫</p>
                  </div>
                  <button onClick={removeVoucher} className="text-red-500"><X size={18} /></button>
                </div>
              )}
              {voucherError && <p className="text-red-500 text-xs mt-1">{voucherError}</p>}
            </div>

            {/* Tổng tiền */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{subtotal.toLocaleString('vi-VN')}₫</span></div>
              {appliedVoucher && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{discountAmount.toLocaleString('vi-VN')}₫</span></div>}
              <div className="flex justify-between"><span>Phí ship</span><span className="text-green-600">Miễn phí</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span><span className="text-red-600">{total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            <Link href="/customer/checkout" className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-semibold mt-6">
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}