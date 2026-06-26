// components/customer/footer.tsx
import Link from 'next/link';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-12">
          
          {/* Logo & Mô tả */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/customer" className="text-white text-2xl font-semibold tracking-tight">
              TMDT
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-xs text-gray-500">
              Nền tảng mua sắm công nghệ uy tín, mang đến những sản phẩm chất lượng cao với trải nghiệm tốt nhất.
            </p>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="text-white font-semibold mb-5 tracking-tight">Hỗ trợ</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Chính sách đổi trả</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Hướng dẫn mua hàng</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>

          {/* Về chúng tôi */}
          <div>
            <h4 className="text-white font-semibold mb-5 tracking-tight">Về TMDT</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Giới thiệu</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Tuyển dụng</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h4 className="text-white font-semibold mb-5 tracking-tight">Liên hệ</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-500" />
                <span>1900 1234</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-500" />
                <span>hotro@tmdt.vn</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-500" />
                <span>Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-5 mt-6">
              <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube size={20} /></a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-14 pt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} TMDT. All rights reserved.
        </div>
      </div>
    </footer>
  );
}