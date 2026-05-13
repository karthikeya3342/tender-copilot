import { User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "karthikeya@askd.in";

export type AppRole = "admin" | "msme" | "explorer";

export function getRoleFromUser(user: User): AppRole {
  if (user.email === ADMIN_EMAIL) return "admin";
  const role = user.user_metadata?.role as string | undefined;
  if (role === "msme") return "msme";
  return "explorer";
}

export function getRedirectPath(role: AppRole): string {
  if (role === "admin") return "/admin";
  if (role === "msme") return "/dashboard";
  return "/explorer";
}
