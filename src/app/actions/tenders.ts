"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { RequirementsJson } from "@/lib/types/database";
import { revalidatePath } from "next/cache";

export async function publishTender(formData: {
  title: string;
  issuer: string;
  domain: string;
  estimated_value_lakhs: number;
  emd_lakhs: number;
  deadline: string;
  min_turnover_lakhs: number;
  min_years: number;
  certifications: string;
  mandatory_docs: string;
  startup_exemption: boolean;
  summary: string;
  nit_number: string;
}) {
  const supabase = createAdminClient();

  const requirements_json: RequirementsJson = {
    mandatory_docs: formData.mandatory_docs.split(",").map((d) => d.trim()).filter(Boolean),
    min_turnover_lakhs: formData.min_turnover_lakhs,
    min_years: formData.min_years,
    certifications: formData.certifications.split(",").map((c) => c.trim()).filter(Boolean),
    emd_lakhs: formData.emd_lakhs,
  };

  const { error } = await supabase.from("tenders").insert({
    title: formData.title,
    domain: formData.domain,
    estimated_value_lakhs: formData.estimated_value_lakhs,
    startup_exemption: formData.startup_exemption,
    deadline: formData.deadline,
    issuer: formData.issuer,
    summary: formData.summary,
    nit_number: formData.nit_number || null,
    requirements_json,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/explorer");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}

export async function getAdminStats() {
  const supabase = createAdminClient();

  const [{ count: tenderCount }, { count: msmeCount }] = await Promise.all([
    supabase.from("tenders").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("msme_profiles").select("*", { count: "exact", head: true }),
  ]);

  return {
    activeTenders: tenderCount ?? 0,
    msmesRegistered: msmeCount ?? 0,
    apiCallsToday: 328, // placeholder until we add logging
  };
}
