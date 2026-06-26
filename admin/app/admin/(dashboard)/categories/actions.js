"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

function getCategoryData(formData) {
  return {
    tendanhmuc: String(formData.get("tendanhmuc") || "").trim(),
    mota: String(formData.get("mota") || "").trim(),
    trangthai: Number(formData.get("trangthai") || 1),
  };
}

export async function createCategory(formData) {
  const data = getCategoryData(formData);
  await query("INSERT INTO danhmuc (tendanhmuc, mota, trangthai) VALUES (?, ?, ?)", [data.tendanhmuc, data.mota, data.trangthai]);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id, formData) {
  const data = getCategoryData(formData);
  await query("UPDATE danhmuc SET tendanhmuc=?, mota=?, trangthai=? WHERE id=?", [data.tendanhmuc, data.mota, data.trangthai, id]);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id) {
  await query("DELETE FROM danhmuc WHERE id=?", [id]);
  revalidatePath("/admin/categories");
}
