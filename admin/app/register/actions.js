// admin\app\register\actions.js
"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import db from "@/lib/db";

function text(value) {
  return String(value || "").trim();
}

function qIdent(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("Tên bảng/cột không hợp lệ");
  }
  return `\`${name}\``;
}

function isRedirect(error) {
  return typeof error?.digest === "string" && error.digest.startsWith("NEXT_REDIRECT");
}

function fail(message) {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

function success() {
  redirect("/register?success=1");
}

async function tableExists(table) {
  try {
    await db.query(`SELECT 1 FROM ${qIdent(table)} LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function getColumns(table) {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${qIdent(table)}`);
  return rows.map((row) => row.Field);
}

function pickColumn(columns, names) {
  return names.find((name) => columns.includes(name));
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function chooseAccountTable() {
  // Ưu tiên bảng users vì thường dùng để lưu tài khoản đăng nhập.
  // Nếu project của bạn chỉ có customers thì vẫn hỗ trợ customers.
  const candidates = ["users", "customers"];
  let fallback = null;

  for (const table of candidates) {
    if (!(await tableExists(table))) continue;

    const columns = await getColumns(table);
    const passwordColumn = pickColumn(columns, ["password", "password_hash", "matkhau"]);
    const result = { table, columns, passwordColumn };

    if (passwordColumn) return result;
    if (!fallback) fallback = result;
  }

  return fallback;
}

export async function registerCustomer(formData) {
  const fullName = text(formData.get("fullName"));
  const email = text(formData.get("email")).toLowerCase();
  const phone = text(formData.get("phone"));
  const address = text(formData.get("address"));
  const password = text(formData.get("password"));
  const confirmPassword = text(formData.get("confirmPassword"));

  if (!fullName || !email || !password || !confirmPassword) {
    fail("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("Email không hợp lệ.");
  }

  if (password.length < 6) {
    fail("Mật khẩu phải có ít nhất 6 ký tự.");
  }

  if (password !== confirmPassword) {
    fail("Mật khẩu nhập lại không khớp.");
  }

  try {
    const target = await chooseAccountTable();

    if (!target) {
      fail("Chưa tìm thấy bảng users hoặc customers trong database.");
    }

    const { table, columns, passwordColumn } = target;

    if (!passwordColumn) {
      fail(`Bảng ${table} chưa có cột password, password_hash hoặc matkhau để lưu mật khẩu.`);
    }

    const emailColumn = pickColumn(columns, ["email", "customer_email"]);
    const nameColumn = pickColumn(columns, ["name", "full_name", "customer_name", "hoten", "username"]);
    const phoneColumn = pickColumn(columns, ["phone", "customer_phone", "sodienthoai"]);
    const addressColumn = pickColumn(columns, ["address", "customer_address", "diachi"]);
    const roleColumn = pickColumn(columns, ["role", "user_role"]);
    const statusColumn = pickColumn(columns, ["status", "trangthai"]);
    const createdAtColumn = pickColumn(columns, ["created_at", "createdAt", "ngaytao"]);
    const updatedAtColumn = pickColumn(columns, ["updated_at", "updatedAt", "ngaycapnhat"]);

    if (!emailColumn) {
      fail(`Bảng ${table} chưa có cột email để lưu tài khoản.`);
    }

    const [existingRows] = await db.query(
      `SELECT ${qIdent(emailColumn)} FROM ${qIdent(table)} WHERE ${qIdent(emailColumn)} = ? LIMIT 1`,
      [email]
    );

    if (existingRows.length > 0) {
      fail("Email này đã được đăng ký.");
    }

    const insertColumns = [];
    const placeholders = [];
    const values = [];
    const usedColumns = new Set();

    function add(column, value) {
      if (!column || usedColumns.has(column)) return;
      insertColumns.push(qIdent(column));
      placeholders.push("?");
      values.push(value);
      usedColumns.add(column);
    }

    function addRaw(column, expression) {
      if (!column || usedColumns.has(column)) return;
      insertColumns.push(qIdent(column));
      placeholders.push(expression);
      usedColumns.add(column);
    }

    add(nameColumn, nameColumn === "username" ? email.split("@")[0] : fullName);
    add(emailColumn, email);
    add(phoneColumn, phone);
    add(addressColumn, address);
    add(passwordColumn, passwordColumn === "password_hash" ? hashPassword(password) : password);

    if (roleColumn) add(roleColumn, "customer");
    if (statusColumn) add(statusColumn, "active");
    if (createdAtColumn) addRaw(createdAtColumn, "NOW()");
    if (updatedAtColumn) addRaw(updatedAtColumn, "NOW()");

    await db.query(
      `INSERT INTO ${qIdent(table)} (${insertColumns.join(", ")}) VALUES (${placeholders.join(", ")})`,
      values
    );

    success();
  } catch (error) {
    if (isRedirect(error)) throw error;
    redirect(`/register?error=${encodeURIComponent("Không thể đăng ký: " + error.message)}`);
  }
}
