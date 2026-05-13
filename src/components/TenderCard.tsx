"use client";
import { Bookmark, Flame, Calendar, IndianRupee, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { ClayButton } from "@/components/ui/ClayButton";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LanguageContext";

// Accepts both mockData shape and Supabase DB shape
export type TenderLike = {
  id: string;
  title: string;
  domain: string;
  estimated_value_lakhs: number;
  startup_exemption: boolean;
  deadline: string;
  issuer: string;
  summary: string;
  requirements_json: {
    mandatory_docs: string[];
    min_turnover_lakhs: number;
    min_years: number;
    certifications: string[];
    emd_lakhs: number;
  };
};

export type MsmeLike = {
  turnover_lakhs: number;
  years_in_business: number;
  certifications: string[];
};

interface TenderCardProps {
  tender: TenderLike;
  mode: "explorer" | "msme";
  msmeProfile?: MsmeLike;
  onAnalyze?: (tender: TenderLike) => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

function getEligibility(tender: TenderLike, profile?: MsmeLike) {
  if (!profile) return null;
  const issues: string[] = [];
  if (profile.turnover_lakhs < tender.requirements_json.min_turnover_lakhs) {
    issues.push(`Min turnover ₹${tender.requirements_json.min_turnover_lakhs}L required`);
  }
  if (profile.years_in_business < tender.requirements_json.min_years) {
    issues.push(`Min ${tender.requirements_json.min_years} years experience`);
  }
  for (const cert of tender.requirements_json.certifications) {
    if (!profile.certifications.includes(cert)) {
      issues.push(`Missing ${cert}`);
    }
  }
  if (tender.startup_exemption && issues.length > 0) {
    return { eligible: true, note: "Startup exemption applies", issues: [] };
  }
  return { eligible: issues.length === 0, issues };
}

export function TenderCard({ tender, mode, msmeProfile, onAnalyze, bookmarked = false, onBookmark }: TenderCardProps) {
  const { t } = useLang();
  const eligibility = mode === "msme" ? getEligibility(tender, msmeProfile) : null;

  const daysLeft = Math.ceil(
    (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="clay-card bg-white p-5 flex flex-col gap-4 hover:scale-[1.005] transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {tender.startup_exemption && (
              <span className="clay-badge px-2.5 py-1 bg-[#FFF3CD] text-[#B45309] flex items-center gap-1">
                <Flame className="w-3 h-3 fill-[#F97316] text-[#F97316]" />
                {t.startupExempt}
              </span>
            )}
            <span className="clay-badge px-2.5 py-1 bg-[#F3EFFF] text-[#7C6FF7]">{tender.domain}</span>
            {daysLeft <= 14 && daysLeft > 0 && (
              <span className="clay-badge px-2.5 py-1 bg-[#FEF2F2] text-[#EF4444]">⚡ {daysLeft}d left</span>
            )}
          </div>
          <h3 className="font-extrabold text-gray-800 text-base leading-tight">{tender.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-semibold">{tender.issuer}</p>
        </div>
        {mode === "msme" && onBookmark && (
          <button
            onClick={onBookmark}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
              bookmarked ? "bg-[#7C6FF7] text-white" : "bg-[#F3EFFF] text-[#7C6FF7]"
            )}
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.6), 2px 2px 6px rgba(0,0,0,0.08)" }}
          >
            <Bookmark className={cn("w-4 h-4", bookmarked && "fill-white")} />
          </button>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{tender.summary}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-[#F0F7FF] rounded-xl px-3 py-1.5"
          style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 1px 1px 4px rgba(0,0,0,0.05)" }}>
          <IndianRupee className="w-3.5 h-3.5 text-[#7C6FF7]" />
          <span className="text-xs font-extrabold text-[#7C6FF7]">₹{tender.estimated_value_lakhs}L</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#FFF6ED] rounded-xl px-3 py-1.5"
          style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 1px 1px 4px rgba(0,0,0,0.05)" }}>
          <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
          <span className="text-xs font-extrabold text-[#F97316]">
            {new Date(tender.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F0FDF4] rounded-xl px-3 py-1.5"
          style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 1px 1px 4px rgba(0,0,0,0.05)" }}>
          <span className="text-xs font-extrabold text-gray-500">EMD ₹{tender.requirements_json.emd_lakhs}L</span>
        </div>
      </div>

      {/* Eligibility strip */}
      {eligibility && (
        <div className={cn(
          "rounded-2xl px-4 py-2.5 flex items-center gap-2",
          eligibility.eligible ? "bg-[#E8F8F0] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"
        )}
          style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.6), inset -1px -1px 4px rgba(0,0,0,0.05)" }}>
          {eligibility.eligible
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span className="text-xs font-bold">
            {eligibility.eligible
              ? eligibility.note === "Startup exemption applies"
                ? `✅ ${t.startupExemptionApplies}`
                : `✅ ${t.eligibleAll}`
              : `⚠️ ${t.notEligible}: ${eligibility.issues[0]}`}
          </span>
        </div>
      )}

      {/* Analyze button */}
      {mode === "msme" && onAnalyze && (
        <ClayButton variant="primary" size="sm" onClick={() => onAnalyze(tender)} className="w-full">
          {t.analyzeInDetail} <ChevronRight className="w-4 h-4" />
        </ClayButton>
      )}
    </div>
  );
}
