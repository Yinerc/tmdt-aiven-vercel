import Link from "next/link";

export default function CategoryForm({ action, category = {} }) {
  return (
    <form action={action} className="card card-body form-grid">
      <div className="form-group">
        <label>Tên danh mục</label>
        <input name="tendanhmuc" defaultValue={category.tendanhmuc || ""} required />
      </div>

      <div className="form-group">
        <label>Trạng thái</label>
        <select name="trangthai" defaultValue={category.trangthai ?? 1}>
          <option value="1">Hiển thị</option>
          <option value="0">Ẩn</option>
        </select>
      </div>

      <div className="form-group full">
        <label>Mô tả</label>
        <textarea name="mota" defaultValue={category.mota || ""} />
      </div>

      <div className="form-actions">
        <Link href="/admin/categories" className="btn-light">Quay lại</Link>
        <button type="submit" className="btn-primary">Lưu</button>
      </div>
    </form>
  );
}
