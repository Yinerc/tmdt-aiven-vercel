// admin\app\register\page.jsx
import Link from "next/link";
import { registerCustomer } from "./actions";
import styles from "./register.module.css";

export const metadata = {
  title: "Đăng ký tài khoản",
};

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error || "";
  const success = params?.success === "1";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.leftPanel}>
          <Link href="/" className={styles.logo}>
            TMDT Store
          </Link>
          <h1>Tạo tài khoản khách hàng</h1>
          <p>
            Đăng ký tài khoản để đặt hàng, theo dõi đơn hàng và lưu thông tin mua sắm nhanh hơn.
          </p>

          <div className={styles.benefits}>
            <span>✓ Đặt hàng nhanh hơn</span>
            <span>✓ Lưu thông tin liên hệ</span>
            <span>✓ Theo dõi lịch sử mua hàng</span>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <span>Khách hàng</span>
            <h2>Đăng ký</h2>
            <p>Nhập thông tin bên dưới để tạo tài khoản mới.</p>
          </div>

          {success && (
            <div className={styles.successBox}>
              Đăng ký thành công. Bạn có thể tiếp tục mua sắm trên website.
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <form action={registerCustomer} className={styles.form}>
            <label>
              Họ và tên <strong>*</strong>
              <input name="fullName" type="text" placeholder="Nguyễn Văn A" required />
            </label>

            <label>
              Email <strong>*</strong>
              <input name="email" type="email" placeholder="email@example.com" required />
            </label>

            <label>
              Số điện thoại
              <input name="phone" type="tel" placeholder="0901234567" />
            </label>

            <label>
              Địa chỉ
              <textarea name="address" rows="3" placeholder="Nhập địa chỉ nhận hàng" />
            </label>

            <div className={styles.twoColumns}>
              <label>
                Mật khẩu <strong>*</strong>
                <input name="password" type="password" placeholder="Tối thiểu 6 ký tự" required />
              </label>

              <label>
                Nhập lại mật khẩu <strong>*</strong>
                <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" required />
              </label>
            </div>

            <button type="submit">Tạo tài khoản</button>
          </form>

          <p className={styles.loginText}>
            Đã có tài khoản? <Link href="admin/login">Đăng nhập</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
