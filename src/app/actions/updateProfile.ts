"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateData = {
  company_name: string;
  domain_category: string;
  turnover_lakhs: number;
  years_in_business: number;
  certifications: string[];
  gst_number?: string;
  pan_number?: string;
  udyam_number?: string;
  phone?: string;
  state?: string;
  city?: string;
  pincode?: string;
  employee_count?: number | null;
};

export async function updateMsmeProfile(data: ProfileUpdateData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("msme_profiles")
    .update({
      company_name: data.company_name,
      domain_category: data.domain_category,
      turnover_lakhs: data.turnover_lakhs,
      years_in_business: data.years_in_business,
      certifications: data.certifications,
      gst_number: data.gst_number || null,
      pan_number: data.pan_number || null,
      udyam_number: data.udyam_number || null,
      phone: data.phone || null,
      state: data.state || null,
      city: data.city || null,
      pincode: data.pincode || null,
      employee_count: data.employee_count || null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
