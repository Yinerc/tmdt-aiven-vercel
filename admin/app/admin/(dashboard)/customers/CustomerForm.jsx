import Link from "next/link";

export default function CustomerForm({ action, customer = {} }) {
  return (
    <form action={action} className="card card-body form-grid">
      <div className="form-group">
        <label>Họ tên</label>
        <input name="hoten" defaultValue={customer.hoten || ""} required />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" defaultValue={customer.email || ""} />
      </div>

      <div className="form-group">
        <label>Số điện thoại</label>
        <input name="sodienthoai" defaultValue={customer.sodienthoai || ""} />
      </div>

      <div className="form-group">
        <label>Mật khẩu</label>
        <input name="matkhau" defaultValue={customer.matkhau || ""} />
      </div>

      <div className="form-group full">
        <label>Địa chỉ</label>
        <textarea name="diachi" defaultValue={customer.diachi || ""} />
      </div>

      <div className="form-actions">
        <Link href="/admin/customers" className="btn-light">Quay lại</Link>
        <button type="submit" className="btn-primary">Lưu</button>
      </div>
    </form>
  );
}
