// components/customer/navbar.tsx
'use client';

import Link from 'next/link';
import { 
  ShoppingCart, User, LogOut, Package, ChevronDown, CheckCircle, Search 
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { cart } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const userName = user?.hoten || user?.email?.split('@')[0] || 'User';

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/customer/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    setLogoutSuccess(true);
    setTimeout(() => setLogoutSuccess(false), 2500);
    router.refresh();
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/customer" 
            className="text-2xl font-semibold tracking-tight text-gray-900 hover:text-black transition-colors"
          >
            TMDT
          </Link>

          {/* Search Bar - Premium style */}
          <div className="flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 pl-11 pr-4 py-2.5 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none transition-all"
              />
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-5">
            {/* Giỏ hàng */}
            <Link 
              href="/customer/cart" 
              className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-100 transition-colors relative"
            >
              <ShoppingCart size={20} className="text-gray-700" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-3 bg-red-500 text-white text-[10px] font-medium rounded-full w-4.5 h-4.5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">Giỏ hàng</span>
            </Link>

            {/* Đơn hàng */}
            <Link 
              href="/customer/orders" 
              className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <Package size={20} className="text-gray-700" />
              <span className="hidden md:block text-sm font-medium text-gray-700">Đơn hàng</span>
            </Link>

            {/* Tài khoản */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={17} className="text-gray-600" />
                  </div>
                  <div className="hidden md:flex items-center gap-1 text-sm">
                    <span className="font-medium text-gray-700">{userName}</span>
                    <ChevronDown size={15} className="text-gray-500" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-gray-100 py-2 z-50">
                    <Link 
                      href="/customer/profile" 
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 rounded-xl mx-1"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} className="text-gray-500" /> 
                      Thông tin tài khoản
                    </Link>
                    
                    <Link 
                      href="/customer/orders" 
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 rounded-xl mx-1"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Package size={16} className="text-gray-500" /> 
                      Đơn hàng của tôi
                    </Link>

                    <div className="border-t my-1 mx-3"></div>

                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-xl mx-1"
                    >
                      <LogOut size={16} /> 
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/customer/auth/login"
                className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Thông báo đăng xuất thành công */}
      {logoutSuccess && (
        <div className="fixed top-20 right-4 z-[100]">
          <div className="bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm">
            <CheckCircle size={18} />
            <span>Đã đăng xuất thành công</span>
          </div>
        </div>
      )}
    </nav>
  );
}