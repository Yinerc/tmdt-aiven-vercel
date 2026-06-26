// admin/app/admin/(dashboard)/layout.jsx
import { requireAdmin } from "@/lib/auth";
import AdminNavbar from "@/components/AdminNavbar";
import "./admin.css";

export default async function AdminLayout({ children }) {
  await requireAdmin();

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-main">
        <section className="admin-content">{children}</section>
      </main>
    </div>
  );
}
