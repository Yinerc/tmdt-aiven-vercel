// admin\app\admin\logout\route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete("admin_logged_in");
  return response;
}
