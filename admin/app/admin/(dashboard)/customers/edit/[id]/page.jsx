import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { updateCustomer } from "../../actions";
import CustomerForm from "../../CustomerForm";

export default async function EditCustomerPage({ params }) {
  const { id } = await params;
  const rows = await query("SELECT * FROM khachhang WHERE id=?", [id]);
  const customer = rows[0];

  if (!customer) notFound();

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Sửa khách hàng</h2>
          <p>Trang này thay cho `khachhang/edit.php`.</p>
        </div>
      </div>
      <CustomerForm action={updateCustomer.bind(null, id)} customer={customer} />
    </div>
  );
}
