import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';

export const metadata: Metadata = {
  title: 'TMDT - Mua sắm trực tuyến',
  description: 'Nền tảng thương mại điện tử hiện đại',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}