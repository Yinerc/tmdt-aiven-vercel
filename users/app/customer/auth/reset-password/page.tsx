'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
      }

      setSuccess(true);
      setTimeout(() => router.push('/customer/auth/login'), 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link không hợp lệ</h1>
          <p className="text-gray-600 mb-6">
            Link đặt lại mật khẩu không tồn tại hoặc đã hết hạn.
          </p>
          <Link href="/customer/auth/forgot-password">
            <Button className="w-full h-12">
              Gửi lại link đặt lại mật khẩu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold">
            Đặt lại mật khẩu thành công!
          </h1>
          <p className="text-gray-600 mt-2">
            Đang chuyển hướng đến trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <Link
          href="/customer/auth/login"
          className="flex items-center gap-2 text-sm text-gray-500 mb-6"
        >
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Lock size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold">Đặt lại mật khẩu</h1>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-3.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg mt-2"
          >
            {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}