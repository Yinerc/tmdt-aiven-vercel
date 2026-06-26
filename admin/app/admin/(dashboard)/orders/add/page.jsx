import { query } from "@/lib/db";
import { createOrder } from "../actions";
import OrderForm from "../OrderForm";

export default async function AddOrderPage() {
  const [customers, categories, products] = await Promise.all([
    query("SELECT id, hoten FROM khachhang ORDER BY hoten ASC"),
    query("SELECT id, tendanhmuc FROM danhmuc WHERE trangthai = 1 ORDER BY tendanhmuc ASC"),
    query(`
      SELECT s.id, s.tensanpham, s.gia, s.soluong, s.danhmuc_id, d.tendanhmuc
      FROM sanpham s
      LEFT JOIN danhmuc d ON s.danhmuc_id = d.id
      WHERE s.trangthai = 1
      ORDER BY d.tendanhmuc ASC, s.tensanpham ASC
    `),
  ]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Thêm đơn hàng</h2>
          <p>Trang này thay cho `donhang/add.php`.</p>
        </div>
      </div>
      <OrderForm
        action={createOrder}
        customers={customers}
        categories={categories}
        products={products}
      />
    </div>
  );
}
