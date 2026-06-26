// app/customer/page.tsx
import Link from 'next/link';
import { ProductCard } from '@/components/customer/ProductCard';
import { 
  ArrowRight, Truck, RotateCcw, Shield, Zap, 
  Smartphone, Tablet, Laptop, Headphones, Mouse 
} from 'lucide-react';

const CATEGORIES = [
  { id: 1, label: 'Điện thoại',        icon: Smartphone, slug: 'dien-thoai',        color: 'from-blue-500 to-indigo-600' },
  { id: 2, label: 'Máy tính bảng',     icon: Tablet,     slug: 'may-tinh-bang',     color: 'from-violet-500 to-purple-600' },
  { id: 3, label: 'Laptop',            icon: Laptop,     slug: 'laptop',            color: 'from-slate-600 to-gray-800' },
  { id: 4, label: 'Phụ kiện điện thoại', icon: Headphones, slug: 'phu-kien-dien-thoai', color: 'from-emerald-500 to-teal-600' },
  { id: 5, label: 'Phụ kiện laptop',   icon: Mouse,      slug: 'phu-kien-laptop',   color: 'from-orange-500 to-amber-600' },
];

const FEATURES = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 300.000₫' },
  { icon: RotateCcw, title: 'Đổi trả trong 30 ngày', desc: 'Miễn phí đổi trả' },
  { icon: Shield, title: 'Thanh toán bảo mật', desc: 'Mã hóa SSL 256-bit' },
  { icon: Zap, title: 'Giao hàng nhanh', desc: '1–3 ngày làm việc' },
];

export default async function CustomerHomePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products`, {
    cache: 'no-store',
  });

  const data = await res.json();
  const products = data.success ? data.data : [];
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="bg-white">
      {/* ========== HERO SECTION ========== */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[length:4px_4px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium tracking-wide">Khuyến mãi mùa hè • Giảm đến 50%</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.05] mb-6">
              Công nghệ<br />đáng tin cậy.<br />
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Giá trị thực sự.
              </span>
            </h1>

            <p className="max-w-lg text-lg text-white/70 mb-10">
              Khám phá những sản phẩm công nghệ cao cấp được chọn lọc kỹ lưỡng. 
              Trải nghiệm mua sắm tinh gọn, minh bạch và đáng tin cậy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/customer/products"
                className="inline-flex items-center justify-center gap-3 bg-white text-black font-semibold px-8 h-14 rounded-2xl hover:bg-white/90 active:scale-[0.985] transition-all"
              >
                Khám phá sản phẩm
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/customer/auth/register"
                className="inline-flex items-center justify-center gap-3 border border-white/30 hover:bg-white/5 font-medium px-8 h-14 rounded-2xl transition-all"
              >
                Tạo tài khoản miễn phí
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-12 text-sm">
              <div>
                <div className="font-semibold text-white">50k+</div>
                <div className="text-white/50">Khách hàng tin tưởng</div>
              </div>
              <div>
                <div className="font-semibold text-white">4.9/5</div>
                <div className="text-white/50">Đánh giá trung bình</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 group">
                <div className="mt-1 p-3 rounded-2xl bg-gray-100 group-hover:bg-gray-900 transition-colors">
                  <feature.icon className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">{feature.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== DANH MỤC (ĐÃ SỬA) ========== */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Danh mục sản phẩm</h2>
            <p className="text-gray-500 mt-1">Khám phá theo nhu cầu của bạn</p>
          </div>
          <Link 
            href="/customer/products" 
            className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Xem tất cả danh mục <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}                                    // ← Đã sửa
                href={`/customer/products?danhmuc_id=${category.id}`} // ← Đã sửa
                className="group relative overflow-hidden rounded-3xl border border-gray-200 hover:border-gray-300 transition-all active:scale-[0.985]"
              >
                <div className={`h-40 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <Icon className="w-14 h-14 text-white/90" strokeWidth={1.5} />
                </div>
                <div className="p-5 bg-white">
                  <div className="font-semibold text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                    {category.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">Khám phá ngay →</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========== SẢN PHẨM NỔI BẬT ========== */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Sản phẩm nổi bật</h2>
            <p className="text-gray-500 mt-1">Được khách hàng yêu thích nhất tuần này</p>
          </div>
          <Link 
            href="/customer/products" 
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 border border-dashed rounded-3xl">
            Chưa có sản phẩm nào được hiển thị.
          </div>
        )}
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className="bg-zinc-950 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm mb-6 tracking-widest">
            ƯU ĐÃI ĐỘC QUYỀN
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-4">
            Nhận ngay 10% cho đơn hàng đầu tiên
          </h2>
          <p className="text-white/60 max-w-md mx-auto mb-10">
            Tạo tài khoản để nhận voucher và theo dõi đơn hàng dễ dàng hơn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/customer/auth/register"
              className="inline-flex items-center justify-center bg-white text-black font-semibold h-14 px-10 rounded-2xl hover:bg-white/90 transition-all active:scale-[0.985]"
            >
              Đăng ký ngay — Miễn phí
            </Link>
            <Link
              href="/customer/products"
              className="inline-flex items-center justify-center border border-white/30 hover:bg-white/5 h-14 px-10 rounded-2xl transition-all"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}