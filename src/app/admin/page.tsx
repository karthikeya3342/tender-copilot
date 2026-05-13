import { createAdminClient } from "@/lib/supabase/admin";
import AdminClient from "./AdminClient";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [
    { count: activeTenders },
    { count: msmesRegistered },
    { data: tenders },
  ] = await Promise.all([
    supabase.from("tenders").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("msme_profiles").select("*", { count: "exact", head: true }),
    supabase.from("tenders").select("id, title, domain, estimated_value_lakhs, deadline, startup_exemption, status, nit_number, issuer").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <AdminClient
      stats={{ activeTenders: activeTenders ?? 0, msmesRegistered: msmesRegistered ?? 0, apiCallsToday: 328 }}
      recentTenders={tenders ?? []}
    />
  );
}
