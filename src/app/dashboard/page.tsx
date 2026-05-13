import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { mockTenders, mockMsmeProfile } from "@/lib/mockData";
import { domainsMatch } from "@/lib/domainMatch";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch MSME profile — may not exist if schema.sql not run yet
  const { data: msmeProfile, error: msmeErr } = await supabase
    .from("msme_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch tenders — may not exist if schema.sql not run yet
  const { data: tenders } = await supabase
    .from("tenders")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("tender_id")
    .eq("user_id", user.id);

  // If no profile in DB, pull from user_metadata (set during signup)
  const meta = user.user_metadata ?? {};
  const resolvedProfile = msmeProfile ?? (meta.company_name ? {
    id: "meta",
    user_id: user.id,
    company_name: meta.company_name as string,
    domain_category: meta.domain_category as string,
    turnover_lakhs: meta.turnover_lakhs as number,
    years_in_business: meta.years_in_business as number,
    certifications: (meta.certifications as string[]) ?? [],
    created_at: new Date().toISOString(),
  } : null);

  // Last resort: mock profile so dashboard always renders
  const finalProfile = resolvedProfile ?? {
    ...mockMsmeProfile,
    user_id: user.id,
    company_name: user.email?.split("@")[0] ?? "Your Company",
  };

  // Tenders: real DB or mock fallback
  const finalTenders = (tenders && tenders.length > 0) ? tenders : mockTenders as never[];

  const matched = finalTenders.filter(
    (t: { domain: string }) => domainsMatch(t.domain, finalProfile.domain_category)
  );

  const bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.tender_id));

  // If profile was from user_metadata (not in DB), try to save it now (non-blocking)
  if (!msmeProfile && !msmeErr && resolvedProfile && resolvedProfile.id !== "meta") {
    supabase.from("msme_profiles").upsert({
      user_id: user.id,
      company_name: finalProfile.company_name,
      domain_category: finalProfile.domain_category,
      turnover_lakhs: finalProfile.turnover_lakhs,
      years_in_business: finalProfile.years_in_business,
      certifications: finalProfile.certifications,
    }).then(() => {});
  }

  return (
    <DashboardClient
      msmeProfile={finalProfile as never}
      tenders={matched as never[]}
      allTenders={finalTenders as never[]}
      bookmarkedIds={[...bookmarkedIds]}
    />
  );
}
