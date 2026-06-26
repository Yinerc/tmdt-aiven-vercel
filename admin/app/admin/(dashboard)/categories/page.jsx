import Link from "next/link";
import { query } from "@/lib/db";
import { deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const categories = await query("SELECT * FROM danhmuc ORDER BY id DESC");

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Quản lý danh mục</h2>
        </div>
        <Link href="/admin/categories/add" className="btn-primary">+ Thêm danh mục</Link>
      </div>

      <div className="card table-wrap">
        {categories.length === 0 ? <div className="empty">Chưa có danh mục.</div> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.tendanhmuc}</td>
                  <td>{item.mota}</td>
                  <td><span className="badge">{item.trangthai ? "Hiển thị" : "Ẩn"}</span></td>
                  <td>
                    <div className="action-row">
                      <Link className="btn" href={`/admin/categories/edit/${item.id}`}>Sửa</Link>
                      <form action={deleteCategory.bind(null, item.id)}>
                        <button className="btn-danger" type="submit">Xóa</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
