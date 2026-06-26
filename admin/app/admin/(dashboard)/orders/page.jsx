import Link from "next/link";
import { query } from "@/lib/db";
import { formatCurrency, formatDate, statusLabel } from "@/lib/format";
import { deleteOrder } from "./actions";

export default async function OrdersPage() {
  const orders = await query(
    `SELECT dh.*, kh.hoten
     FROM donhang dh
     LEFT JOIN khachhang kh ON kh.id = dh.khachhang_id
     ORDER BY dh.id DESC`
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Quản lý đơn hàng</h2>
        </div>
        <Link href="/admin/orders/add" className="btn-primary">+ Thêm đơn hàng</Link>
      </div>

      <div className="card table-wrap">
        {orders.length === 0 ? <div className="empty">Chưa có đơn hàng.</div> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.hoten || "Khách lẻ"}</td>
                  <td>{formatCurrency(item.tongtien)}</td>
                  <td><span className="badge">{statusLabel(item.trangthai)}</span></td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <div className="action-row">
                      <Link className="btn" href={`/admin/orders/${item.id}`}>Chi tiết</Link>
                      <Link className="btn" href={`/admin/orders/edit/${item.id}`}>Sửa</Link>
                      <form action={deleteOrder.bind(null, item.id)}>
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
