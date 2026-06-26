"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

function getProductData(formData) {
  return {
    danhmuc_id: formData.get("danhmuc_id") || null,
    tensanpham: String(formData.get("tensanpham") || "").trim(),
    hinhanh: String(formData.get("hinhanh") || "").trim(),
    gia: Number(formData.get("gia") || 0),
    soluong: Number(formData.get("soluong") || 0),
    mota: String(formData.get("mota") || "").trim(),
    trangthai: Number(formData.get("trangthai") || 1),
  };
}

export async function createProduct(formData) {
  const data = getProductData(formData);
  await query(
    `INSERT INTO sanpham (danhmuc_id, tensanpham, hinhanh, gia, soluong, mota, trangthai)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.danhmuc_id, data.tensanpham, data.hinhanh, data.gia, data.soluong, data.mota, data.trangthai]
  );
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id, formData) {
  const data = getProductData(formData);
  await query(
    `UPDATE sanpham
     SET danhmuc_id=?, tensanpham=?, hinhanh=?, gia=?, soluong=?, mota=?, trangthai=?
     WHERE id=?`,
    [data.danhmuc_id, data.tensanpham, data.hinhanh, data.gia, data.soluong, data.mota, data.trangthai, id]
  );
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id) {
  await query("DELETE FROM sanpham WHERE id=?", [id]);
  revalidatePath("/admin/products");
}
