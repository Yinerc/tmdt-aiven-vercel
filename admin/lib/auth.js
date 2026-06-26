import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_logged_in")?.value === "1";
}

export async function requireAdmin() {
  const loggedIn = await getAdminSession();
  if (!loggedIn) {
    redirect("/admin/login");
  }
}
