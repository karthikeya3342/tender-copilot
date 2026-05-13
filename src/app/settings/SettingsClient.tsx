"use client";
import { useState, useTransition } from "react";
import {
  Building2, TrendingUp, Shield, Phone, MapPin,
  Users, CreditCard, CheckCircle2, ChevronLeft, Plus, X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ClayButton } from "@/components/ui/ClayButton";
import { cn } from "@/lib/utils";
import { updateMsmeProfile } from "@/app/actions/updateProfile";
import Link from "next/link";

const DOMAINS = [
  "IT & Software", "Civil Engineering", "Education & Training", "Healthcare",
  "Agriculture", "Manufacturing", "Textiles", "Food Processing",
  "Logistics & Transport", "Energy & Environment",
];

const COMMON_CERTS = ["ISO 9001", "ISO 27001", "MSME Udyam", "DPIIT Startup", "NABH", "CERT-In"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

type Props = {
  profile: {
    company_name: string;
    domain_category: string;
    turnover_lakhs: number;
    years_in_business: number;
    certifications: string[];
    gst_number?: string | null;
    pan_number?: string | null;
    udyam_number?: string | null;
    phone?: string | null;
    state?: string | null;
    city?: string | null;
    pincode?: string | null;
    employee_count?: number | null;
  } | null;
  userEmail: string;
};

function Field({
  label, value, onChange, placeholder, type = "text", icon: Icon, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.FC<{ className?: string }>; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {hint && <span className="font-normal normal-case text-gray-300 ml-1">{hint}</span>}
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

export default function SettingsClient({ profile, userEmail }: Props) {
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [domain, setDomain] = useState(profile?.domain_category ?? "");
  const [turnover, setTurnover] = useState(String(profile?.turnover_lakhs ?? ""));
  const [years, setYears] = useState(String(profile?.years_in_business ?? ""));
  const [certs, setCerts] = useState<string[]>(profile?.certifications ?? []);
  const [gst, setGst] = useState(profile?.gst_number ?? "");
  const [pan, setPan] = useState(profile?.pan_number ?? "");
  const [udyam, setUdyam] = useState(profile?.udyam_number ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [pincode, setPincode] = useState(profile?.pincode ?? "");
  const [employeeCount, setEmployeeCount] = useState(String(profile?.employee_count ?? ""));
  const [customCert, setCustomCert] = useState("");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleCert = (c: string) =>
    setCerts((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const addCustomCert = () => {
    const trimmed = customCert.trim();
    if (!trimmed || certs.includes(trimmed)) return;
    setCerts((prev) => [...prev, trimmed]);
    setCustomCert("");
  };

  const handleSave = () => {
    setError("");
    setSaved(false);
    if (!companyName || !domain || !turnover || !years) {
      setError("Company name, domain, turnover, and years are required.");
      return;
    }
    startTransition(async () => {
      const result = await updateMsmeProfile({
        company_name: companyName,
        domain_category: domain,
        turnover_lakhs: parseFloat(turnover),
        years_in_business: parseInt(years),
        certifications: certs,
        gst_number: gst,
        pan_number: pan,
        udyam_number: udyam,
        phone,
        state,
        city,
        pincode,
        employee_count: employeeCount ? parseInt(employeeCount) : null,
      });
      if (result.error) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF6ED]">
      <Navbar role="msme" userName={userEmail} />
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-xl bg-white flex items-center justify-center"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 2px 2px 6px rgba(0,0,0,0.06)" }}>
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Profile <span className="text-[#7C6FF7]">Settings</span></h1>
            <p className="text-sm text-gray-400 font-medium">Update your MSME profile — affects tender matching</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-[#FEF2F2] text-[#DC2626] text-sm font-semibold">{error}</div>
        )}
        {saved && (
          <div className="p-3 rounded-2xl bg-[#E8F8F0] flex items-center gap-2 text-[#16A34A] font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
          </div>
        )}

        {/* Basic Info */}
        <div className="clay-card bg-white p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Basic Information</h2>
          <Field label="Company Name" value={companyName} onChange={setCompanyName}
            placeholder="e.g. TechVentures Pvt Ltd" icon={Building2} />

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Business Domain</label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button key={d} onClick={() => setDomain(d)}
                  className={cn("px-3 py-1.5 rounded-2xl text-sm font-bold transition-all",
                    domain === d ? "bg-[#7C6FF7] text-white" : "bg-[#F3EFFF] text-[#7C6FF7] hover:bg-[#E8E3FF]"
                  )}
                  style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.05)" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Annual Turnover (₹L)" value={turnover} onChange={setTurnover}
              placeholder="e.g. 150" type="number" icon={TrendingUp} />
            <Field label="Years in Business" value={years} onChange={setYears}
              placeholder="e.g. 4" type="number" icon={Shield} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee Count" value={employeeCount} onChange={setEmployeeCount}
              placeholder="e.g. 25" type="number" icon={Users} />
            <Field label="Phone" value={phone} onChange={setPhone}
              placeholder="+91 98765 43210" icon={Phone} />
          </div>
        </div>

        {/* Certifications */}
        <div className="clay-card bg-white p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Certifications</h2>
          <div className="flex flex-wrap gap-2">
            {COMMON_CERTS.map((c) => (
              <button key={c} onClick={() => toggleCert(c)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-bold transition-all",
                  certs.includes(c) ? "bg-[#22C55E] text-white" : "bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]"
                )}
                style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.05)" }}>
                {certs.includes(c) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {c}
              </button>
            ))}
          </div>
          {/* Custom certs added by user */}
          {certs.filter(c => !COMMON_CERTS.includes(c)).map(c => (
            <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-bold bg-[#22C55E] text-white mr-2">
              {c}
              <button onClick={() => setCerts(prev => prev.filter(x => x !== c))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          <div className="flex gap-2 mt-1">
            <input
              value={customCert}
              onChange={(e) => setCustomCert(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCert(); } }}
              placeholder="Add other certification…"
              className="flex-1 clay-inset px-4 py-2.5 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300"
            />
            <button onClick={addCustomCert}
              className="px-4 py-2.5 rounded-2xl bg-[#F3EFFF] text-[#7C6FF7] text-sm font-bold"
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
              Add
            </button>
          </div>
        </div>

        {/* Registration Numbers */}
        <div className="clay-card bg-white p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Registration Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="GST Number" value={gst} onChange={setGst}
              placeholder="22AAAAA0000A1Z5" icon={CreditCard} />
            <Field label="PAN Number" value={pan} onChange={setPan}
              placeholder="ABCDE1234F" icon={CreditCard} />
            <Field label="Udyam Number" value={udyam} onChange={setUdyam}
              placeholder="UDYAM-KA-00-0000000" icon={CreditCard} />
          </div>
        </div>

        {/* Location */}
        <div className="clay-card bg-white p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Location</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5" /> State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full clay-inset px-4 py-3 text-sm text-gray-700 font-medium outline-none bg-transparent"
            >
              <option value="">Select state…</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={city} onChange={setCity} placeholder="e.g. Bangalore" />
            <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="e.g. 560001" />
          </div>
        </div>

        {/* Account */}
        <div className="clay-card bg-white p-6 space-y-3">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Account</h2>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-bold text-gray-600">Email</span>
            <span className="text-sm text-gray-400 font-medium">{userEmail}</span>
          </div>
        </div>

        <ClayButton variant="primary" size="md" onClick={handleSave} loading={isPending} className="w-full">
          Save Changes
        </ClayButton>
      </main>
    </div>
  );
}
