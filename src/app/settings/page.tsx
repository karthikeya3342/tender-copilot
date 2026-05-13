import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("msme_profiles")
    .select("company_name, domain_category, turnover_lakhs, years_in_business, certifications, gst_number, pan_number, udyam_number, phone, state, city, pincode, employee_count")
    .eq("user_id", user.id)
    .single();

  return <SettingsClient profile={profile} userEmail={user.email ?? ""} />;
}
