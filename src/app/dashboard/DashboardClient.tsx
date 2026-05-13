"use client";
import { useState, useTransition } from "react";
import { Building2, TrendingUp, Shield, Upload, Sparkles, BookmarkCheck, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TenderCard } from "@/components/TenderCard";
import { DropZone } from "@/components/DropZone";
import { AnalysisModal } from "@/components/AnalysisModal";
import { analyzeTenderPdf } from "@/app/actions/analyzePdf";
import { Database } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LanguageContext";

type Tender = Database["public"]["Tables"]["tenders"]["Row"];
type MsmeProfile = Database["public"]["Tables"]["msme_profiles"]["Row"];

interface Props {
  msmeProfile: MsmeProfile;
  tenders: Tender[];
  allTenders: Tender[];
  bookmarkedIds: string[];
}

export default function DashboardClient({ msmeProfile, tenders, bookmarkedIds }: Props) {
  const { t } = useLang();
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<"matched" | "bookmarked">("matched");
  const [localBookmarks, setLocalBookmarks] = useState<Set<string>>(new Set(bookmarkedIds));
  const [pdfAnalyzing, setPdfAnalyzing] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [, startPdfTransition] = useTransition();

  const handleOwnPdf = (file: File) => {
    setPdfError(null);
    setPdfAnalyzing(true);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const mimeType = file.type || "application/pdf";

      startPdfTransition(async () => {
        const { tender, error } = await analyzeTenderPdf(base64, mimeType);
        setPdfAnalyzing(false);
        if (error || !tender) {
          setPdfError(error ?? "Could not extract tender data from this file.");
          return;
        }
        setSelectedTender(tender as never);
      });
    };
    reader.onerror = () => {
      setPdfAnalyzing(false);
      setPdfError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const toggleBookmark = (tenderId: string) => {
    setLocalBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(tenderId)) next.delete(tenderId);
      else next.add(tenderId);
      return next;
    });
  };

  const bookmarkedTenders = tenders.filter((t) => localBookmarks.has(t.id));

  return (
    <div className="min-h-screen bg-[#FFF6ED]">
      <Navbar role="msme" userName={msmeProfile.company_name} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Greeting + Profile Strip */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7C6FF7]" />
              {t.goodMorning}
            </p>
            <h1 className="text-3xl font-black text-gray-800 mt-0.5">{msmeProfile.company_name}</h1>
          </div>
          <div className="clay-card bg-white p-4 flex gap-4 flex-wrap">
            {[
              { icon: Building2, label: t.domain, value: msmeProfile.domain_category, color: "text-[#7C6FF7]", bg: "bg-[#F3EFFF]" },
              { icon: TrendingUp, label: t.turnover, value: `₹${msmeProfile.turnover_lakhs}L`, color: "text-[#22C55E]", bg: "bg-[#E8F8F0]" },
              { icon: Shield, label: t.experience, value: `${msmeProfile.years_in_business} ${t.years}`, color: "text-[#F97316]", bg: "bg-[#FFF0E8]" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}
                  style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">{label}</p>
                  <p className="text-sm font-extrabold text-gray-700">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bring Your Own Tender */}
        <div className="clay-card bg-gradient-to-br from-[#F3EFFF] to-[#E8F8FF] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-[#7C6FF7]" />
            <h2 className="font-extrabold text-gray-800">{t.bringYourOwn}</h2>
            <span className="clay-badge px-2.5 py-0.5 bg-[#7C6FF7] text-white text-xs ml-auto">{t.newLabel}</span>
          </div>
          <p className="text-sm text-gray-500 font-medium mb-4">
            {t.bringYourOwnDesc}
          </p>

          {pdfAnalyzing ? (
            <div className="clay-inset py-8 flex flex-col items-center gap-3 rounded-3xl">
              <Loader2 className="w-7 h-7 text-[#7C6FF7] animate-spin" />
              <p className="text-sm font-bold text-gray-600">{t.geminiReadingTender}</p>
              <p className="text-xs text-gray-400">{t.extractingDetails}</p>
            </div>
          ) : (
            <>
              <DropZone onFile={handleOwnPdf} label={t.dropExternalPdf} sublabel={t.geminiExtractsDetails} compact />
              {pdfError && (
                <p className="mt-3 text-xs text-[#DC2626] font-semibold bg-[#FEF2F2] px-4 py-2 rounded-2xl">
                  ⚠️ {pdfError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          {[
            { key: "matched", label: `${t.matched} (${tenders.length})`, icon: Building2 },
            { key: "bookmarked", label: `${t.bookmarked} (${localBookmarks.size})`, icon: BookmarkCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as "matched" | "bookmarked")}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all",
                activeTab === key ? "bg-[#7C6FF7] text-white" : "bg-white text-gray-500 hover:bg-[#F3EFFF]")}
              style={{ boxShadow: activeTab === key ? "inset 1px 1px 3px rgba(255,255,255,0.3), 3px 3px 10px rgba(124,111,247,0.3)" : "inset 1px 1px 3px rgba(255,255,255,0.9), 2px 2px 8px rgba(0,0,0,0.06)" }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Domain notice */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E8F8F0]"
          style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.7)" }}>
          <Building2 className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-bold text-[#16A34A]">
            {t.showingTenders}: <strong>{msmeProfile.domain_category}</strong>
          </span>
        </div>

        {/* Tender Grid */}
        {(() => {
          const list = activeTab === "matched" ? tenders : bookmarkedTenders;
          if (list.length === 0) {
            return (
              <div className="clay-card bg-white p-12 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#F3EFFF] flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-[#7C6FF7]" />
                </div>
                <p className="font-extrabold text-gray-700">
                  {activeTab === "matched" ? t.noMatchingTenders : t.noBookmarks}
                </p>
                <p className="text-sm text-gray-400">
                  {activeTab === "matched" ? t.checkBackSoon : t.bookmarkFromMatched}
                </p>
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {list.map((t) => (
                <TenderCard
                  key={t.id}
                  tender={t as never}
                  mode="msme"
                  msmeProfile={msmeProfile as never}
                  onAnalyze={(tender) => setSelectedTender(tender as never)}
                  bookmarked={localBookmarks.has(t.id)}
                  onBookmark={() => toggleBookmark(t.id)}
                />
              ))}
            </div>
          );
        })()}
      </main>

      {selectedTender && (
        <AnalysisModal
          tender={selectedTender as never}
          msmeProfile={msmeProfile as never}
          onClose={() => setSelectedTender(null)}
        />
      )}
    </div>
  );
}
