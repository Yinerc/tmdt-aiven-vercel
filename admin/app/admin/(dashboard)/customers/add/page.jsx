import { createCustomer } from "../actions";
import CustomerForm from "../CustomerForm";

export default function AddCustomerPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Thêm khách hàng</h2>
          <p>Trang này thay cho `khachhang/add.php`.</p>
        </div>
      </div>
      <CustomerForm action={createCustomer} />
    </div>
  );
}
