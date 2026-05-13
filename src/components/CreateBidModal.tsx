"use client";
import { useState, useEffect } from "react";
import { X, FileDown, Building2, IndianRupee, Briefcase, User, Landmark, Plus, Trash2, Save } from "lucide-react";
import { Tender, MsmeProfile } from "@/lib/mockData";
import { ClayButton } from "@/components/ui/ClayButton";
import { cn } from "@/lib/utils";
import { saveBidProfile, loadBidProfile } from "@/app/actions/bidProfile";

interface Props {
  tender: Tender;
  msmeProfile: MsmeProfile;
  onClose: () => void;
}

type PastProject = {
  name: string;
  client: string;
  value: string;
  completionYear: string;
  certRef: string;
};

type SavedBidProfile = {
  authorizedName: string;
  authorizedDesignation: string;
  bankName: string;
  bankBranch: string;
  ddNumber: string;
  pastProjects: PastProject[];
};

const emptyProject = (): PastProject => ({
  name: "", client: "", value: "", completionYear: "", certRef: "",
});

const STORAGE_KEY = "tc_bid_profile";

function loadSaved(): SavedBidProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavedBidProfile;
  } catch {}
  return { authorizedName: "", authorizedDesignation: "", bankName: "", bankBranch: "", ddNumber: "", pastProjects: [] };
}

