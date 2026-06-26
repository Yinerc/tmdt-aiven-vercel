import { getReportData } from "@/lib/reportQueries";

export const dynamic = "force-dynamic";

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function csvLine(values) {
  return values.map(csvCell).join(",");
}

export async function GET() {
  const data = await getReportData();
  const {
    stats,
    revenueByMonth,
    orderStatus,
    productsByCategory,
    recentOrders,
    topProducts,
    lowStockProducts,
  } = data;

  const lines = [];
  lines.push(csvLine(["NHÓM", "CHỈ SỐ", "GIÁ TRỊ"]));
  lines.push(csvLine(["Tổng quan", "Tổng sản phẩm", stats.totalProducts]));
  lines.push(csvLine(["Tổng quan", "Sản phẩm đang bán", stats.activeProducts]));
  lines.push(csvLine(["Tổng quan", "Tổng danh mục", stats.totalCategories]));
  lines.push(csvLine(["Tổng quan", "Tổng khách hàng", stats.totalCustomers]));
  lines.push(csvLine(["Tổng quan", "Tổng đơn hàng", stats.totalOrders]));
  lines.push(csvLine(["Tổng quan", "Doanh thu", stats.totalRevenue]));
  lines.push(csvLine(["Tổng quan", "Sản phẩm sắp hết hàng", stats.lowStock]));
  lines.push(csvLine(["Tổng quan", "Giá trị tồn kho", stats.totalInventoryValue]));

  lines.push("");
  lines.push(csvLine(["DOANH THU THEO THÁNG", "SỐ ĐƠN", "DOANH THU"]));
  revenueByMonth.forEach((item) => {
    lines.push(csvLine([item.month, item.order_count, item.revenue]));
  });

  lines.push("");
  lines.push(csvLine(["TRẠNG THÁI ĐƠN HÀNG", "SỐ LƯỢNG", "DOANH THU"]));
  orderStatus.forEach((item) => {
    lines.push(csvLine([item.label, item.count, item.revenue]));
  });

  lines.push("");
  lines.push(csvLine(["DANH MỤC", "SỐ SẢN PHẨM", "TỔNG TỒN", "GIÁ TRỊ TỒN"]));
  productsByCategory.forEach((item) => {
    lines.push(csvLine([item.category_name, item.product_count, item.stock_total, item.inventory_value]));
  });

  lines.push("");
  lines.push(csvLine(["ĐƠN HÀNG GẦN ĐÂY", "KHÁCH HÀNG", "EMAIL", "TỔNG TIỀN", "TRẠNG THÁI", "NGÀY"]));
  recentOrders.forEach((order) => {
    lines.push(csvLine([`#${order.id}`, order.customer_name, order.customer_email, order.total, order.label, order.created_at]));
  });

  lines.push("");
  lines.push(csvLine(["SẢN PHẨM BÁN CHẠY", "ĐÃ BÁN", "DOANH THU"]));
  topProducts.forEach((product) => {
    lines.push(csvLine([product.product_name, product.sold_quantity, product.revenue]));
  });

  lines.push("");
  lines.push(csvLine(["SẢN PHẨM TỒN KHO THẤP", "DANH MỤC", "GIÁ", "TỒN KHO", "TRẠNG THÁI"]));
  lowStockProducts.forEach((product) => {
    lines.push(csvLine([product.product_name, product.category_name, product.price, product.stock, product.status_label]));
  });

  const today = new Date().toISOString().slice(0, 10);
  const csv = `\uFEFF${lines.join("\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bao-cao-thong-ke-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
