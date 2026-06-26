// admin\app\admin\login\actions.js
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "123456";

  if (email !== adminEmail || password !== adminPassword) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_logged_in", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/admin/dashboard");
}
