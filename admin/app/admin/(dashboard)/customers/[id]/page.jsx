import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  const rows = await query("SELECT * FROM khachhang WHERE id=?", [id]);
  const customer = rows[0];

  if (!customer) notFound();

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Chi tiết khách hàng</h2>
          <p>Trang này thay cho `khachhang/detail.php`.</p>
        </div>
        <div className="action-row">
          <Link href="/admin/customers" className="btn-light">Quay lại</Link>
          <Link href={`/admin/customers/edit/${customer.id}`} className="btn-primary">Sửa</Link>
        </div>
      </div>

      <div className="card card-body detail-grid">
        <div className="label">ID</div><div>{customer.id}</div>
        <div className="label">Họ tên</div><div>{customer.hoten}</div>
        <div className="label">Email</div><div>{customer.email}</div>
        <div className="label">Số điện thoại</div><div>{customer.sodienthoai}</div>
        <div className="label">Địa chỉ</div><div>{customer.diachi}</div>
        <div className="label">Ngày tạo</div><div>{formatDate(customer.created_at)}</div>
      </div>
    </div>
  );
}
