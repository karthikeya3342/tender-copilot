"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "explorer" | "msme";

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Role is set by trigger for admin email; for others update after signup
  if (role === "msme") {
    // Update role to msme — trigger defaults to explorer
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ role: "msme" }).eq("id", user.id);
      redirect("/onboarding");
    }
  }

  redirect("/explorer");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in failed" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "msme") redirect("/dashboard");
  redirect("/explorer");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveMsmeProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const certifications = (formData.get("certifications") as string)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const { error } = await supabase.from("msme_profiles").upsert({
    user_id: user.id,
    company_name: formData.get("company_name") as string,
    domain_category: formData.get("domain_category") as string,
    turnover_lakhs: parseFloat(formData.get("turnover_lakhs") as string),
    years_in_business: parseInt(formData.get("years_in_business") as string),
    certifications,
  });

  if (error) return { error: error.message };

  // Ensure role is msme
  await supabase.from("profiles").update({ role: "msme" }).eq("id", user.id);

  redirect("/dashboard");
}
