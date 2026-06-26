// users\app\customer\layout.tsx
'use client';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/hooks/useCart';
import Navbar from '@/components/customer/navbar';
import Footer from '@/components/customer/footer';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}