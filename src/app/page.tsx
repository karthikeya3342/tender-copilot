import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Building2, Globe, Shield } from "lucide-react";
import { getRoleFromUser, getRedirectPath } from "@/lib/auth";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const role = getRoleFromUser(user);
    redirect(getRedirectPath(role));
  }

  return (
    <div className="min-h-screen bg-[#FFF6ED] flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#7C6FF7] flex items-center justify-center"
          style={{ boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.4), 6px 6px 20px rgba(124,111,247,0.4)" }}>
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-800">Tender<span className="text-[#7C6FF7]">Copilot</span></h1>
          <p className="text-sm text-gray-400 font-semibold">Government Tender Intelligence for MSMEs</p>
        </div>
      </div>

      <p className="text-center text-gray-500 font-medium max-w-md mb-10 text-base leading-relaxed">
        AI-powered platform that turns 100-page tender PDFs into simple actionable checklists for small businesses.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl">
        <Link href="/signup?role=msme"
          className="clay-card bg-[#FFF0E8] p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center"
              style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.3), 3px 3px 10px rgba(0,0,0,0.1)" }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="clay-badge px-2.5 py-1 bg-[#F97316] text-white text-xs">Recommended</span>
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800">Join as MSME</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Get matched tenders, eligibility checks & AI analysis</p>
          </div>
        </Link>

        <Link href="/signup?role=explorer"
          className="clay-card bg-[#F0F7FF] p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#7C6FF7] flex items-center justify-center"
              style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.3), 3px 3px 10px rgba(0,0,0,0.1)" }}>
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="clay-badge px-2.5 py-1 bg-white/60 text-gray-500 text-xs">Free</span>
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800">Browse as Explorer</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">View all active government tenders publicly</p>
          </div>
        </Link>

        <Link href="/login"
          className="clay-card bg-[#E8F8F0] p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#22C55E] flex items-center justify-center"
              style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.3), 3px 3px 10px rgba(0,0,0,0.1)" }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="clay-badge px-2.5 py-1 bg-white/60 text-gray-500 text-xs">Admin</span>
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800">Sign In</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Already registered? Sign in to your account</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
