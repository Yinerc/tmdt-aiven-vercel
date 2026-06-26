// users\app\customer\orders\page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, Search, 
  AlertCircle, ArrowLeft, X 
} from 'lucide-react';

interface Order {
  id: number;
  order_code: string;
  full_name?: string;
  phone?: string;
  address?: string;
  tongtien: number;           // ← Sửa từ total_amount
  trangthai: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  tensanpham: string;
  hinhanh?: string;
  soluong: number;
  dongia: number;
}

interface OrderDetail extends Order {
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Tra cứu khách vãng lai
  const [lookupForm, setLookupForm] = useState({ orderCode: '', phone: '' });
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Modal chi tiết
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Lấy đơn hàng của người đăng nhập
  const fetchMyOrders = async () => {
    if (!isLoggedIn || !user) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [user, isLoggedIn]);

  // Tra cứu đơn hàng cho khách vãng lai
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setFoundOrder(null);

    if (!lookupForm.orderCode || !lookupForm.phone) {
      setLookupError('Vui lòng nhập đầy đủ mã đơn hàng và số điện thoại');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch(
        `/api/orders/lookup?orderCode=${lookupForm.orderCode}&phone=${lookupForm.phone}`
      );
      const data = await res.json();

      if (data.success) {
        setFoundOrder(data.data);
      } else {
        setLookupError(data.message || 'Không tìm thấy đơn hàng');
      }
    } catch (err) {
      setLookupError('Đã xảy ra lỗi khi tra cứu');
    } finally {
      setLookupLoading(false);
    }
  };

  // Xem chi tiết đơn hàng
  const fetchOrderDetail = async (orderCode: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();

      if (data.success) {
        setSelectedOrder(data.data);
      } else {
        alert(data.message || 'Không thể tải chi tiết đơn hàng');
      }
    } catch (error) {
      alert('Đã xảy ra lỗi khi tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  // Trạng thái đơn hàng
  const getStatusInfo = (status: string) => {
    const map: any = {
      cho_xu_ly: { label: 'Đang chuẩn bị đơn hàng', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      dang_giao: { label: 'Đang vận chuyển', color: 'bg-purple-100 text-purple-700', icon: Truck },
      da_giao: { label: 'Đã giao hàng thành công', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return map[status] || { label: 'Chưa rõ', color: 'bg-gray-100 text-gray-600', icon: Package };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/customer" className="text-gray-500 hover:text-black flex items-center gap-2">
          <ArrowLeft size={20} /> Quay lại
        </Link>
        <h1 className="text-3xl font-bold">Đơn hàng của tôi</h1>
      </div>

      {/* Phần tra cứu khách vãng lai */}
      {!isLoggedIn && (
        <div className="max-w-xl mx-auto mb-12">
          {/* (Bạn có thể giữ nguyên phần tra cứu cũ) */}
        </div>
      )}

      {/* Danh sách đơn hàng */}
      {isLoggedIn && (
        <>
          {loading ? (
            <div className="text-center py-10">Đang tải đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-600">Bạn chưa có đơn hàng nào.</p>
              <Link href="/customer/products" className="text-blue-600 hover:underline mt-3 inline-block">
                Mua sắm ngay →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.trangthai);
                const Icon = statusInfo.icon;

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <span className="font-mono text-blue-600 font-bold text-lg">{order.order_code}</span>
                        <span className="ml-3 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${statusInfo.color}`}>
                          <Icon size={16} /> {statusInfo.label}
                        </span>
                        <span className="font-bold text-red-600 text-xl">
                          {Number(order.tongtien || 0).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={() => fetchOrderDetail(order.order_code)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
                      >
                        Xem chi tiết đơn hàng
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <div>
                <h2 className="text-2xl font-bold">Chi tiết đơn hàng</h2>
                <p className="text-blue-600 font-mono">{selectedOrder.order_code}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-black">
                <X size={28} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-3">Thông tin giao hàng</h4>
                  <div className="text-sm space-y-2">
                    <p><strong>Họ tên:</strong> {selectedOrder.full_name}</p>
                    <p><strong>SĐT:</strong> {selectedOrder.phone}</p>
                    <p><strong>Địa chỉ:</strong> {selectedOrder.address}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Thông tin thanh toán</h4>
                  <div className="text-sm space-y-2">
                    <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.created_at).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Trạng thái:</strong> {getStatusInfo(selectedOrder.trangthai).label}</p>
                    <p><strong>Tổng thanh toán:</strong> 
                      <span className="font-bold text-red-600 text-lg">
                        {Number(selectedOrder.tongtien || 0).toLocaleString('vi-VN')}₫
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold mb-4">Sản phẩm đã mua</h4>
              <div className="border rounded-2xl divide-y">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.hinhanh ? (
                        <img src={item.hinhanh} alt={item.tensanpham} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.tensanpham}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.dongia.toLocaleString('vi-VN')}₫ × {item.soluong}
                      </p>
                    </div>
                    <div className="font-semibold text-right">
                      {(item.dongia * item.soluong).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-8 py-3 border rounded-2xl hover:bg-white font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}