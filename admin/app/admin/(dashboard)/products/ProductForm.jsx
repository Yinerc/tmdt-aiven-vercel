import Link from "next/link";

export default function ProductForm({ action, product = {}, categories = [] }) {
  return (
    <form action={action} className="card card-body form-grid">
      <div className="form-group">
        <label>Tên sản phẩm</label>
        <input name="tensanpham" defaultValue={product.tensanpham || ""} required />
      </div>

      <div className="form-group">
        <label>Danh mục</label>
        <select name="danhmuc_id" defaultValue={product.danhmuc_id || ""}>
          <option value="">-- Chọn danh mục --</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.tendanhmuc}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Giá</label>
        <input name="gia" type="number" min="0" defaultValue={product.gia || 0} />
      </div>

      <div className="form-group">
        <label>Số lượng</label>
        <input name="soluong" type="number" min="0" defaultValue={product.soluong || 0} />
      </div>

      <div className="form-group full">
        <label>Hình ảnh / URL ảnh</label>
        <input name="hinhanh" defaultValue={product.hinhanh || ""} placeholder="/images/product.jpg hoặc link ảnh" />
      </div>

      <div className="form-group">
        <label>Trạng thái</label>
        <select name="trangthai" defaultValue={product.trangthai ?? 1}>
          <option value="1">Hiển thị</option>
          <option value="0">Ẩn</option>
        </select>
      </div>

      <div className="form-group full">
        <label>Mô tả</label>
        <textarea name="mota" defaultValue={product.mota || ""} />
      </div>

      <div className="form-actions">
        <Link href="/admin/products" className="btn-light">Quay lại</Link>
        <button type="submit" className="btn-primary">Lưu</button>
      </div>
    </form>
  );
}
