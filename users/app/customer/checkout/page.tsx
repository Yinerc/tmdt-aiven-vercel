// users\app\customer\checkout\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, Truck, CheckCircle, Package, CreditCard, 
  Percent, AlertCircle, X, Copy
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
const { deriveQrUiStatus } = require('@/lib/qrUiStatus');

interface AppliedVoucher {
  code: string;
  discountAmount: number;
  label: string;
}

interface OrderSummary {
  orderCode: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  total: number;
  appliedVoucher?: AppliedVoucher;
}

export default function CheckoutPage() {
  const { cart, getTotalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    note: '',
    paymentMethod: 'cod',
  });

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [momoQRData, setMomoQRData] = useState<any>(null);
  const [momoQRLoading, setMomoQRLoading] = useState(false);
  const [qrExpiryTime, setQrExpiryTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [qrValidationError, setQrValidationError] = useState('');
  const [isQRValid, setIsQRValid] = useState(false);
  const [qrUiMessage, setQrUiMessage] = useState('');

  const subtotal = getTotalPrice() || 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  // ==================== LOAD VOUCHER TỪ CART (QUAN TRỌNG) ====================
  useEffect(() => {
    const savedVoucher = localStorage.getItem('appliedVoucher');
    if (savedVoucher) {
      try {
        const parsed = JSON.parse(savedVoucher);
        setAppliedVoucher(parsed);
      } catch (e) {
        localStorage.removeItem('appliedVoucher');
      }
    }
  }, []);

  // Tự động điền thông tin user
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.hoten || prev.fullName || '',
        phone: user.sodienthoai || prev.phone || '',
        address: user.diachi || prev.address || '',
        city: prev.city || '',
      }));
    }
  }, [isLoggedIn, user]);

  // Countdown timer cho QR expiry
  useEffect(() => {
    if (!qrExpiryTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((qrExpiryTime.getTime() - now.getTime()) / 1000));
      setRemainingTime(remaining);

      // Nếu hết hạn, invalidate QR
      if (remaining <= 0) {
        setQrValidationError('Mã QR đã hết hạn. Vui lòng refresh để tạo mã mới.');
        setIsQRValid(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrExpiryTime]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const applyVoucher = async () => {
    setVoucherError('');
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    setVoucherLoading(true);
    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode, subtotal }),
      });

      const data = await res.json();

      if (!data.success) {
        setVoucherError(data.message);
        return;
      }

      setAppliedVoucher(data.data);
      setVoucherCode('');
      localStorage.setItem('appliedVoucher', JSON.stringify(data.data));
    } catch (error) {
      setVoucherError('Không thể áp dụng voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
    localStorage.removeItem('appliedVoucher');
  };

  const handleProceedToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    // Nếu chọn thanh toán bằng MoMo, generate QR code trước khi show modal
    if (formData.paymentMethod === 'bank') {
      setMomoQRLoading(true);
      await generateMomoQR();
      setMomoQRLoading(false);
    }

    setShowReview(true);
  };

  const generateMomoQR = async () => {
    try {
      setMomoQRLoading(true);
      setQrValidationError('');
      setIsQRValid(false);
      setMomoQRData(null); // Reset QR data trước khi tạo mới

      const res = await fetch('/api/payments/generate-momo-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: Math.random().toString().slice(2, 10),
          amount: total,
          orderCode: `DH${Date.now().toString().slice(-6)}`,
          thanh_toan_id: 0,
          donhang_id: 0,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        const errorMsg = data.error || data.details || 'Không thể tạo mã QR';
        console.error('API Error:', data);
        setQrValidationError(errorMsg);
        return;
      }

      console.log('QR Generated:', data.data);
      setMomoQRData(data.data);
      const expiryDate = new Date(data.data.expiresAt);
      setQrExpiryTime(expiryDate);
      setIsQRValid(true);
      setQrValidationError('');
      setQrUiMessage('Đang chờ thanh toán...');
      pollQrStatus(data.data.qrId);
    } catch (error: any) {
      console.error('Generate QR Error:', error);
      setQrValidationError(error.message || 'Lỗi khi tạo mã QR');
    } finally {
      setMomoQRLoading(false);
    }
  };

  const pollQrStatus = async (qrId: string) => {
    const intervalId = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/qr-verify?qrId=${encodeURIComponent(qrId)}`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          return;
        }

        const uiState = deriveQrUiStatus(data.data);
        setQrUiMessage(uiState.message);

        if (uiState.isSuccess) {
          setIsQRValid(true);
          setQrValidationError('');
          window.clearInterval(intervalId);
          setShowReview(false);
          setOrderSuccess(true);
          setOrderSummary({
            orderCode: `DH${Date.now().toString().slice(-8).toUpperCase()}`,
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city || '',
            total,
            appliedVoucher: appliedVoucher || undefined,
          });
          clearCart();
          localStorage.removeItem('appliedVoucher');
        }
      } catch (error) {
        console.error('Poll QR status error:', error);
      }
    }, 3000);
  };

  const validateQR = async (qrId: string) => {
    try {
      setQrValidationError('');
      const res = await fetch('/api/payments/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId }),
      });

      const data = await res.json();

      if (!data.success) {
        setQrValidationError(data.error || 'Mã QR không hợp lệ');
        setIsQRValid(false);
        return false;
      }

      setIsQRValid(true);
      setQrValidationError('');
      return true;
    } catch (error) {
      console.error('Lỗi validate QR:', error);
      setQrValidationError('Lỗi xác thực mã QR');
      setIsQRValid(false);
      return false;
    }
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;

    // Nếu chọn thanh toán bằng MoMo, kiểm tra QR
    if (formData.paymentMethod === 'bank') {
      if (!momoQRData?.qrId) {
        alert('Chưa tạo mã QR. Vui lòng refresh để tạo mã mới.');
        return;
      }

      // Chỉ kiểm tra QR còn hạn, không validate lại từ DB
      if (remainingTime <= 0) {
        alert('Mã QR đã hết hạn. Vui lòng refresh để tạo mã mới.');
        return;
      }
    }

    setLoading(true);
    setShowReview(false);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  customerId: isLoggedIn && user?.id ? user.id : null,

          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          note: formData.note,
          paymentMethod: formData.paymentMethod,
          cartItems: cart,
          subtotal,
          discountAmount,
          totalAmount: total,
          voucherCode: appliedVoucher?.code || null,
          qrId: formData.paymentMethod === 'bank' ? momoQRData?.qrId : null,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Đặt hàng thất bại');

      setOrderSummary({
        orderCode: data.orderCode,
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city || '',
        total: total,
        appliedVoucher: appliedVoucher || undefined,
      });

      clearCart();
      localStorage.removeItem('appliedVoucher'); // Xóa voucher sau khi đặt hàng
      setOrderSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  // ==================== MÀN HÌNH THÀNH CÔNG ====================
  if (orderSuccess && orderSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua sắm tại TMDT</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left text-sm">
            <p><strong>Mã đơn:</strong> <span className="text-blue-600 font-bold">{orderSummary.orderCode}</span></p>
            <p><strong>Người nhận:</strong> {orderSummary.fullName}</p>
            <p><strong>Điện thoại:</strong> {orderSummary.phone}</p>
            <p><strong>Địa chỉ:</strong> {orderSummary.address}{orderSummary.city ? `, ${orderSummary.city}` : ''}</p>
            {orderSummary.appliedVoucher && (
              <p><strong>Mã giảm giá:</strong> {orderSummary.appliedVoucher.code}</p>
            )}
            <p className="pt-3 border-t mt-3 font-bold text-lg">
              Tổng thanh toán: <span className="text-red-600">{orderSummary.total.toLocaleString('vi-VN')}₫</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/customer/orders" className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-center">
              Theo dõi đơn hàng
            </Link>
            <Link href="/customer/products" className="flex-1 border py-3.5 rounded-xl font-semibold text-center">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return <div className="text-center py-20">Giỏ hàng trống</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black">
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1 className="text-3xl font-bold">Thanh toán</h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* FORM */}
        <div className="lg:col-span-3">
          <form onSubmit={handleProceedToReview} className="space-y-6">
            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-2xl shadow p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Truck size={22} className="text-blue-600" /> Thông tin giao hàng
                </h2>
                {isLoggedIn && <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Đã điền từ tài khoản</span>}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Họ và tên <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tỉnh / Thành phố</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Ghi chú</label>
                  <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full px-4 py-3 border rounded-xl resize-none" />
                </div>
              </div>
            </div>

            {/* Voucher Section */}
            <div className="bg-white rounded-2xl shadow p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Percent size={22} className="text-green-600" /> Mã giảm giá / Voucher
              </h2>

              {!appliedVoucher ? (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá (VD: GIAM10)"
                    className="flex-1 px-4 py-3 border rounded-xl uppercase"
                  />
                  <button 
                    type="button" 
                    onClick={applyVoucher} 
                    disabled={voucherLoading} 
                    className="px-8 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-70"
                  >
                    {voucherLoading ? 'Đang áp dụng...' : 'Áp dụng'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-green-700">{appliedVoucher.code} — {appliedVoucher.label}</p>
                    <p className="text-sm text-green-600">Đã giảm {discountAmount.toLocaleString('vi-VN')}₫</p>
                  </div>
                  <button type="button" onClick={removeVoucher} className="text-red-500 hover:text-red-600">
                    <X size={20} />
                  </button>
                </div>
              )}
              {voucherError && <p className="text-red-500 text-sm mt-2">{voucherError}</p>}
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-2xl shadow p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <CreditCard size={22} className="text-blue-600" /> Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
                  { value: 'bank', label: 'Chuyển khoản MoMo (Quét mã QR)', icon: '📱' },
                ].map((method) => (
                  <label 
                    key={method.value} 
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition 
                      ${formData.paymentMethod === method.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={method.value} 
                      checked={formData.paymentMethod === method.value} 
                      onChange={handleChange} 
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <span>{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition"
            >
              Xem lại đơn hàng & Xác nhận
            </button>
          </form>
        </div>

        {/* TÓM TẮT ĐƠN HÀNG */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow p-8 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Đơn hàng ({cart.length} sản phẩm)</h2>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {cart.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {(item.image || item.hinhanh) ? (
                      <Image src={item.image || item.hinhanh} alt={item.name || item.tensanpham} fill className="object-cover" />
                    ) : (
                      <Package className="m-auto text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.name || item.tensanpham}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(item.price || item.gia)?.toLocaleString('vi-VN')}₫ × {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {((item.price || item.gia) * item.quantity).toLocaleString('vi-VN')}₫
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-6 pt-5 space-y-2 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{subtotal.toLocaleString('vi-VN')}₫</span></div>
              {appliedVoucher && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({appliedVoucher.code})</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="flex justify-between"><span>Phí vận chuyển</span><span className="text-green-600">Miễn phí</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Tổng cộng</span>
                <span className="text-red-600">{total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW MODAL */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="text-blue-600" /> Xác nhận lại đơn hàng
            </h2>

            <div className="space-y-4 text-sm bg-gray-50 p-5 rounded-2xl mb-6">
              <div><strong>Người nhận:</strong> {formData.fullName} — {formData.phone}</div>
              <div><strong>Địa chỉ:</strong> {formData.address}{formData.city ? `, ${formData.city}` : ''}</div>
              <div><strong>Thanh toán:</strong> {formData.paymentMethod === 'cod' ? 'COD - Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng MoMo'}</div>
              {appliedVoucher && <div><strong>Voucher:</strong> {appliedVoucher.code} (-{discountAmount.toLocaleString('vi-VN')}₫)</div>}
              <div className="pt-3 border-t font-bold text-lg flex justify-between">
                <span>Tổng thanh toán</span>
                <span className="text-red-600">{total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {/* Loading QR */}
            {formData.paymentMethod === 'bank' && momoQRLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 text-center">
                <p className="text-blue-700 font-semibold">⏳ Đang tạo mã QR...</p>
              </div>
            )}

            {/* Error từ API Generate (không phải validation) */}
            {formData.paymentMethod === 'bank' && qrValidationError && !momoQRLoading && !momoQRData && (
              <div className="bg-red-50 border border-red-300 rounded-2xl p-6 mb-6">
                <p className="text-red-700 font-semibold mb-3">❌ {qrValidationError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowReview(false);
                    setQrValidationError('');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  Quay lại chỉnh sửa
                </button>
              </div>
            )}
            {formData.paymentMethod === 'bank' && momoQRData && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-4">💳 Thông tin thanh toán MoMo</h3>

                {/* Timer hết hạn */}
                <div className={`mb-4 p-3 rounded-xl text-center font-semibold ${
                  remainingTime <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  ⏱️ QR code hết hạn trong: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                  {remainingTime <= 0 && ' ❌ Đã hết hạn'}
                </div>

                {/* Error message */}
                {qrValidationError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
                    <strong>⚠️ {qrValidationError}</strong>
                  </div>
                )}

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
                  <img 
                    src={momoQRData.qrCodeDataUrl} 
                    alt="MoMo QR Code" 
                    className="w-64 h-64 object-contain border border-gray-200 rounded-lg"
                  />
                </div>

                {/* Thông tin tài khoản */}
                <div className="bg-white rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Ngân hàng:</span>
                    <span className="font-semibold">{momoQRData.bankCode}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Tên tài khoản:</span>
                    <span className="font-semibold">{momoQRData.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{momoQRData.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(momoQRData.accountNumber);
                          alert('Đã sao chép số tài khoản');
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-bold text-red-600">{total.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{momoQRData.description}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(momoQRData.description);
                          alert('Đã sao chép nội dung chuyển khoản');
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                  <strong>Hướng dẫn:</strong> Quét mã QR bằng ứng dụng MoMo hoặc ngân hàng để thanh toán. Đơn hàng sẽ được xác nhận tự động sau khi thanh toán thành công.
                </div>

                {qrUiMessage && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    {qrUiMessage}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => setShowReview(false)} 
                className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-semibold hover:bg-gray-50 transition"
              >
                Chỉnh sửa
              </button>
              <button 
                onClick={handleConfirmOrder} 
                disabled={loading || (formData.paymentMethod === 'bank' && remainingTime <= 0)} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 
                 (formData.paymentMethod === 'bank' && remainingTime <= 0) ? 'QR đã hết hạn' :
                 'Xác nhận đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}