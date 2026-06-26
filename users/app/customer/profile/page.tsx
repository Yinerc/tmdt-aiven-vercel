// users\app\customer\profile\page.tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.hoten || '',
    phone: user?.sodienthoai || '',
    address: user?.diachi || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Cập nhật lại thông tin trong context
        login({
          ...user,
          hoten: formData.fullName,
          sodienthoai: formData.phone,
          diachi: formData.address,
        });

        setMessage('Cập nhật thông tin thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      alert('Đã xảy ra lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Thông tin tài khoản</h1>

        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          {/* Email */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Mail size={16} /> Email
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border rounded-xl bg-gray-100"
            />
          </div>

          {/* Họ và tên */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User size={16} /> Họ và tên
            </label>
            <input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Phone size={16} /> Số điện thoại
            </label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <MapPin size={16} /> Địa chỉ
            </label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>

          {/* Thông báo */}
          {message && (
            <div className="text-green-600 text-sm font-medium bg-green-50 p-3 rounded-xl">
              {message}
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full h-12 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}