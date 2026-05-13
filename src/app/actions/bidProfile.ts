"use server";

import { createClient } from "@/lib/supabase/server";

export type PastProject = {
  name: string;
  client: string;
  value: string;
  completionYear: string;
  certRef: string;
};

export type BidProfileData = {
  authorizedName: string;
  authorizedDesignation: string;
  bankName: string;
  bankBranch: string;
  ddNumber: string;
  pastProjects: PastProject[];
};

export async function saveBidProfile(data: BidProfileData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("msme_profiles")
    .update({
      authorized_name: data.authorizedName || null,
      authorized_designation: data.authorizedDesignation || null,
      bank_name: data.bankName || null,
      bank_branch: data.bankBranch || null,
      past_projects: data.pastProjects as never,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function loadBidProfile(): Promise<BidProfileData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("msme_profiles")
    .select("authorized_name, authorized_designation, bank_name, bank_branch, past_projects")
    .eq("user_id", user.id)
    .single();

  if (!data) return null;

  return {
    authorizedName: data.authorized_name ?? "",
    authorizedDesignation: data.authorized_designation ?? "",
    bankName: data.bank_name ?? "",
    bankBranch: data.bank_branch ?? "",
    ddNumber: "",
    pastProjects: (data.past_projects as PastProject[]) ?? [],
  };
}
