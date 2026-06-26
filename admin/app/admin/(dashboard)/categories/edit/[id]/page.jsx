import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { updateCategory } from "../../actions";
import CategoryForm from "../../CategoryForm";

export default async function EditCategoryPage({ params }) {
  const { id } = await params;
  const rows = await query("SELECT * FROM danhmuc WHERE id=?", [id]);
  const category = rows[0];

  if (!category) notFound();

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Sửa danh mục</h2>
          <p>Trang này thay cho `danhmuc/edit.php`.</p>
        </div>
      </div>
      <CategoryForm action={updateCategory.bind(null, id)} category={category} />
    </div>
  );
}
