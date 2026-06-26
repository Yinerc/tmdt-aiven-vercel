export function formatCurrency(value) {
  const number = Number(value || 0);
  return number.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function statusLabel(status) {
  const labels = {
    cho_xu_ly: "Chờ xử lý",
    dang_giao: "Đang giao",
    da_giao: "Đã giao",
    da_huy: "Đã hủy",
  };
  return labels[status] || status || "";
}
