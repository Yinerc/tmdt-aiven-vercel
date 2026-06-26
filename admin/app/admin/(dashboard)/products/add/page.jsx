import { query } from "@/lib/db";
import { createProduct } from "../actions";
import ProductForm from "../ProductForm";

export default async function AddProductPage() {
  const categories = await query("SELECT id, tendanhmuc FROM danhmuc ORDER BY tendanhmuc ASC");

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Thêm sản phẩm</h2>
          <p>Trang này thay cho `sanpham/add.php`.</p>
        </div>
      </div>
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
