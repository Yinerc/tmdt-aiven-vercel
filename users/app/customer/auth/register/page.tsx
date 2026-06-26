// users\app\customer\auth\register\page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h1>
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.
          </p>
          <Button onClick={() => router.push('/customer/auth/login')} className="w-full h-12">
            Đến trang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tạo tài khoản</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-2">Họ và tên</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 border rounded-2xl" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border rounded-2xl" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mật khẩu</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border rounded-2xl" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu</label>
            <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 border rounded-2xl" required />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-lg mt-2">
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm">
          Đã có tài khoản? <Link href="/customer/auth/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}