function saveBidProfileLocal(p: SavedBidProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function Field({
  label, value, onChange, placeholder, type = "text", textarea = false, required = false, hint, mono = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean; required?: boolean; hint?: string; mono?: boolean;
}) {
  const cls = `w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300${mono ? " font-mono tracking-wide" : ""}`;
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-[#F97316] ml-1">*</span>}
        {hint && <span className="text-gray-300 font-medium normal-case ml-1">{hint}</span>}
      </label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  );
}

// ── HTML TEMPLATE ──────────────────────────────────────────────────────────────
function generateBidHTML(
  tender: Tender,
  msme: MsmeProfile,
  nitNumber: string,
  quotedAmount: string,
  approach: string,
  priceValidity: string,
  signatory: SavedBidProfile,
  emptyDd: boolean,
): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const needsEmd = tender.requirements_json.emd_lakhs > 0 && !tender.startup_exemption;
  const isLargeTender = tender.estimated_value_lakhs >= 100; // integrity pact threshold
  const isCivil = ["civil", "construction", "infrastructure", "road"].some(k => tender.domain.toLowerCase().includes(k));
  const m = msme as Record<string, unknown>;

  const docRows = tender.requirements_json.mandatory_docs
    .map((d, i) => `<tr><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">${i + 1}</td><td style="border:1px solid #ddd;padding:7px 10px;">${d}</td><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">☐</td></tr>`)
    .join("");

  const expRows = signatory.pastProjects.filter(p => p.name).map((p, i) => `
    <tr>
      <td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;">${p.name}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;">${p.client || "—"}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;text-align:right;">${p.value ? "₹" + p.value + "L" : "—"}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">${p.completionYear || "—"}</td>
      <td style="border:1px solid #ddd;padding:7px 10px;">${p.certRef || "—"}</td>
    </tr>`).join("") || `<tr><td colspan="6" style="border:1px solid #ddd;padding:10px;text-align:center;color:#888;">To be submitted with bid package</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Bid — ${nitNumber || tender.title}</title>
<style>
  @page { size: A4; margin: 2cm 1.8cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11.5pt; color: #111; line-height: 1.65; }
  h2 { font-size: 11pt; font-weight: bold; background: #1a1a2e; color: #fff; padding: 5px 10px; margin: 18px 0 10px; letter-spacing: 0.4px; }
  h3 { font-size: 11pt; font-weight: bold; margin: 10px 0 5px; text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; font-size: 11pt; margin: 6px 0; }
  th { background: #eee; border: 1px solid #ccc; padding: 7px 10px; text-align: left; font-size: 10.5pt; }
  .kv td:first-child { font-weight: bold; width: 200px; padding: 4px 0; vertical-align: top; font-size: 11pt; }
  .kv td:last-child { padding: 4px 0 4px 10px; font-size: 11pt; }
  .amount { font-size: 20pt; font-weight: bold; border: 2px solid #1a1a2e; display: inline-block; padding: 10px 28px; margin: 8px 0; letter-spacing: 1px; }
  .center { text-align: center; }
  .decl p { margin-bottom: 6px; font-size: 11pt; }
  ol.decl-list { padding-left: 22px; font-size: 11pt; }
  ol.decl-list li { margin-bottom: 6px; }
  .sig { display: flex; justify-content: space-between; margin-top: 36px; align-items: flex-end; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1px solid #333; width: 200px; padding-top: 5px; font-size: 10.5pt; margin: 0 auto; }
  .cover { border: 2px solid #1a1a2e; padding: 28px 24px; margin-bottom: 20px; }
  .badge { display: inline-block; background: #fffbeb; border: 1px solid #f59e0b; padding: 3px 10px; border-radius: 4px; font-size: 10pt; margin-top: 8px; }
  .envelope { border: 1.5px dashed #888; padding: 8px 12px; margin: 8px 0; border-radius: 4px; font-size: 10.5pt; background: #fafafa; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>

<div class="no-print" style="position:fixed;top:14px;right:14px;z-index:999;">
  <button onclick="window.print()" style="background:#7C6FF7;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:2px 2px 8px rgba(124,111,247,0.4);">
    ⬇ Save as PDF (Ctrl+P)
  </button>
</div>

<!-- ═══ COVER PAGE ═══ -->
<div class="cover center">
  <div style="font-size:9.5pt;color:#555;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Bid Submission Document</div>
  <div style="font-size:16pt;font-weight:bold;line-height:1.3;margin-bottom:8px;">${tender.title}</div>
  <div style="font-size:10.5pt;color:#444;margin-bottom:4px;">Issuing Authority: <strong>${tender.issuer}</strong></div>
  ${nitNumber ? `<div style="font-size:10.5pt;color:#444;margin-bottom:4px;">NIT / Tender Ref. No.: <strong>${nitNumber}</strong></div>` : ""}
  <div style="font-size:10.5pt;color:#444;">Deadline: <strong>${tender.deadline}</strong> &nbsp;|&nbsp; Domain: <strong>${tender.domain}</strong></div>
  <div style="margin:16px 0 6px;font-size:10pt;color:#666;">Submitted by</div>
  <div style="font-size:14pt;font-weight:bold;">${msme.company_name}</div>
  ${m.udyam_number ? `<div style="font-size:10pt;color:#555;">Udyam: ${m.udyam_number}</div>` : ""}
  ${m.gst_number ? `<div style="font-size:10pt;color:#555;">GSTIN: ${m.gst_number}</div>` : ""}
  <div style="font-size:10.5pt;color:#444;margin-top:6px;">Date: ${today}</div>
  ${tender.startup_exemption ? '<div class="badge">🔥 DPIIT Startup — EMD &amp; Turnover Exemption Claimed</div>' : ""}
</div>

<!-- ═══ ENVELOPE GUIDE ═══ -->
<div class="envelope"><strong>Envelope 1 (Technical Bid):</strong> Sections A, B, C, E, F — eligibility docs, technical proposal, declarations</div>
<div class="envelope"><strong>Envelope 2 (Financial Bid):</strong> Section D — price bid only. Open only if technically qualified.</div>

<!-- ═══ SECTION A: BIDDER DETAILS ═══ -->
<h2>SECTION A — BIDDER INFORMATION</h2>
<table class="kv">
  <tr><td>Company Name</td><td>${msme.company_name}</td></tr>
  ${m.gst_number ? `<tr><td>GSTIN</td><td>${m.gst_number}</td></tr>` : ""}
  ${m.pan_number ? `<tr><td>PAN</td><td>${m.pan_number}</td></tr>` : ""}
  ${m.udyam_number ? `<tr><td>Udyam Reg. No.</td><td>${m.udyam_number}</td></tr>` : ""}
  <tr><td>Business Domain</td><td>${msme.domain_category}</td></tr>
  <tr><td>Annual Turnover</td><td>₹${msme.turnover_lakhs} Lakhs (as per last audited accounts)</td></tr>
  <tr><td>Years in Business</td><td>${msme.years_in_business} years</td></tr>
  ${(m.state || m.city) ? `<tr><td>Registered Address</td><td>${[m.city, m.state].filter(Boolean).join(", ")}</td></tr>` : ""}
  ${msme.certifications.length ? `<tr><td>Certifications</td><td>${msme.certifications.join(", ")}</td></tr>` : ""}
  <tr><td>Authorized Signatory</td><td>${signatory.authorizedName}${signatory.authorizedDesignation ? ", " + signatory.authorizedDesignation : ""}</td></tr>
</table>

<!-- ═══ SECTION B: TECHNICAL BID ═══ -->
<h2>SECTION B — TECHNICAL PROPOSAL (ENVELOPE 1)</h2>
<h3>B.1 Understanding of Requirement</h3>
<p>${msme.company_name} has carefully studied the tender notice and all related documents for <em>${tender.title}</em> issued by ${tender.issuer}. We confirm our understanding of the complete scope of work and our capability to execute the same within stipulated timelines and specifications.</p>
<h3 style="margin-top:12px;">B.2 Proposed Methodology &amp; Work Plan</h3>
<p style="white-space:pre-wrap;">${approach}</p>
${isCivil ? `<h3 style="margin-top:12px;">B.3 Note on Bill of Quantities (BOQ)</h3>
<p>The duly filled BOQ (as per NIT schedule) is enclosed separately in this envelope. Quantities have not been altered. Unit rates have been quoted for all items.</p>` : ""}

<!-- ═══ SECTION C: PAST EXPERIENCE ═══ -->
<h2>SECTION C — RELEVANT PAST EXPERIENCE (ENVELOPE 1)</h2>
<p style="font-size:10.5pt;margin-bottom:8px;">Similar works executed in the last 7 years. Completion certificates from clients to be enclosed.</p>
<table>
  <thead>
    <tr>
      <th style="width:40px;">S.No</th>
      <th>Project / Work Name</th>
      <th>Client (Govt/PSU preferred)</th>
      <th>Value (₹)</th>
      <th>Completion Year</th>
      <th>Cert. Ref. No.</th>
    </tr>
  </thead>
  <tbody>${expRows}</tbody>
</table>

<!-- ═══ SECTION D: FINANCIAL BID ═══ -->
<h2>SECTION D — FINANCIAL BID (ENVELOPE 2)</h2>
<p style="margin-bottom:8px;">To: The ${tender.issuer}<br/>
Subject: Financial Bid for — ${tender.title}${nitNumber ? ` (NIT Ref: ${nitNumber})` : ""}</p>
<p>We hereby submit our financial bid as under:</p>
<div class="center" style="margin:10px 0;">
  <div class="amount">₹ ${quotedAmount} Lakhs</div>
  <div style="font-size:10pt;color:#555;margin-top:4px;">(Rupees ${quotedAmount} Lakhs only — inclusive of all taxes, duties &amp; levies)</div>
</div>
<table class="kv" style="margin-top:10px;">
  <tr><td>Bid Validity</td><td>${priceValidity || "90"} days from bid submission date</td></tr>
  <tr><td>Performance Security</td><td>5% of contract value; Bank Guarantee to be submitted within 15 days of award</td></tr>
  ${needsEmd ? `
  <tr><td>EMD Amount</td><td>₹${tender.requirements_json.emd_lakhs} Lakhs</td></tr>
  <tr><td>EMD Instrument</td><td>Demand Draft</td></tr>
  ${signatory.bankName ? `<tr><td>Bank &amp; Branch</td><td>${signatory.bankName}${signatory.bankBranch ? ", " + signatory.bankBranch : ""}</td></tr>` : ""}
  ${signatory.ddNumber ? `<tr><td>DD Number</td><td>${signatory.ddNumber}</td></tr>` : ""}
  ` : `<tr><td>EMD</td><td>${tender.startup_exemption ? "Waived — DPIIT Startup Exemption (Certificate enclosed)" : "Not applicable per NIT"}</td></tr>`}
</table>

<!-- ═══ SECTION E: DOCUMENT CHECKLIST ═══ -->
<h2>SECTION E — MANDATORY DOCUMENTS CHECKLIST (ENVELOPE 1)</h2>
<table>
  <thead><tr><th style="width:50px;">S.No</th><th>Document</th><th style="width:80px;">Enclosed</th></tr></thead>
  <tbody>
    ${docRows}
    ${m.gst_number ? `<tr><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">${tender.requirements_json.mandatory_docs.length + 1}</td><td style="border:1px solid #ddd;padding:7px 10px;">GST Registration Certificate</td><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">☑</td></tr>` : ""}
    ${m.pan_number ? `<tr><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">${tender.requirements_json.mandatory_docs.length + 2}</td><td style="border:1px solid #ddd;padding:7px 10px;">PAN Card</td><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">☑</td></tr>` : ""}
    ${tender.startup_exemption ? `<tr><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">*</td><td style="border:1px solid #ddd;padding:7px 10px;">DPIIT Startup Recognition Certificate</td><td style="border:1px solid #ddd;padding:7px 10px;text-align:center;">☐</td></tr>` : ""}
  </tbody>
</table>

<!-- ═══ SECTION F: DECLARATIONS ═══ -->
<h2>SECTION F — DECLARATIONS &amp; UNDERTAKINGS (ENVELOPE 1)</h2>
<div class="decl">

<h3>F.1 Bid Form (Form T-1)</h3>
<p>To: The ${tender.issuer}</p>
<p>We, the undersigned, offer to execute <em>${tender.title}</em> in accordance with the Tender Notice${nitNumber ? ` No. ${nitNumber}` : ""} and all related documents. We have examined and accept all terms, conditions, and specifications without reservation.</p>

<h3 style="margin-top:10px;">F.2 Undertakings</h3>
<ol class="decl-list">
  <li>All information and documents submitted are true, accurate, and verifiable.</li>
  <li>Our firm / company has not been blacklisted, debarred, or suspended by any Central / State Government, PSU, or autonomous body.</li>
  <li>Our firm is not under insolvency, winding-up, or bankruptcy proceedings.</li>
  <li>We are in compliance with all applicable tax obligations (GST, Income Tax) and labour laws (EPF, ESI).</li>
  <li>We have not offered, nor will offer, any bribe, gratification, or illegal consideration to any public servant in connection with this tender.</li>
  <li>This bid has been prepared independently. We have not colluded with any other bidder on pricing or strategy (Anti-Collusion Declaration).</li>
  ${tender.startup_exemption ? "<li>We hold a valid DPIIT Startup Recognition and are entitled to exemption from EMD and minimum turnover criteria as per applicable government orders.</li>" : ""}
  ${isLargeTender ? "<li>We agree to sign the Integrity Pact as required and comply with the monitoring provisions therein.</li>" : ""}
  <li>Prices quoted are firm and valid for the stated validity period and shall not be subject to any escalation except as specified in the contract.</li>
</ol>

</div>

<!-- Signature Block -->
<div class="sig">
  <div>
    <div style="font-size:10.5pt;color:#555;margin-bottom:30px;">For and on behalf of</div>
    <div style="font-size:12pt;font-weight:bold;">${msme.company_name}</div>
    <div class="sig-line" style="margin-left:0;text-align:left;width:220px;">
      <div>${signatory.authorizedName || "Authorized Signatory"}</div>
      <div style="color:#666;">${signatory.authorizedDesignation || "Designation"}</div>
    </div>
  </div>
  <div style="text-align:right;font-size:10.5pt;">
    <div>Date: ${today}</div>
    <div style="margin-top:4px;color:#555;">Place: ${(m.city as string) || (m.state as string) || "________________"}</div>
    <div style="margin-top:20px;border:1px solid #888;width:100px;height:80px;display:inline-flex;align-items:center;justify-content:center;color:#aaa;font-size:9pt;">Company<br/>Seal</div>
  </div>
</div>

</body>
</html>`;
}

// ── COMPONENT ──────────────────────────────────────────────────────────────────
export function CreateBidModal({ tender, msmeProfile, onClose }: Props) {
  const [nitNumber, setNitNumber] = useState(tender.nit_number ?? "");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [approach, setApproach] = useState("");
  const [priceValidity, setPriceValidity] = useState("90");

  const [saved, setSaved] = useState<SavedBidProfile>({
    authorizedName: "", authorizedDesignation: "", bankName: "", bankBranch: "", ddNumber: "", pastProjects: [],
  });
  const [saveProfile, setSaveProfile] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const needsEmd = tender.requirements_json.emd_lakhs > 0 && !tender.startup_exemption;

  useEffect(() => {
    // Try Supabase first, fall back to localStorage
    loadBidProfile().then(remote => {
      const data = remote ?? loadSaved();
      setSaved({
        ...data,
        ddNumber: data.ddNumber ?? "",
        pastProjects: data.pastProjects.length ? data.pastProjects : [emptyProject()],
      });
    }).catch(() => {
      const data = loadSaved();
      setSaved({ ...data, pastProjects: data.pastProjects.length ? data.pastProjects : [emptyProject()] });
    });
  }, []);

  const updateSaved = (patch: Partial<SavedBidProfile>) =>
    setSaved(p => ({ ...p, ...patch }));

  const updateProject = (i: number, patch: Partial<PastProject>) =>
    setSaved(p => {
      const projects = [...p.pastProjects];
      projects[i] = { ...projects[i], ...patch };
      return { ...p, pastProjects: projects };
    });

  const addProject = () =>
    setSaved(p => ({ ...p, pastProjects: [...p.pastProjects, emptyProject()] }));

  const removeProject = (i: number) =>
    setSaved(p => ({ ...p, pastProjects: p.pastProjects.filter((_, idx) => idx !== i) }));

  const handleGenerate = () => {
    setError("");
    if (!quotedAmount.trim() || isNaN(parseFloat(quotedAmount))) {
      setError("Enter your quoted bid amount in Lakhs"); return;
    }
    if (approach.trim().length < 20) {
      setError("Technical approach too short (min 20 characters)"); return;
    }
    if (!saved.authorizedName.trim()) {
      setError("Enter the authorized signatory name"); return;
    }

    if (saveProfile) {
      // Save to Supabase + localStorage simultaneously
      saveBidProfile(saved).catch(() => {});
      saveBidProfileLocal(saved);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }

    setGenerating(true);
    setTimeout(() => {
      const html = generateBidHTML(tender, msmeProfile, nitNumber, quotedAmount, approach, priceValidity, saved, false);
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
      setGenerating(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-white"
        style={{ boxShadow: "20px 20px 60px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <FileDown className="w-5 h-5 text-[#7C6FF7]" />
              Create Bid Document
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate max-w-sm">{tender.title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Auto-filled notice */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#E8F8F0] text-xs font-semibold text-[#16A34A]">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Auto-filled: <strong>{msmeProfile.company_name}</strong>
              {(msmeProfile as Record<string,unknown>).gst_number ? ` · GST ✓` : ""}
              {(msmeProfile as Record<string,unknown>).pan_number ? ` · PAN ✓` : ""}
              {(msmeProfile as Record<string,unknown>).udyam_number ? ` · Udyam ✓` : ""}
              {msmeProfile.certifications.length ? ` · ${msmeProfile.certifications.length} cert(s)` : ""}
              {" · "}turnover + years in business</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {error && <div className="p-3 rounded-2xl bg-[#FEF2F2] text-[#DC2626] text-sm font-semibold">⚠️ {error}</div>}
          {savedNotice && <div className="p-3 rounded-2xl bg-[#E8F8F0] text-[#16A34A] text-sm font-semibold">✅ Profile saved — reused for next tender</div>}

          {/* Tender-specific */}
          <div className="space-y-3">
            <SectionLabel icon={IndianRupee} label="Tender-specific Details" />
            <Field label="NIT / Tender Reference Number" value={nitNumber} onChange={setNitNumber}
              placeholder="e.g. NIT/RVNL/2026/047" hint="(from tender notice)" mono />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your Quoted Amount (₹ Lakhs)" value={quotedAmount} onChange={setQuotedAmount}
                type="number" placeholder={`e.g. ${tender.estimated_value_lakhs}`} required />
              <Field label="Price Validity (days)" value={priceValidity} onChange={setPriceValidity}
                type="number" placeholder="90" hint="(typically 90)" />
            </div>
            <Field label="Technical Approach & Methodology" value={approach} onChange={setApproach}
              textarea required placeholder="Describe how you will execute this project — methodology, key steps, resources, milestones…" />
          </div>

          {/* Past Projects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel icon={Briefcase} label="Past Relevant Experience" hint="saved for reuse" />
              <button onClick={addProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#7C6FF7] bg-[#F3EFFF] hover:bg-[#E8E3FF] transition-all"
                style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.05)" }}>
                <Plus className="w-3 h-3" /> Add Project
              </button>
            </div>
            {saved.pastProjects.map((p, i) => (
              <div key={i} className="clay-inset p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">Project {i + 1}</span>
                  {saved.pastProjects.length > 1 && (
                    <button onClick={() => removeProject(i)} className="text-[#EF4444] hover:opacity-70">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Project / Work Name" value={p.name} onChange={v => updateProject(i, { name: v })} placeholder="e.g. NH-48 Widening" />
                  <Field label="Client / Organisation" value={p.client} onChange={v => updateProject(i, { client: v })} placeholder="e.g. NHAI" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Value (₹L)" value={p.value} onChange={v => updateProject(i, { value: v })} type="number" placeholder="e.g. 180" />
                  <Field label="Completion Year" value={p.completionYear} onChange={v => updateProject(i, { completionYear: v })} placeholder="e.g. 2023" />
                  <Field label="Cert. Ref. No." value={p.certRef} onChange={v => updateProject(i, { certRef: v })} placeholder="e.g. NHAI/CC/23/441" hint="(optional)" />
                </div>
              </div>
            ))}
          </div>

          {/* Signatory */}
          <div className="space-y-3">
            <SectionLabel icon={User} label="Authorized Signatory" hint="saved for reuse" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" value={saved.authorizedName} onChange={v => updateSaved({ authorizedName: v })} placeholder="e.g. Rajesh Kumar" required />
              <Field label="Designation" value={saved.authorizedDesignation} onChange={v => updateSaved({ authorizedDesignation: v })} placeholder="e.g. Managing Director" />
            </div>
          </div>

          {/* EMD / Bank */}
          {needsEmd && (
            <div className="space-y-3">
              <SectionLabel icon={Landmark} label="EMD — Bank / DD Details" hint="saved for reuse">
                <span className="clay-badge px-2 py-0.5 bg-[#FFF3CD] text-[#B45309] text-xs font-bold ml-2">
                  DD required: ₹{tender.requirements_json.emd_lakhs}L
                </span>
              </SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank Name" value={saved.bankName} onChange={v => updateSaved({ bankName: v })} placeholder="e.g. State Bank of India" />
                <Field label="Branch" value={saved.bankBranch} onChange={v => updateSaved({ bankBranch: v })} placeholder="e.g. Koramangala, Bengaluru" />
              </div>
              <Field label="DD Number" value={saved.ddNumber} onChange={v => updateSaved({ ddNumber: v })} placeholder="e.g. 123456" mono hint="(enter after DD is made)" />
            </div>
          )}

          {/* Save toggle */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F3EFFF]"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8)" }}>
            <button onClick={() => setSaveProfile(!saveProfile)}
              className={cn("w-10 h-5 rounded-full transition-all relative flex-shrink-0", saveProfile ? "bg-[#7C6FF7]" : "bg-gray-300")}
              style={{ boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)" }}>
              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", saveProfile ? "left-5" : "left-0.5")}
                style={{ boxShadow: "1px 1px 3px rgba(0,0,0,0.15)" }} />
            </button>
            <div>
              <p className="text-xs font-bold text-[#7C6FF7]">
                <Save className="w-3 h-3 inline mr-1" />
                Save signatory, bank &amp; past projects for next tender
              </p>
              <p className="text-xs text-gray-400">Stored locally in your browser — not uploaded anywhere</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <ClayButton variant="primary" size="md" onClick={handleGenerate} loading={generating} className="flex-1">
            <FileDown className="w-4 h-4" /> Generate Bid PDF
          </ClayButton>
          <ClayButton variant="ghost" size="md" onClick={onClose}>Cancel</ClayButton>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, label, hint, children }: {
  icon: React.ElementType; label: string; hint?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">{label}</span>
      {hint && <span className="text-xs text-[#22C55E] font-semibold">(💾 {hint})</span>}
      {children}
    </div>
  );
}
