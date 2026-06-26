"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

function getOrderData(formData) {
  return {
    khachhang_id: formData.get("khachhang_id") || null,
    tongtien: Number(formData.get("tongtien") || 0),
    trangthai: String(formData.get("trangthai") || "cho_xu_ly"),
    ghichu: String(formData.get("ghichu") || "").trim(),
  };
}

function parseItems(formData) {
  try {
    return JSON.parse(formData.get("items") || "[]");
  } catch {
    return [];
  }
}

export async function createOrder(formData) {
  const data = getOrderData(formData);
  const items = parseItems(formData);

  const result = await query(
    "INSERT INTO donhang (khachhang_id, tongtien, trangthai, ghichu) VALUES (?, ?, ?, ?)",
    [data.khachhang_id, data.tongtien, data.trangthai, data.ghichu]
  );
  const orderId = result.insertId;

  for (const item of items) {
    await query(
      "INSERT INTO donhang_chitiet (donhang_id, sanpham_id, soluong, dongia) VALUES (?, ?, ?, ?)",
      [orderId, item.sanpham_id, item.soluong, item.dongia]
    );
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}

export async function updateOrder(id, formData) {
  const data = getOrderData(formData);
  const items = parseItems(formData);

  // Cập nhật đơn hàng
  await query(
    "UPDATE donhang SET khachhang_id=?, tongtien=?, trangthai=?, ghichu=? WHERE id=?",
    [data.khachhang_id, data.tongtien, data.trangthai, data.ghichu, id]
  );

  // Xóa chi tiết cũ rồi insert lại (ON DELETE CASCADE đã có trong DB)
  await query("DELETE FROM donhang_chitiet WHERE donhang_id = ?", [id]);
  for (const item of items) {
    await query(
      "INSERT INTO donhang_chitiet (donhang_id, sanpham_id, soluong, dongia) VALUES (?, ?, ?, ?)",
      [id, item.sanpham_id, item.soluong, item.dongia]
    );
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}

export async function deleteOrder(id) {
  await query("DELETE FROM donhang WHERE id=?", [id]);
  revalidatePath("/admin/orders");
}
