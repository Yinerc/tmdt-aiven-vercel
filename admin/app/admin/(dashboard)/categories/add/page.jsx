import { createCategory } from "../actions";
import CategoryForm from "../CategoryForm";

export default function AddCategoryPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Thêm danh mục</h2>
        </div>
      </div>
      <CategoryForm action={createCategory} />
    </div>
  );
}
