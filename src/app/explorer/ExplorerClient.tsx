"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Flame, TrendingUp, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TenderCard } from "@/components/TenderCard";
import { Database } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LanguageContext";

type Tender = Database["public"]["Tables"]["tenders"]["Row"];

const domainKeys = ["All", "IT & Software", "Civil Engineering", "Education & Training", "Healthcare", "Agriculture"];

export default function ExplorerClient({ tenders }: { tenders: Tender[] }) {
  const { t } = useLang();
  const sortOptions = [t.sortNewest, t.sortValueHigh, t.sortDeadlineSoon];

  const [search, setSearch] = useState("");
  const [activeDomain, setActiveDomain] = useState("All");
  const [showStartupOnly, setShowStartupOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>(t.sortNewest);

  let filtered = tenders.filter((tender) => {
    if (showStartupOnly && !tender.startup_exemption) return false;
    if (activeDomain !== "All" && tender.domain !== activeDomain) return false;
    if (search && !tender.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (sortBy === t.sortValueHigh) filtered = [...filtered].sort((a, b) => b.estimated_value_lakhs - a.estimated_value_lakhs);
  if (sortBy === t.sortDeadlineSoon) filtered = [...filtered].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const startupCount = tenders.filter((t) => t.startup_exemption).length;
  const totalValue = tenders.reduce((s, t) => s + Number(t.estimated_value_lakhs), 0);

  return (
    <div className="min-h-screen bg-[#F0F7FF]">
      <Navbar role="explorer" userName="Explorer" />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Hero Banner */}
        <div className="clay-card bg-gradient-to-br from-[#7C6FF7] to-[#A78BFA] p-8 text-white overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-12 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-bold text-white/80">{t.globalTenderFeed}</span>
            </div>
            <h1 className="text-3xl font-black">{t.discoverOpportunities}</h1>
            <p className="text-white/70 mt-1 font-medium">
              {tenders.length} {t.activeTenders} · {startupCount} {t.startupFriendly}
            </p>
          </div>
          <div className="mt-6 flex gap-3 flex-wrap relative z-10">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="text-sm font-bold">{startupCount} {t.withStartupExemption}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-sm font-bold">₹{totalValue.toLocaleString()}L {t.totalValueLabel}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="clay-card bg-white p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full clay-inset pl-10 pr-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {domainKeys.map((d) => (
              <button key={d} onClick={() => setActiveDomain(d)}
                className={cn("px-4 py-1.5 rounded-2xl text-sm font-bold transition-all",
                  activeDomain === d ? "bg-[#7C6FF7] text-white" : "bg-[#F3EFFF] text-[#7C6FF7] hover:bg-[#E8E3FF]")}
                style={{ boxShadow: activeDomain === d ? "inset 1px 1px 3px rgba(255,255,255,0.3), 2px 2px 8px rgba(124,111,247,0.3)" : "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.05)" }}>
                {d === "All" ? t.domainAll : d}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button onClick={() => setShowStartupOnly(!showStartupOnly)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all",
                showStartupOnly ? "bg-[#FFF3CD] text-[#B45309]" : "bg-gray-100 text-gray-500 hover:bg-[#FFF3CD]")}
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.05)" }}>
              <Flame className={cn("w-4 h-4", showStartupOnly ? "fill-[#F97316] text-[#F97316]" : "")} />
              {t.startupExemptOnly}
            </button>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="clay-inset text-sm font-bold text-gray-600 px-3 py-2 outline-none bg-transparent">
                {sortOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <p className="text-sm font-bold text-gray-500">
          {t.showing} <span className="text-[#7C6FF7]">{filtered.length}</span> {t.tendersLabel}
        </p>

        {filtered.length === 0 ? (
          <div className="clay-card bg-white p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#F3EFFF] flex items-center justify-center">
              <Search className="w-8 h-8 text-[#7C6FF7]" />
            </div>
            <p className="font-extrabold text-gray-700">{t.noTendersMatch}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TenderCard key={t.id} tender={t as never} mode="explorer" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
