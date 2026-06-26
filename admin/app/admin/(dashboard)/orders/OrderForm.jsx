import Link from "next/link";
import ProductPicker from "./ProductPicker";

export default function OrderForm({
  action,
  order = {},
  customers = [],
  categories = [],
  products = [],
  existingItems = [],
}) {
  return (
    <form action={action} className="card card-body form-grid">

      {/* Khách hàng */}
      <div className="form-group">
        <label>Khách hàng</label>
        <select name="khachhang_id" defaultValue={order.khachhang_id || ""}>
          <option value="">-- Chọn khách hàng --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.hoten}</option>
          ))}
        </select>
      </div>

      {/* Trạng thái */}
      <div className="form-group">
        <label>Trạng thái</label>
        <select name="trangthai" defaultValue={order.trangthai || "cho_xu_ly"}>
          <option value="cho_xu_ly">Chờ xử lý</option>
          <option value="dang_giao">Đang giao</option>
          <option value="da_giao">Đã giao</option>
          <option value="da_huy">Đã hủy</option>
        </select>
      </div>

      {/* Ghi chú */}
      <div className="form-group full">
        <label>Ghi chú</label>
        <textarea name="ghichu" defaultValue={order.ghichu || ""} />
      </div>

      {/* Chọn sản phẩm — cả thêm mới lẫn sửa */}
      <div className="form-group full">
        <label>Sản phẩm</label>
        <ProductPicker
          categories={categories}
          products={products}
          defaultItems={existingItems}
        />
      </div>

      <div className="form-actions">
        <Link href="/admin/orders" className="btn-light">Quay lại</Link>
        <button type="submit" className="btn-primary">Lưu</button>
      </div>

    </form>
  );
}
