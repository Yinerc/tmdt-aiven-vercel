import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { updateOrder } from "../../actions";
import OrderForm from "../../OrderForm";

export default async function EditOrderPage({ params }) {
  const { id } = await params;

  const [rows, customers, categories, products, details] = await Promise.all([
    query("SELECT * FROM donhang WHERE id=?", [id]),
    query("SELECT id, hoten FROM khachhang ORDER BY hoten ASC"),
    query("SELECT id, tendanhmuc FROM danhmuc WHERE trangthai = 1 ORDER BY tendanhmuc ASC"),
    query(`
      SELECT s.id, s.tensanpham, s.gia, s.soluong, s.danhmuc_id, d.tendanhmuc
      FROM sanpham s
      LEFT JOIN danhmuc d ON s.danhmuc_id = d.id
      WHERE s.trangthai = 1
      ORDER BY d.tendanhmuc ASC, s.tensanpham ASC
    `),
    query(`
      SELECT ct.sanpham_id, ct.soluong, ct.dongia, s.tensanpham, s.danhmuc_id, d.tendanhmuc
      FROM donhang_chitiet ct
      LEFT JOIN sanpham s ON s.id = ct.sanpham_id
      LEFT JOIN danhmuc d ON d.id = s.danhmuc_id
      WHERE ct.donhang_id = ?
    `, [id]),
  ]);

  const order = rows[0];
  if (!order) notFound();

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Sửa đơn hàng</h2>
          <p>Trang này thay cho `donhang/edit.php`.</p>
        </div>
      </div>
      <OrderForm
        action={updateOrder.bind(null, id)}
        order={order}
        customers={customers}
        categories={categories}
        products={products}
        existingItems={details}
      />
    </div>
  );
}
