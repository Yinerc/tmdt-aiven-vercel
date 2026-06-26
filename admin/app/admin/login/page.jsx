// admin/app/admin/login/page.jsx
import { loginAction } from "./actions";
import "../login.css";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  let errorMessage = "";

  if (params?.error === "1") {
    errorMessage = "Sai email hoặc mật khẩu.";
  }

  if (params?.error === "empty") {
    errorMessage = "Vui lòng nhập đầy đủ email và mật khẩu.";
  }

  return (
    <main className="login-page">

      {/* ===== LEFT: Branding Panel ===== */}
      <div className="login-left">
        <div className="circle-accent"></div>

        <div className="login-brand-area">
          <div className="brand-icon-wrap">🛡️</div>

          <h2 className="brand-site-name">TMDT Admin</h2>
          <p className="brand-tagline">
            Hệ thống quản trị thương mại điện tử — an toàn, nhanh chóng và toàn diện.
          </p>

          <div className="brand-features">
            <div className="brand-feature-item">
              <span className="feature-icon">📦</span>
              <span className="feature-text">Quản lý sản phẩm & danh mục dễ dàng</span>
            </div>
            <div className="brand-feature-item">
              <span className="feature-icon">🛒</span>
              <span className="feature-text">Theo dõi & xử lý đơn hàng theo thời gian thực</span>
            </div>
            <div className="brand-feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">Báo cáo thống kê doanh thu chi tiết</span>
            </div>
            <div className="brand-feature-item">
              <span className="feature-icon">✨</span>
              <span className="feature-text">Tạo nội dung thông minh bằng AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Login Form Panel ===== */}
      <div className="login-right">
        <form action={loginAction} className="login-box">

          <div className="login-badge">
            🔒 Khu vực bảo mật
          </div>

          <h1>Đăng nhập Admin</h1>
          <p>Nhập tài khoản quản trị để vào dashboard.</p>

          {errorMessage && (
            <div className="login-error">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="form-field">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                name="email"
                type="email"
                placeholder="admin@gmail.com"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Mật khẩu</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit">Đăng nhập →</button>

          <div className="login-footer-note">
            <span>🛡️</span>
            <span>Kết nối bảo mật SSL 256-bit</span>
          </div>

        </form>
      </div>

    </main>
  );
}