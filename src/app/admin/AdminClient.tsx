"use client";
import { useState, useTransition, useRef } from "react";
import { FileText, Users, Zap, Upload, CheckCircle2, Loader2, Eye, Trash2, Globe, Files, XCircle, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/ui/StatCard";
import { DropZone } from "@/components/DropZone";
import { ClayButton } from "@/components/ui/ClayButton";
import { publishTender } from "@/app/actions/tenders";
import { analyzeTenderPdf } from "@/app/actions/analyzePdf";
import { Database } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type Tender = Database["public"]["Tables"]["tenders"]["Row"];

interface Props {
  stats: { activeTenders: number; msmesRegistered: number; apiCallsToday: number };
  recentTenders: Tender[];
}

const emptyForm = {
  title: "",
  issuer: "",
  domain: "IT & Software",
  estimated_value_lakhs: 0,
  emd_lakhs: 0,
  deadline: "",
  min_turnover_lakhs: 0,
  min_years: 0,
  certifications: "",
  mandatory_docs: "",
  startup_exemption: false,
  summary: "",
  nit_number: "",
};

const mockParsed = {
  title: "Smart City IoT Infrastructure Deployment",
  issuer: "Bangalore Smart City Limited",
  domain: "IT & Software",
  estimated_value_lakhs: 250,
  emd_lakhs: 5,
  deadline: "2026-06-15",
  min_turnover_lakhs: 50,
  min_years: 2,
  certifications: "ISO 9001",
  mandatory_docs: "PAN Card, GST Registration, Udyam Certificate, Technical Proposal",
  startup_exemption: true,
  summary: "Deployment of 500+ IoT sensors across city intersections for real-time traffic and environment monitoring. Includes cloud dashboard and mobile app.",
};

type PipelineState = "idle" | "parsing" | "ai" | "done";

type BatchStatus = "queued" | "analyzing" | "published" | "failed";
type BatchItem = { file: File; status: BatchStatus; title: string; error?: string };

export default function AdminClient({ stats, recentTenders }: Props) {
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [formData, setFormData] = useState(emptyForm);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Batch state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const handleBatchFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: BatchItem[] = Array.from(files).map((f) => ({
      file: f,
      status: "queued",
      title: f.name.replace(/\.pdf$/i, ""),
    }));
    setBatchItems(items);
  };

  const runBatch = async () => {
    if (batchRunning || batchItems.length === 0) return;
    setBatchRunning(true);

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (item.status === "published") continue;

      // Mark analyzing
      setBatchItems((prev) => prev.map((x, j) => j === i ? { ...x, status: "analyzing" } : x));

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(item.file);
        });

        const { tender, error: aiErr } = await analyzeTenderPdf(base64, item.file.type || "application/pdf");
        if (aiErr || !tender) throw new Error(aiErr ?? "AI extraction failed");

        const result = await publishTender({
          title: tender.title,
          issuer: tender.issuer,
          domain: tender.domain,
          estimated_value_lakhs: tender.estimated_value_lakhs,
          emd_lakhs: tender.requirements_json.emd_lakhs,
          deadline: tender.deadline,
          min_turnover_lakhs: tender.requirements_json.min_turnover_lakhs,
          min_years: tender.requirements_json.min_years,
          certifications: tender.requirements_json.certifications.join(", "),
          mandatory_docs: tender.requirements_json.mandatory_docs.join(", "),
          startup_exemption: false, // batch always sets false per user request
          summary: tender.summary,
          nit_number: tender.nit_number ?? "",
        });

        if (result.error) throw new Error(result.error);

        setBatchItems((prev) =>
          prev.map((x, j) => j === i ? { ...x, status: "published", title: tender.title } : x)
        );
      } catch (err) {
        setBatchItems((prev) =>
          prev.map((x, j) => j === i ? { ...x, status: "failed", error: err instanceof Error ? err.message : "Unknown error" } : x)
        );
      }
    }

    setBatchRunning(false);
  };

  const batchDone = batchItems.filter((x) => x.status === "published").length;
  const batchFailed = batchItems.filter((x) => x.status === "failed").length;

  const handleFile = (file: File) => {
    setPipelineError(null);
    setPipelineState("parsing");

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const mimeType = file.type || "application/pdf";
      setPipelineState("ai");

      startTransition(async () => {
        const { tender, error } = await analyzeTenderPdf(base64, mimeType);
        if (error || !tender) {
          setPipelineError(error ?? "AI could not extract tender data from this file.");
          setPipelineState("idle");
          return;
        }
        setFormData({
          title: tender.title,
          issuer: tender.issuer,
          domain: tender.domain,
          estimated_value_lakhs: tender.estimated_value_lakhs,
          emd_lakhs: tender.requirements_json.emd_lakhs,
          deadline: tender.deadline,
          min_turnover_lakhs: tender.requirements_json.min_turnover_lakhs,
          min_years: tender.requirements_json.min_years,
          certifications: tender.requirements_json.certifications.join(", "),
          mandatory_docs: tender.requirements_json.mandatory_docs.join(", "),
          startup_exemption: tender.startup_exemption,
          summary: tender.summary,
          nit_number: tender.nit_number ?? "",
        });
        setPipelineState("done");
      });
    };
    reader.onerror = () => {
      setPipelineError("Failed to read file.");
      setPipelineState("idle");
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishTender(formData);
      setPublishResult(result);
      if (result.success) {
        setTimeout(() => {
          setPipelineState("idle");
          setFormData(emptyForm);
          setPublishResult(null);
        }, 2500);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF6ED]">
      <Navbar role="admin" userName="Admin" />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">
            Admin Command <span className="text-[#7C6FF7]">Center</span>
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage tenders, monitor activity, run AI pipeline.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard title="Active Tenders" value={stats.activeTenders} icon={FileText} color="lavender" trend="Live in DB" />
          <StatCard title="MSMEs Registered" value={stats.msmesRegistered.toLocaleString()} icon={Users} color="mint" trend="Total signups" />
          <StatCard title="AI API Calls Today" value={stats.apiCallsToday} icon={Zap} color="peach" trend="~₹2.3 cost" />
        </div>

        {/* Smart Upload Pipeline */}
        <div className="clay-card bg-white p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F3EFFF] flex items-center justify-center"
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 2px 2px 6px rgba(0,0,0,0.06)" }}>
              <Upload className="w-5 h-5 text-[#7C6FF7]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-800">Smart Upload Pipeline</h2>
              <p className="text-xs text-gray-400 font-medium">PDF → AI Parse → Auto-fill → Publish to Supabase</p>
            </div>
          </div>

          {/* Pipeline Steps */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {([
              { key: "idle", label: "Upload PDF", icon: Upload },
              { key: "parsing", label: "Extract Text", icon: FileText },
              { key: "ai", label: "AI Analysis", icon: Zap },
              { key: "done", label: "Review & Publish", icon: CheckCircle2 },
            ] as const).map((step, i, arr) => {
              const states: PipelineState[] = ["idle", "parsing", "ai", "done"];
              const stepIdx = states.indexOf(step.key);
              const currentIdx = states.indexOf(pipelineState);
              const isActive = stepIdx === currentIdx;
              const isDone = stepIdx < currentIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-2 flex-shrink-0">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-2xl transition-all",
                    isActive ? "bg-[#7C6FF7] text-white" : isDone ? "bg-[#E8F8F0] text-[#22C55E]" : "bg-gray-100 text-gray-400"
                  )}
                    style={isActive ? { boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.3), 2px 2px 8px rgba(124,111,247,0.3)" } : {}}>
                    {isActive && pipelineState !== "idle" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    <span className="text-xs font-bold">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={cn("h-0.5 w-6 rounded-full", isDone || isActive ? "bg-[#7C6FF7]" : "bg-gray-200")} />
                  )}
                </div>
              );
            })}
          </div>

          {pipelineState === "idle" && (
            <>
              <DropZone onFile={handleFile} label="Drop tender PDF here" sublabel="AI will auto-extract all fields" />
              {pipelineError && (
                <p className="mt-3 text-xs text-[#DC2626] font-semibold bg-[#FEF2F2] px-4 py-2 rounded-2xl">
                  ⚠️ {pipelineError}
                </p>
              )}
            </>
          )}

          {(pipelineState === "parsing" || pipelineState === "ai") && (
            <div className="clay-inset py-12 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-[#F3EFFF] flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[#7C6FF7] animate-spin" />
              </div>
              <p className="font-bold text-gray-700">
                {pipelineState === "parsing" ? "Extracting text from PDF…" : "Gemini AI analyzing tender…"}
              </p>
              <p className="text-sm text-gray-400">
                {pipelineState === "parsing" ? "Running pdf-parse…" : "Generating structured JSON output…"}
              </p>
            </div>
          )}

          {pipelineState === "done" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#E8F8F0]">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span className="text-sm font-bold text-[#16A34A]">AI extraction complete — review and publish to Supabase</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { label: "Tender Title", key: "title", full: true },
                  { label: "NIT / Tender Reference No.", key: "nit_number", full: true },
                  { label: "Issuing Authority", key: "issuer" },
                  { label: "Domain", key: "domain" },
                  { label: "Est. Value (₹ Lakhs)", key: "estimated_value_lakhs" },
                  { label: "EMD (₹ Lakhs)", key: "emd_lakhs" },
                  { label: "Deadline", key: "deadline" },
                  { label: "Min Turnover (₹L)", key: "min_turnover_lakhs" },
                  { label: "Min Years Exp", key: "min_years" },
                  { label: "Certifications Required", key: "certifications" },
                  { label: "Mandatory Documents", key: "mandatory_docs", full: true },
                  { label: "AI Summary", key: "summary", full: true, textarea: true },
                ] as { label: string; key: keyof typeof formData; full?: boolean; textarea?: boolean }[]).map((field) => (
                  <div key={field.key} className={cn("flex flex-col gap-1.5", field.full ? "md:col-span-2" : "")}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{field.label}</label>
                    {field.textarea ? (
                      <textarea
                        value={String(formData[field.key])}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        rows={3}
                        className="clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none resize-none w-full"
                      />
                    ) : (
                      <input
                        value={String(formData[field.key])}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none w-full"
                      />
                    )}
                  </div>
                ))}

                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Startup Exemption</label>
                  <button
                    onClick={() => setFormData({ ...formData, startup_exemption: !formData.startup_exemption })}
                    className={cn("w-12 h-6 rounded-full transition-all relative", formData.startup_exemption ? "bg-[#22C55E]" : "bg-gray-300")}
                    style={{ boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.1)" }}
                  >
                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", formData.startup_exemption ? "left-6" : "left-0.5")}
                      style={{ boxShadow: "1px 1px 3px rgba(0,0,0,0.15)" }} />
                  </button>
                  <span className="text-sm font-bold text-gray-600">
                    {formData.startup_exemption ? "Yes — Startups exempt" : "No"}
                  </span>
                </div>
              </div>

              {publishResult?.error && (
                <div className="p-4 rounded-2xl bg-[#FEF2F2] text-[#DC2626] font-bold text-sm">
                  Error: {publishResult.error}
                </div>
              )}
              {publishResult?.success && (
                <div className="p-4 rounded-2xl bg-[#E8F8F0] flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <span className="font-bold text-[#16A34A]">Tender published to Supabase!</span>
                </div>
              )}

              <div className="flex gap-3">
                <ClayButton variant="primary" size="md" onClick={handlePublish} loading={isPending} className="flex-1">
                  <Globe className="w-4 h-4" /> Publish to Supabase
                </ClayButton>
                <ClayButton variant="ghost" size="md" onClick={() => { setPipelineState("idle"); setFormData(emptyForm); setPipelineError(null); setPublishResult(null); }}>
                  <Trash2 className="w-4 h-4" /> Discard
                </ClayButton>
              </div>
            </div>
          )}
        </div>

        {/* Batch Upload */}
        <div className="clay-card bg-white p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0E8] flex items-center justify-center"
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 2px 2px 6px rgba(0,0,0,0.06)" }}>
              <Files className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-800">Batch Upload</h2>
              <p className="text-xs text-gray-400 font-medium">Upload 10–20 PDFs at once — AI analyzes & publishes each automatically</p>
            </div>
          </div>

          {/* Drop zone / file picker */}
          {batchItems.length === 0 && (
            <div
              onClick={() => batchInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleBatchFiles(e.dataTransfer.files); }}
              className="clay-inset rounded-3xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="w-14 h-14 rounded-3xl bg-[#FFF0E8] flex items-center justify-center">
                <Files className="w-7 h-7 text-[#F97316]" />
              </div>
              <p className="font-bold text-gray-600">Drop multiple PDFs here or click to select</p>
              <p className="text-xs text-gray-400">Up to 20 PDF files · Startup exemption will be set to <strong>No</strong> for all</p>
              <input
                ref={batchInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleBatchFiles(e.target.files)}
              />
            </div>
          )}

          {/* File list + progress */}
          {batchItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-600">{batchItems.length} files selected</p>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {batchDone > 0 && <span className="text-[#16A34A]">✓ {batchDone} published</span>}
                  {batchFailed > 0 && <span className="text-[#DC2626]">✗ {batchFailed} failed</span>}
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {batchItems.map((item, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl",
                    item.status === "published" ? "bg-[#F0FDF4]" :
                    item.status === "failed" ? "bg-[#FEF2F2]" :
                    item.status === "analyzing" ? "bg-[#F3EFFF]" : "bg-gray-50"
                  )}>
                    <div className="flex-shrink-0">
                      {item.status === "queued" && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                      {item.status === "analyzing" && <Loader2 className="w-5 h-5 text-[#7C6FF7] animate-spin" />}
                      {item.status === "published" && <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />}
                      {item.status === "failed" && <XCircle className="w-5 h-5 text-[#EF4444]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 truncate">{item.title}</p>
                      {item.status === "analyzing" && <p className="text-xs text-[#7C6FF7] font-semibold">AI analyzing…</p>}
                      {item.status === "published" && <p className="text-xs text-[#16A34A] font-semibold">Published to Supabase</p>}
                      {item.status === "failed" && <p className="text-xs text-[#DC2626] font-semibold truncate">{item.error}</p>}
                      {item.status === "queued" && <p className="text-xs text-gray-400 font-semibold">Queued</p>}
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">{(item.file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {batchRunning && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#7C6FF7] rounded-full transition-all duration-500"
                      style={{ width: `${((batchDone + batchFailed) / batchItems.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-semibold text-right">
                    {batchDone + batchFailed} / {batchItems.length} processed
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!batchRunning && batchDone < batchItems.length && (
                  <ClayButton variant="primary" size="md" onClick={runBatch} className="flex-1">
                    <Zap className="w-4 h-4" />
                    {batchFailed > 0 ? "Retry Failed" : "Run Batch"}
                  </ClayButton>
                )}
                {batchRunning && (
                  <div className="flex-1 flex items-center gap-2 justify-center py-2">
                    <Loader2 className="w-4 h-4 text-[#7C6FF7] animate-spin" />
                    <span className="text-sm font-bold text-[#7C6FF7]">Processing sequentially…</span>
                  </div>
                )}
                {!batchRunning && (
                  <ClayButton variant="ghost" size="md" onClick={() => { setBatchItems([]); if (batchInputRef.current) batchInputRef.current.value = ""; }}>
                    <Trash2 className="w-4 h-4" /> Clear
                  </ClayButton>
                )}
                {batchDone === batchItems.length && batchItems.length > 0 && !batchRunning && (
                  <div className="flex items-center gap-2 text-[#16A34A] font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> All published!
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#FFF7ED]">
            <AlertCircle className="w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#C2410C] font-semibold">
              Batch mode skips review — all tenders publish directly. Startup exemption forced OFF. Failed files can be retried.
            </p>
          </div>
        </div>

        {/* Published Tenders Table */}
        <div className="clay-card bg-white p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-gray-800">Published Tenders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Title", "Domain", "Value", "Deadline", "Startup Exempt", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTenders.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 px-3 font-bold text-gray-700 max-w-[200px] truncate">{t.title}</td>
                    <td className="py-3 px-3">
                      <span className="clay-badge px-2 py-0.5 bg-[#F3EFFF] text-[#7C6FF7]">{t.domain}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#7C6FF7]">₹{t.estimated_value_lakhs}L</td>
                    <td className="py-3 px-3 text-gray-500">{new Date(t.deadline).toLocaleDateString("en-IN")}</td>
                    <td className="py-3 px-3">
                      {t.startup_exemption
                        ? <span className="clay-badge px-2 py-0.5 bg-[#FFF3CD] text-[#B45309]">Yes 🔥</span>
                        : <span className="text-gray-300 font-semibold">No</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button className="w-7 h-7 rounded-xl bg-[#F3EFFF] flex items-center justify-center"
                          style={{ boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
                          <Eye className="w-3.5 h-3.5 text-[#7C6FF7]" />
                        </button>
                        <button className="w-7 h-7 rounded-xl bg-[#FEF2F2] flex items-center justify-center"
                          style={{ boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
                          <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentTenders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-medium text-sm">
                      No tenders yet — run the schema.sql seed first
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
