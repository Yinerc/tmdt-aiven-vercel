"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

function getCustomerData(formData) {
  return {
    hoten: String(formData.get("hoten") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    sodienthoai: String(formData.get("sodienthoai") || "").trim(),
    diachi: String(formData.get("diachi") || "").trim(),
    matkhau: String(formData.get("matkhau") || "").trim(),
  };
}

export async function createCustomer(formData) {
  const data = getCustomerData(formData);
  await query("INSERT INTO khachhang (hoten, email, sodienthoai, diachi, matkhau) VALUES (?, ?, ?, ?, ?)", [data.hoten, data.email, data.sodienthoai, data.diachi, data.matkhau]);
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function updateCustomer(id, formData) {
  const data = getCustomerData(formData);
  await query("UPDATE khachhang SET hoten=?, email=?, sodienthoai=?, diachi=?, matkhau=? WHERE id=?", [data.hoten, data.email, data.sodienthoai, data.diachi, data.matkhau, id]);
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function deleteCustomer(id) {
  await query("DELETE FROM khachhang WHERE id=?", [id]);
  revalidatePath("/admin/customers");
}
