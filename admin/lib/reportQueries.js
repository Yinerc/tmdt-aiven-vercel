import { query } from "@/lib/db";

const CANCELLED_STATUSES = ["da_huy", "đã hủy", "huy", "cancelled", "canceled"];

async function rows(sql, params = []) {
  return (await query(sql, params)) || [];
}

async function scalar(sql, params = []) {
  const result = await rows(sql, params);
  const firstRow = result?.[0] || {};
  const value = firstRow.value ?? Object.values(firstRow)[0] ?? 0;
  return Number(value) || 0;
}

function statusLabel(status) {
  const value = String(status || "").toLowerCase();

  const labels = {
    cho_xu_ly: "Chờ xử lý",
    dang_xu_ly: "Đang xử lý",
    dang_giao: "Đang giao",
    da_giao: "Đã giao",
    hoan_thanh: "Hoàn thành",
    da_huy: "Đã hủy",
    huy: "Đã hủy",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
  };

  return labels[value] || status || "Không rõ";
}

function orderValidWhere(alias = "") {
  const prefix = alias ? `${alias}.` : "";
  const placeholders = CANCELLED_STATUSES.map(() => "?").join(", ");
  return `${prefix}trangthai NOT IN (${placeholders})`;
}

export async function getReportData() {
  const [
  totalProducts,
  activeProducts,
  totalCategories,
  totalCustomers,
  totalOrders,
  totalRevenue,
  totalVAT,
  lowStock,
  totalInventoryValue,
] = await Promise.all([
    scalar("SELECT COUNT(*) AS value FROM sanpham"),
    scalar("SELECT COUNT(*) AS value FROM sanpham WHERE trangthai = 1"),
    scalar("SELECT COUNT(*) AS value FROM danhmuc"),
    scalar("SELECT COUNT(*) AS value FROM khachhang"),
    scalar("SELECT COUNT(*) AS value FROM donhang"),
    scalar(
      `SELECT COALESCE(SUM(tongtien), 0) AS value
       FROM donhang
       WHERE ${orderValidWhere()}`,
      CANCELLED_STATUSES
    ),
    scalar(
  `SELECT COALESCE(SUM(tongtien * 0.1), 0) AS value
   FROM donhang
   WHERE trangthai = 'da_giao'`
),
    scalar("SELECT COUNT(*) AS value FROM sanpham WHERE soluong <= 5"),
    scalar("SELECT COALESCE(SUM(gia * soluong), 0) AS value FROM sanpham"),
  ]);

  const revenueByMonth = (
    await rows(
      `SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          COUNT(*) AS order_count,
          COALESCE(SUM(tongtien), 0) AS revenue
       FROM donhang
       WHERE ${orderValidWhere()}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      CANCELLED_STATUSES
    )
  ).reverse();

  const orderStatus = await rows(
    `SELECT
        trangthai AS status,
        COUNT(*) AS count,
        COALESCE(SUM(tongtien), 0) AS revenue
     FROM donhang
     GROUP BY trangthai
     ORDER BY count DESC`
  );

  const productsByCategory = await rows(
    `SELECT
        dm.id,
        dm.tendanhmuc AS category_name,
        COUNT(sp.id) AS product_count,
        COALESCE(SUM(sp.soluong), 0) AS stock_total,
        COALESCE(SUM(sp.gia * sp.soluong), 0) AS inventory_value
     FROM danhmuc dm
     LEFT JOIN sanpham sp ON sp.danhmuc_id = dm.id
     GROUP BY dm.id, dm.tendanhmuc
     ORDER BY product_count DESC, dm.tendanhmuc ASC`
  );

  const recentOrders = await rows(
    `SELECT
        dh.id,
        COALESCE(kh.hoten, 'Khách lẻ') AS customer_name,
        COALESCE(kh.email, '') AS customer_email,
        dh.tongtien AS total,
        dh.trangthai AS status,
        dh.ghichu,
        dh.created_at
     FROM donhang dh
     LEFT JOIN khachhang kh ON kh.id = dh.khachhang_id
     ORDER BY dh.created_at DESC, dh.id DESC
     LIMIT 10`
  );

  const topProducts = await rows(
    `SELECT
        sp.id,
        sp.tensanpham AS product_name,
        COALESCE(SUM(ct.soluong), 0) AS sold_quantity,
        COALESCE(SUM(ct.soluong * ct.dongia), 0) AS revenue
     FROM sanpham sp
     LEFT JOIN donhang_chitiet ct ON ct.sanpham_id = sp.id
     LEFT JOIN donhang dh ON dh.id = ct.donhang_id
     WHERE dh.id IS NULL OR ${orderValidWhere("dh")}
     GROUP BY sp.id, sp.tensanpham
     ORDER BY sold_quantity DESC, revenue DESC, sp.id DESC
     LIMIT 10`,
    CANCELLED_STATUSES
  );

  const lowStockProducts = await rows(
    `SELECT
        sp.id,
        sp.tensanpham AS product_name,
        COALESCE(dm.tendanhmuc, 'Chưa có danh mục') AS category_name,
        sp.gia AS price,
        sp.soluong AS stock,
        sp.trangthai AS status,
        sp.created_at
     FROM sanpham sp
     LEFT JOIN danhmuc dm ON dm.id = sp.danhmuc_id
     ORDER BY sp.soluong ASC, sp.id DESC
     LIMIT 10`
  );

  return {
      stats: {
      totalProducts,
      activeProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      totalRevenue,
      totalVAT,
      lowStock,
      totalInventoryValue,
    },
    revenueByMonth,
    orderStatus: orderStatus.map((item) => ({
      ...item,
      label: statusLabel(item.status),
    })),
    productsByCategory,
    recentOrders: recentOrders.map((item) => ({
      ...item,
      label: statusLabel(item.status),
    })),
    topProducts,
    lowStockProducts: lowStockProducts.map((item) => ({
      ...item,
      status_label: Number(item.status) === 1 ? "Đang bán" : "Ẩn",
    })),
    meta: {
      database: process.env.DB_NAME || "tmdt_next",
      tables: ["danhmuc", "sanpham", "khachhang", "donhang", "donhang_chitiet"],
    },
  };
}
