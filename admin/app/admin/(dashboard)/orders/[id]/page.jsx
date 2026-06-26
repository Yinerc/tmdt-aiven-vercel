import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { formatCurrency, formatDate, statusLabel } from "@/lib/format";

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const rows = await query(
    `SELECT dh.*, kh.hoten, kh.email, kh.sodienthoai, kh.diachi
     FROM donhang dh
     LEFT JOIN khachhang kh ON kh.id = dh.khachhang_id
     WHERE dh.id=?`,
    [id]
  );
  const order = rows[0];

  if (!order) notFound();

  const details = await query(
    `SELECT ct.*, sp.tensanpham
     FROM donhang_chitiet ct
     LEFT JOIN sanpham sp ON sp.id = ct.sanpham_id
     WHERE ct.donhang_id=?`,
    [id]
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Chi tiết đơn hàng</h2>
        </div>
        <div className="action-row">
          <Link href="/admin/orders" className="btn-light">Quay lại</Link>
          <Link href={`/admin/orders/edit/${order.id}`} className="btn-primary">Sửa</Link>
        </div>
      </div>

      <div className="card card-body detail-grid">
        <div className="label">Mã đơn</div><div>#{order.id}</div>
        <div className="label">Khách hàng</div><div>{order.hoten || "Khách lẻ"}</div>
        <div className="label">Email</div><div>{order.email || ""}</div>
        <div className="label">SĐT</div><div>{order.sodienthoai || ""}</div>
        <div className="label">Địa chỉ</div><div>{order.diachi || ""}</div>
        <div className="label">Tổng tiền</div><div>{formatCurrency(order.tongtien)}</div>
        <div className="label">Trạng thái</div><div>{statusLabel(order.trangthai)}</div>
        <div className="label">Ngày tạo</div><div>{formatDate(order.created_at)}</div>
        <div className="label">Ghi chú</div><div>{order.ghichu || ""}</div>
      </div>

      <div className="page-head" style={{ marginTop: 20 }}>
        <div><h2>Chi tiết sản phẩm trong đơn</h2></div>
      </div>
      <div className="card table-wrap">
        {details.length === 0 ? <div className="empty">Chưa có chi tiết đơn hàng.</div> : (
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item) => (
                <tr key={item.id}>
                  <td>{item.tensanpham || "Sản phẩm đã xóa"}</td>
                  <td>{item.soluong}</td>
                  <td>{formatCurrency(item.dongia)}</td>
                  <td>{formatCurrency(Number(item.soluong) * Number(item.dongia))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
