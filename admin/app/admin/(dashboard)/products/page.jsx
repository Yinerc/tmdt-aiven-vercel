import Link from "next/link";
import { query } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { deleteProduct } from "./actions";

export default async function ProductsPage() {
  const products = await query(
    `SELECT sp.*, dm.tendanhmuc
     FROM sanpham sp
     LEFT JOIN danhmuc dm ON dm.id = sp.danhmuc_id
     ORDER BY sp.id DESC`
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Quản lý sản phẩm</h2>
          </div>
        <Link href="/admin/products/add" className="btn-primary">+ Thêm sản phẩm</Link>
      </div>

      <div className="card table-wrap">
        {products.length === 0 ? (
          <div className="empty">Chưa có sản phẩm.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.tensanpham}</td>
                  <td>{item.tendanhmuc || "Chưa có"}</td>
                  <td>{formatCurrency(item.gia)}</td>
                  <td>{item.soluong}</td>
                  <td><span className="badge">{item.trangthai ? "Hiển thị" : "Ẩn"}</span></td>
                  <td>
                    <div className="action-row">
                      <Link className="btn" href={`/admin/products/${item.id}`}>Chi tiết</Link>
                      <Link className="btn" href={`/admin/products/edit/${item.id}`}>Sửa</Link>
                      <form action={deleteProduct.bind(null, item.id)}>
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
