import Link from "next/link";
import styles from "./reports.module.css";
import { getReportData } from "@/lib/reportQueries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function money(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function number(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function date(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ReportsPage() {
  const {
    stats,
    revenueByMonth,
    orderStatus,
    productsByCategory,
    recentOrders,
    topProducts,
    lowStockProducts,
    meta,
  } = await getReportData();

  const maxRevenue = Math.max(...revenueByMonth.map((item) => Number(item.revenue || 0)), 1);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin / Báo cáo</p>
          <h1>Thống kê & báo cáo</h1>
          <p className={styles.subTitle}>
            Dữ liệu lấy trực tiếp từ database <b>{meta.database}</b>: <code>danhmuc</code>, <code>sanpham</code>, <code>khachhang</code>, <code>donhang</code>, <code>donhang_chitiet</code>.
          </p>
        </div>

        <Link className={styles.exportButton} href="/admin/reports/export">
          Xuất CSV
        </Link>
      </div>

      <section className={styles.cards}>
        <article className={styles.card}>
          <span>Tổng sản phẩm</span>
          <strong>{number(stats.totalProducts)}</strong>
          <small>Bảng sanpham</small>
        </article>
        <article className={styles.card}>
          <span>Sản phẩm đang bán</span>
          <strong>{number(stats.activeProducts)}</strong>
          <small>trangthai = 1</small>
        </article>
        <article className={styles.card}>
          <span>Danh mục</span>
          <strong>{number(stats.totalCategories)}</strong>
          <small>Bảng danhmuc</small>
        </article>
        <article className={styles.card}>
          <span>Khách hàng</span>
          <strong>{number(stats.totalCustomers)}</strong>
          <small>Bảng khachhang</small>
        </article>
        <article className={styles.card}>
          <span>Tổng đơn hàng</span>
          <strong>{number(stats.totalOrders)}</strong>
          <small>Bảng donhang</small>
        </article>
        <article className={styles.card}>
          <span>Doanh thu</span>
          <strong>{money(stats.totalRevenue)}</strong>
          <small>Không tính đơn đã hủy</small>
        </article>
        <article className={styles.card}>
          <span>Thuế VAT (10%)</span>
          <strong>{money(stats.totalVAT)}</strong>
          <small>Đơn đã giao</small>
        </article>
        <article className={styles.card}>
          <span>Sắp hết hàng</span>
          <strong>{number(stats.lowStock)}</strong>
          <small>Số lượng ≤ 5</small>
        </article>
        <article className={styles.card}>
          <span>Giá trị tồn kho</span>
          <strong>{money(stats.totalInventoryValue)}</strong>
          <small>gia × soluong</small>
        </article>
      </section>

      <section className={styles.gridTwo}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Doanh thu theo tháng</h2>
            <span>6 tháng gần nhất</span>
          </div>

          {revenueByMonth.length > 0 ? (
            <div className={styles.chartList}>
              {revenueByMonth.map((item) => {
                const percent = Math.max((Number(item.revenue || 0) / maxRevenue) * 100, 2);
                return (
                  <div className={styles.chartRow} key={item.month}>
                    <span>{item.month}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.bar} style={{ width: `${percent}%` }} />
                    </div>
                    <b>{money(item.revenue)}</b>
                    <small>{number(item.order_count)} đơn</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>Chưa có dữ liệu doanh thu theo tháng.</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Trạng thái đơn hàng</h2>
            <span>Theo cột donhang.trangthai</span>
          </div>

          {orderStatus.length > 0 ? (
            <div className={styles.statusList}>
              {orderStatus.map((item) => (
                <div className={styles.statusItem} key={item.status || "unknown"}>
                  <div>
                    <span>{item.label}</span>
                    <small>{money(item.revenue)}</small>
                  </div>
                  <strong>{number(item.count)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Chưa có dữ liệu trạng thái đơn hàng.</p>
          )}
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Sản phẩm theo danh mục</h2>
          <span>Tổng sản phẩm, tồn kho và giá trị tồn</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Danh mục</th>
                <th>Số sản phẩm</th>
                <th>Tổng tồn kho</th>
                <th>Giá trị tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {productsByCategory.length > 0 ? (
                productsByCategory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category_name}</td>
                    <td>{number(item.product_count)}</td>
                    <td>{number(item.stock_total)}</td>
                    <td>{money(item.inventory_value)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">Chưa có dữ liệu danh mục.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.gridTwo}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Đơn hàng gần đây</h2>
            <Link href="/admin/orders">Xem đơn hàng</Link>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>
                        <b>{order.customer_name || "Khách lẻ"}</b>
                        {order.customer_email ? <small>{order.customer_email}</small> : null}
                      </td>
                      <td>{money(order.total)}</td>
                      <td>{order.label}</td>
                      <td>{date(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">Chưa có đơn hàng.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Sản phẩm bán chạy</h2>
            <Link href="/admin/products">Xem sản phẩm</Link>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đã bán</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.product_name}</td>
                      <td>{number(product.sold_quantity)}</td>
                      <td>{money(product.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">Chưa có dữ liệu sản phẩm bán chạy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Sản phẩm sắp hết hàng</h2>
          <span>Sắp xếp theo số lượng tồn tăng dần</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>#{product.id}</td>
                    <td>{product.product_name}</td>
                    <td>{product.category_name}</td>
                    <td>{money(product.price)}</td>
                    <td>{number(product.stock)}</td>
                    <td>{product.status_label}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">Chưa có dữ liệu tồn kho.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
