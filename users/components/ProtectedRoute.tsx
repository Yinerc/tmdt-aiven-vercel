// users\components\ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/customer/auth/login' 
}: ProtectedRouteProps) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push(redirectTo);
    }
  }, [isLoggedIn, loading, router, redirectTo]);

  // Đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Đã đăng nhập thì hiển thị nội dung
  if (isLoggedIn) {
    return <>{children}</>;
  }

  return null;
}