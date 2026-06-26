// admin/components/AdminNavbar.jsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Folder, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Sparkles, 
  LogOut,
  User
} from "lucide-react";

export default function AdminNavbar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Sản phẩm", icon: Package },
    { href: "/admin/categories", label: "Danh mục", icon: Folder },
    { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
    { href: "/admin/customers", label: "Khách hàng", icon: Users },
    { href: "/admin/reports", label: "Thống kê", icon: BarChart3 },
    { href: "/admin/ai-content", label: "Nội dung AI", icon: Sparkles },
  ];

  return (
    <nav className="admin-navbar">
      <div className="navbar-container">
        {/* Left Side: Logo */}
        <Link href="/admin/dashboard" className="admin-logo">
          TMDT Admin
        </Link>

        {/* Center: Navigation Links */}
        <div className="navbar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/admin/dashboard" 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`menu-link ${isActive ? "active" : ""}`}
              >
                <Icon size={16} className="menu-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side: Profile & Logout */}
        <div className="navbar-right">
          <div className="header-profile">
            <div className="profile-avatar">
              <User size={15} />
            </div>
            <div className="profile-info">
              <span className="profile-name">Quản trị viên</span>
            </div>
          </div>
          
          <div className="navbar-divider"></div>

          <Link href="/admin/logout" className="logout-btn" title="Đăng xuất">
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
