// users\app\customer\auth\forgot-password\page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Gửi email thất bại');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi email khôi phục');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Email đã được gửi!</h1>
          <p className="text-gray-600 mb-6">
            Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.
          </p>
          <Link href="/customer/auth/login">
            <Button className="w-full h-12">Quay lại đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <Link href="/customer/auth/login" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Mail size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold">Quên mật khẩu?</h1>
          <p className="text-gray-600 mt-2">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-2">Email đã đăng ký</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border rounded-2xl"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12">
            {loading ? 'Đang gửi...' : 'Gửi link khôi phục mật khẩu'}
          </Button>
        </form>
      </div>
    </div>
  );
}