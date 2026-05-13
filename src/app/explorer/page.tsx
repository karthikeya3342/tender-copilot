import { createClient } from "@/lib/supabase/server";
import ExplorerClient from "./ExplorerClient";
import { mockTenders } from "@/lib/mockData";

export const dynamic = 'force-dynamic';

export default async function ExplorerPage() {
  const supabase = await createClient();

  const { data: tenders } = await supabase
    .from("tenders")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Fall back to mock data if table doesn't exist yet
  const finalTenders = (tenders && tenders.length > 0) ? tenders : mockTenders as never[];

  return <ExplorerClient tenders={finalTenders as never[]} />;
}
