import Link from "next/link";
import { query } from "@/lib/db";
import { deleteCustomer } from "./actions";

export default async function CustomersPage() {
  const customers = await query("SELECT * FROM khachhang ORDER BY id DESC");

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Quản lý khách hàng</h2>
        </div>
        <Link href="/admin/customers/add" className="btn-primary">+ Thêm khách hàng</Link>
      </div>

      <div className="card table-wrap">
        {customers.length === 0 ? <div className="empty">Chưa có khách hàng.</div> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.hoten}</td>
                  <td>{item.email}</td>
                  <td>{item.sodienthoai}</td>
                  <td>{item.diachi}</td>
                  <td>
                    <div className="action-row">
                      <Link className="btn" href={`/admin/customers/${item.id}`}>Chi tiết</Link>
                      <Link className="btn" href={`/admin/customers/edit/${item.id}`}>Sửa</Link>
                      <form action={deleteCustomer.bind(null, item.id)}>
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
