import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { updateProduct } from "../../actions";
import ProductForm from "../../ProductForm";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const products = await query("SELECT * FROM sanpham WHERE id=?", [id]);
  const product = products[0];

  if (!product) notFound();

  const categories = await query("SELECT id, tendanhmuc FROM danhmuc ORDER BY tendanhmuc ASC");

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Sửa sản phẩm</h2>
          <p>Trang này thay cho `sanpham/edit.php`.</p>
        </div>
      </div>
      <ProductForm action={updateProduct.bind(null, id)} product={product} categories={categories} />
    </div>
  );
}
