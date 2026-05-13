"use client";
import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap, Mail, Lock, Eye, EyeOff, Building2, Globe,
  TrendingUp, Shield, Plus, X, ChevronRight, Phone,
  MapPin, Users, FileText, Hash,
} from "lucide-react";
import { ClayButton } from "@/components/ui/ClayButton";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DOMAINS = [
  "IT & Software", "Civil Engineering", "Education & Training",
  "Healthcare", "Agriculture", "Manufacturing",
  "Textiles", "Food Processing", "Logistics & Transport", "Energy & Environment",
  "Defence & Security", "Water & Sanitation",
];

const CERTS = ["ISO 9001", "ISO 27001", "MSME Udyam", "DPIIT Startup", "NABH", "CERT-In", "ISO 14001", "BIS"];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

type Step = "role" | "form";
type RoleChoice = "explorer" | "msme";

function InputField({
  label, icon: Icon, value, onChange, type = "text", placeholder, required, hint,
}: {
  label: string; icon?: React.ElementType; value: string;
  onChange: (v: string) => void; type?: string;
  placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {required && <span className="text-[#F97316] normal-case font-extrabold">*</span>}
        {hint && <span className="text-gray-300 font-medium normal-case">{hint}</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300"
      />
    </div>
  );
}

function SignupInner() {
  const params = useSearchParams();
  const initialRole = (params.get("role") as RoleChoice) ?? null;

  const [step, setStep] = useState<Step>(initialRole ? "form" : "role");
  const [role, setRole] = useState<RoleChoice>(initialRole ?? "explorer");

  // Common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");

  // MSME business identity
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [udyamNumber, setUdyamNumber] = useState("");

  // MSME business profile
  const [domain, setDomain] = useState("");
  const [turnover, setTurnover] = useState("");
  const [years, setYears] = useState("");
  const [employees, setEmployees] = useState("");
  const [certs, setCerts] = useState<string[]>([]);

  // Location
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleCert = (c: string) =>
    setCerts((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);

  const handleSubmit = () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Email and password required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (role === "msme") {
      if (!companyName.trim()) { setError("Company name is required"); return; }
      if (!domain) { setError("Select your business domain"); return; }
      if (!turnover || isNaN(parseFloat(turnover))) { setError("Enter your annual turnover in Lakhs"); return; }
      if (!years || isNaN(parseInt(years))) { setError("Enter years in business"); return; }
      if (!state) { setError("Select your state"); return; }
    }

    startTransition(async () => {
      const supabase = createClient();

      const metadata = role === "msme" ? {
        role,
        company_name: companyName.trim(),
        domain_category: domain,
        turnover_lakhs: parseFloat(turnover),
        years_in_business: parseInt(years),
        certifications: certs,
        gst_number: gstNumber.trim().toUpperCase(),
        pan_number: panNumber.trim().toUpperCase(),
        udyam_number: udyamNumber.trim().toUpperCase(),
        phone: phone.trim(),
        state,
        city: city.trim(),
        pincode: pincode.trim(),
        employee_count: employees ? parseInt(employees) : null,
      } : { role };

      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: metadata },
      });

      if (authErr) { setError(authErr.message); return; }
      if (!data.user) {
        setError("Signup failed. Disable email confirmation: Supabase Dashboard → Auth → Providers → Email.");
        return;
      }

      if (role === "msme") {
        supabase.from("msme_profiles").upsert({
          user_id: data.user.id,
          company_name: companyName.trim(),
          domain_category: domain,
          turnover_lakhs: parseFloat(turnover),
          years_in_business: parseInt(years),
          certifications: certs,
          gst_number: gstNumber.trim() || null,
          pan_number: panNumber.trim() || null,
          udyam_number: udyamNumber.trim() || null,
          phone: phone.trim() || null,
          state: state || null,
          city: city.trim() || null,
          pincode: pincode.trim() || null,
          employee_count: employees ? parseInt(employees) : null,
        }).then(() => {});
      }

      window.location.href = role === "msme" ? "/dashboard" : "/explorer";
    });
  };

  // ─── Step 1 ───────────────────────────────────────────────────────────────
  if (step === "role") {
    return (
      <div className="min-h-screen bg-[#FFF6ED] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-11 h-11 rounded-xl bg-[#7C6FF7] flex items-center justify-center"
              style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.4), 4px 4px 14px rgba(124,111,247,0.4)" }}>
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">Tender<span className="text-[#7C6FF7]">Copilot</span></h1>
          </div>

          <div className="clay-card bg-white p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-800">Create your account</h2>
              <p className="text-sm text-gray-400 font-medium mt-1">Choose how you want to use TenderCopilot</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setRole("msme"); setStep("form"); }}
                className="w-full p-5 rounded-3xl border-2 border-[#F97316] bg-[#FFF0E8] text-left hover:scale-[1.01] transition-transform"
                style={{ boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.7), 3px 3px 12px rgba(249,115,22,0.1)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 8px rgba(249,115,22,0.3)" }}>
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800 text-base">MSME / Business</p>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">Get matched tenders, eligibility checks, AI analysis & compliance tools</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#F97316] ml-auto flex-shrink-0" />
                </div>
              </button>

              <button onClick={() => { setRole("explorer"); setStep("form"); }}
                className="w-full p-5 rounded-3xl border-2 border-[#7C6FF7] bg-[#F3EFFF] text-left hover:scale-[1.01] transition-transform"
                style={{ boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.7), 3px 3px 12px rgba(124,111,247,0.1)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7C6FF7] flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 8px rgba(124,111,247,0.3)" }}>
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800 text-base">Explorer</p>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">Browse all active government tenders — no business profile needed</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#7C6FF7] ml-auto flex-shrink-0" />
                </div>
              </button>
            </div>
            <p className="text-center text-sm text-gray-400 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-[#7C6FF7] font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2 ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFF6ED] flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-11 h-11 rounded-xl bg-[#7C6FF7] flex items-center justify-center"
            style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.4), 4px 4px 14px rgba(124,111,247,0.4)" }}>
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-800">Tender<span className="text-[#7C6FF7]">Copilot</span></h1>
        </div>

        <div className="clay-card bg-white p-8 space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("role")}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
              ←
            </button>
            <div>
              <h2 className="text-lg font-black text-gray-800">
                {role === "msme" ? "MSME Registration" : "Explorer Registration"}
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {role === "msme" ? "Set up your complete business profile" : "Create your free account"}
              </p>
            </div>
            <span className={cn("ml-auto clay-badge px-3 py-1 text-xs font-bold",
              role === "msme" ? "bg-[#FFF0E8] text-[#F97316]" : "bg-[#F3EFFF] text-[#7C6FF7]")}>
              {role === "msme" ? "MSME" : "Explorer"}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-[#FEF2F2] text-[#DC2626] text-sm font-semibold">⚠️ {error}</div>
          )}

          {/* ── Account Credentials ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Account</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Email <span className="text-[#F97316]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com" autoComplete="email"
                    className="w-full clay-inset pl-10 pr-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Password <span className="text-[#F97316]">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters" autoComplete="new-password"
                    className="w-full clay-inset pl-10 pr-12 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <InputField label="Phone Number" icon={Phone} value={phone} onChange={setPhone}
              type="tel" placeholder="+91 98765 43210" hint="(optional)" />
          </div>

          {/* ── MSME-only fields ── */}
          {role === "msme" && (
            <>
              {/* Business Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Business Identity</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <InputField label="Company / Business Name" icon={Building2} value={companyName}
                  onChange={setCompanyName} placeholder="e.g. TechVentures Pvt Ltd" required />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> GST Number <span className="text-gray-300 font-medium normal-case">(optional)</span>
                    </label>
                    <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5" maxLength={15}
                      className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300 font-mono tracking-wider" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> PAN Number <span className="text-gray-300 font-medium normal-case">(optional)</span>
                    </label>
                    <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F" maxLength={10}
                      className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300 font-mono tracking-wider" />
                  </div>
                </div>

                <InputField label="MSME Udyam Registration Number" icon={FileText}
                  value={udyamNumber} onChange={(v) => setUdyamNumber(v.toUpperCase())}
                  placeholder="UDYAM-KA-00-0000000" hint="(optional)" />
              </div>

              {/* Business Domain */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Business Profile</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Business Domain <span className="text-[#F97316]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map((d) => (
                      <button key={d} type="button" onClick={() => setDomain(d)}
                        className={cn("px-3 py-1.5 rounded-2xl text-xs font-bold transition-all",
                          domain === d ? "bg-[#7C6FF7] text-white" : "bg-[#F3EFFF] text-[#7C6FF7] hover:bg-[#E8E3FF]")}
                        style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.05)" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Turnover (₹L/yr) <span className="text-[#F97316]">*</span>
                    </label>
                    <input type="number" value={turnover} onChange={(e) => setTurnover(e.target.value)}
                      placeholder="e.g. 150" min="0"
                      className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Years in Biz <span className="text-[#F97316]">*</span>
                    </label>
                    <input type="number" value={years} onChange={(e) => setYears(e.target.value)}
                      placeholder="e.g. 4" min="0"
                      className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Users className="w-3 h-3" /> Employees
                    </label>
                    <input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)}
                      placeholder="e.g. 25" min="1"
                      className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Certifications <span className="text-gray-300 font-medium normal-case">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CERTS.map((c) => (
                      <button key={c} type="button" onClick={() => toggleCert(c)}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all",
                          certs.includes(c) ? "bg-[#22C55E] text-white" : "bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]")}
                        style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.05)" }}>
                        {certs.includes(c) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Location</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> State <span className="text-[#F97316]">*</span>
                  </label>
                  <select value={state} onChange={(e) => setState(e.target.value)}
                    className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none bg-transparent">
                    <option value="">Select state…</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="City" value={city} onChange={setCity} placeholder="e.g. Bengaluru" />
                  <InputField label="Pincode" value={pincode} onChange={setPincode} placeholder="e.g. 560001" />
                </div>
              </div>
            </>
          )}

          <ClayButton
            variant={role === "msme" ? "secondary" : "primary"}
            size="md"
            onClick={handleSubmit}
            loading={isPending}
            className="w-full"
          >
            {role === "msme" ? "Create MSME Account →" : "Create Explorer Account →"}
          </ClayButton>

          <p className="text-center text-sm text-gray-400 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7C6FF7] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF6ED] flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#7C6FF7] animate-pulse" />
      </div>
    }>
      <SignupInner />
    </Suspense>
  );
}
