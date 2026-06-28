// admin/lib/format.js

export function formatCurrency(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
}

export function formatPrice(value) {
  return formatCurrency(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
}

export function formatStatus(status) {
  const map = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    paid: "Đã thanh toán",
    unpaid: "Chưa thanh toán",
  };

  return map[status] || status || "";
}

export default {
  formatCurrency,
  formatPrice,
  formatNumber,
  formatDate,
  formatDateTime,
  formatStatus,
};