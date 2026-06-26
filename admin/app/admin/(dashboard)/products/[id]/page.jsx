import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const rows = await query(
    `SELECT sp.*, dm.tendanhmuc
     FROM sanpham sp
     LEFT JOIN danhmuc dm ON dm.id = sp.danhmuc_id
     WHERE sp.id=?`,
    [id]
  );
  const product = rows[0];

  if (!product) notFound();

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Chi tiết sản phẩm</h2>
          <p>Trang này thay cho `sanpham/detail.php`.</p>
        </div>
        <div className="action-row">
          <Link href="/admin/products" className="btn-light">Quay lại</Link>
          <Link href={`/admin/products/edit/${product.id}`} className="btn-primary">Sửa</Link>
        </div>
      </div>

      <div className="card card-body detail-grid">
        <div className="label">ID</div><div>{product.id}</div>
        <div className="label">Tên sản phẩm</div><div>{product.tensanpham}</div>
        <div className="label">Danh mục</div><div>{product.tendanhmuc || "Chưa có"}</div>
        <div className="label">Giá</div><div>{formatCurrency(product.gia)}</div>
        <div className="label">Số lượng</div><div>{product.soluong}</div>
        <div className="label">Trạng thái</div><div>{product.trangthai ? "Hiển thị" : "Ẩn"}</div>
        <div className="label">Ngày tạo</div><div>{formatDate(product.created_at)}</div>
        <div className="label">Mô tả</div><div>{product.mota || ""}</div>
      </div>
    </div>
  );
}
