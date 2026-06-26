import { query } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import ReportsPage from "../reports/page";

async function countTable(table) {
  try {
    const rows = await query(`SELECT COUNT(*) AS total FROM ${table}`);
    return rows[0]?.total || 0;
  } catch {
    return 0;
  }
}

async function sumRevenue() {
  try {
    const rows = await query("SELECT SUM(tongtien) AS total FROM donhang");
    return rows[0]?.total || 0;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const [products, categories, orders, customers,reports, revenue] = await Promise.all([
    countTable("sanpham"),
    countTable("danhmuc"),
    countTable("donhang"),
    countTable("khachhang"),
    sumRevenue(),
  ]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Sản phẩm</span>
          <strong>{products}</strong>
        </div>
        <div className="stat-card">
          <span>Danh mục</span>
          <strong>{categories}</strong>
        </div>
        <div className="stat-card">
          <span>Đơn hàng</span>
          <strong>{orders}</strong>
        </div>
        <div className="stat-card">
          <span>Khách hàng</span>
          <strong>{customers}</strong>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-body">
          <h3 style={{ marginTop: 0 }}>Doanh thu</h3>
          <strong style={{ fontSize: 28 }}>{formatCurrency(revenue)}</strong>
        </div>
      </div>
    </div>
  );
}
