"use client";
import { useState, useTransition } from "react";
import { Building2, TrendingUp, Shield, ChevronRight, Plus, X } from "lucide-react";
import { Zap } from "lucide-react";
import { ClayButton } from "@/components/ui/ClayButton";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const DOMAINS = [
  "IT & Software",
  "Civil Engineering",
  "Education & Training",
  "Healthcare",
  "Agriculture",
  "Manufacturing",
  "Textiles",
  "Food Processing",
  "Logistics & Transport",
  "Energy & Environment",
];

const COMMON_CERTS = ["ISO 9001", "ISO 27001", "MSME Udyam", "DPIIT Startup", "NABH", "CERT-In"];

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [turnover, setTurnover] = useState("");
  const [years, setYears] = useState("");
  const [certs, setCerts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggleCert = (c: string) =>
    setCerts((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleSubmit = () => {
    setError("");
    if (!companyName || !domain || !turnover || !years) {
      setError("All fields are required");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { error: upsertErr } = await supabase.from("msme_profiles").upsert({
        user_id: user.id,
        company_name: companyName,
        domain_category: domain,
        turnover_lakhs: parseFloat(turnover),
        years_in_business: parseInt(years),
        certifications: certs,
      });

      if (upsertErr) { setError(upsertErr.message); return; }

      await supabase.from("profiles").update({ role: "msme" }).eq("id", user.id);
      router.push("/dashboard");
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF6ED] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-11 h-11 rounded-xl bg-[#7C6FF7] flex items-center justify-center"
            style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.4), 4px 4px 14px rgba(124,111,247,0.4)" }}>
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-800">
            Tender<span className="text-[#7C6FF7]">Copilot</span>
          </h1>
        </div>

        <div className="clay-card bg-white p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-800">Set up your MSME profile</h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              We use this to match you with the right tenders
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-[#FEF2F2] text-[#DC2626] text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Company Name
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. TechVentures Pvt Ltd"
              className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Domain */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Business Domain</label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-2xl text-sm font-bold transition-all",
                    domain === d
                      ? "bg-[#7C6FF7] text-white"
                      : "bg-[#F3EFFF] text-[#7C6FF7] hover:bg-[#E8E3FF]"
                  )}
                  style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.05)" }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Turnover + Years */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Annual Turnover (₹L)
              </label>
              <input
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                placeholder="e.g. 150"
                className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Years in Business
              </label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="e.g. 4"
                className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Certifications (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CERTS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCert(c)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-bold transition-all",
                    certs.includes(c)
                      ? "bg-[#22C55E] text-white"
                      : "bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]"
                  )}
                  style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.05)" }}
                >
                  {certs.includes(c) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {c}
                </button>
              ))}
            </div>
            {certs.length > 0 && (
              <p className="text-xs text-[#22C55E] font-semibold">
                ✓ {certs.length} certification{certs.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <ClayButton variant="primary" size="md" onClick={handleSubmit} loading={isPending} className="w-full">
            Complete Setup <ChevronRight className="w-4 h-4" />
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
