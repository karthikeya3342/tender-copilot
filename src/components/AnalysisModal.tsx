"use client";
import { useState, useRef, useEffect, useTransition } from "react";
import {
  X, Volume2, VolumeX, CheckCircle2, XCircle,
  Loader2, FileCheck, AlertTriangle,
  Send, Sparkles, RotateCcw, TrendingUp, FileText, Lightbulb, ClipboardList,
  Mic, MicOff,
} from "lucide-react";
import { Tender, MsmeProfile } from "@/lib/mockData";
import { ClayButton } from "@/components/ui/ClayButton";
import { DropZone } from "@/components/DropZone";
import { sendTenderChatMessage, ChatMessage } from "@/app/actions/tenderChat";
import { checkDocumentCompliance, ComplianceResult } from "@/app/actions/compliance";
import { generateDetailedSummary, TenderAnalysis } from "@/app/actions/detailedSummary";
import { CreateBidModal } from "@/components/CreateBidModal";
import { useLang } from "@/lib/LanguageContext";
import { domainsMatch } from "@/lib/domainMatch";
import { cn } from "@/lib/utils";

interface AnalysisModalProps {
  tender: Tender;
  msmeProfile: MsmeProfile;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What is the EMD amount?",
  "What documents do I need?",
  "Am I eligible as a startup?",
  "What is the project timeline?",
  "How do I submit the bid?",
  "What are the payment terms?",
];

type ComplianceState = "idle" | "checking" | "done";

// Strip markdown formatting Gemma sometimes leaks into responses
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
    .replace(/\*(.+?)\*/g, "$1")        // italic
    .replace(/^#{1,4}\s+/gm, "")        // headings
    .replace(/^\s*[-*]\s+/gm, "• ")     // unordered list markers → bullet
    .trim();
}

// Render text with \n as line breaks and • as bullet points
function SectionText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("•")) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#7C6FF7] mt-0.5 flex-shrink-0">•</span>
              <span className="text-sm text-gray-600 font-medium leading-relaxed">{trimmed.slice(1).trim()}</span>
            </div>
          );
        }
        return <p key={i} className="text-sm text-gray-600 font-medium leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
}

export function AnalysisModal({ tender, msmeProfile, onClose }: AnalysisModalProps) {
  const { t, translate, lang } = useLang();
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const ttsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Detailed analysis
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [, startAnalysisTransition] = useTransition();

  // Translated content cache
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedOverview, setTranslatedOverview] = useState<string | null>(null);
  const prevLang = useRef(lang);

  // Compliance state
  const [complianceState, setComplianceState] = useState<ComplianceState>("idle");
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load detailed analysis on mount
  useEffect(() => {
    setAnalysisLoading(true);
    startAnalysisTransition(async () => {
      const result = await generateDetailedSummary(tender, msmeProfile, lang);
      setAnalysis(result);
      setAnalysisLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tender.id, lang]);

  // Translate when language switches to KN
  useEffect(() => {
    if (lang === prevLang.current) return;
    prevLang.current = lang;

    if (lang === "kn") {
      const titleSrc = tender.title;
      const overviewSrc = analysis?.overview || tender.summary;
      Promise.all([
        translate(titleSrc),
        translate(overviewSrc),
      ]).then(([tt, to]) => {
        setTranslatedTitle(tt);
        setTranslatedOverview(to);
      });
    } else {
      setTranslatedTitle(null);
      setTranslatedOverview(null);
    }
  }, [lang, analysis, tender.title, tender.summary, translate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      if (ttsTimerRef.current) clearInterval(ttsTimerRef.current);
      audioRef.current?.pause();
      recognitionRef.current?.stop();
    };
  }, []);

  const displayTitle = lang === "kn" && translatedTitle ? translatedTitle : tender.title;
  const displayOverview = lang === "kn" && translatedOverview
    ? translatedOverview
    : (analysis?.overview || tender.summary);

  const cancelTts = () => {
    window.speechSynthesis?.cancel();
    if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }
    audioRef.current?.pause();
    audioRef.current = null;
  };

  const stopTts = () => {
    cancelTts();
    setTtsPlaying(false);
    setSpeakingMsgIdx(null);
  };

  // Split text into ≤180-char chunks on sentence/clause boundaries for Google TTS limit
  const chunkText = (text: string): string[] => {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.।,;!\n])\s+/);
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > 180) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += (current ? " " : "") + s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(Boolean);
  };

  // Play Kannada via Google Translate TTS proxy (handles missing kn-IN system voice)
  const playGoogleTts = (text: string, langCode: string, onDone: () => void) => {
    const chunks = chunkText(text);
    let i = 0;
    const playNext = () => {
      if (audioRef.current === null && i > 0) return; // cancelled
      if (i >= chunks.length) { onDone(); return; }
      const src = `/api/tts?lang=${langCode}&text=${encodeURIComponent(chunks[i])}`;
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => { i++; playNext(); };
      audio.onerror = () => { i++; playNext(); };
      audio.play().catch(() => { i++; playNext(); });
    };
    playNext();
  };

  // Web Speech API TTS for English (voices loaded async in Chrome)
  const getBestVoice = (targetLang: string): Promise<SpeechSynthesisVoice | null> =>
    new Promise((resolve) => {
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        return voices.find((v) => v.lang === targetLang)
          ?? voices.find((v) => v.lang.startsWith(targetLang.split("-")[0]))
          ?? null;
      };
      const immediate = pick();
      if (immediate !== null) { resolve(immediate); return; }
      const handler = () => { window.speechSynthesis.removeEventListener("voiceschanged", handler); resolve(pick()); };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      setTimeout(() => { window.speechSynthesis.removeEventListener("voiceschanged", handler); resolve(pick()); }, 2000);
    });

  // startTts does NOT touch state — caller manages state
  const startTts = (text: string, onDone: () => void) => {
    cancelTts();
    if (lang === "kn") {
      // Use Google Translate TTS proxy for Kannada — no system voice needed
      playGoogleTts(text, "kn", onDone);
      return;
    }
    if (!("speechSynthesis" in window)) { onDone(); return; }
    getBestVoice("en-US").then((voice) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      else { utterance.lang = "en-US"; }
      utterance.rate = 0.92;
      const cleanup = () => {
        if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }
        onDone();
      };
      utterance.onend = cleanup;
      utterance.onerror = cleanup;
      ttsTimerRef.current = setInterval(() => window.speechSynthesis.resume(), 5000);
      setTimeout(() => window.speechSynthesis.speak(utterance), 50);
    });
  };

  const handleListen = () => {
    if (ttsPlaying) { stopTts(); return; }
    setTtsPlaying(true);
    startTts(displayOverview, () => setTtsPlaying(false));
  };

  const handleSpeakMsg = (text: string, idx: number) => {
    if (speakingMsgIdx === idx) { stopTts(); return; }
    cancelTts();
    setSpeakingMsgIdx(idx);
    setTtsPlaying(false);
    startTts(text, () => setSpeakingMsgIdx(null));
  };

  const handleMic = () => {
    if (micActive) {
      recognitionRef.current?.stop();
      setMicActive(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "kn" ? "kn-IN" : "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => {
      setInput(e.results[0][0].transcript);
      setMicActive(false);
    };
    rec.onerror = () => setMicActive(false);
    rec.onend = () => setMicActive(false);
    recognitionRef.current = rec;
    rec.start();
    setMicActive(true);
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || isPending) return;
    const userMsg: ChatMessage = { role: "user", text: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const result = await sendTenderChatMessage(next, tender, msmeProfile, lang);
      setMessages((prev) => [...prev, { role: "model", text: result.text }]);
    });
  };

  const handleComplianceCheck = (file: File) => {
    setComplianceState("checking");
    setComplianceResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      startTransition(async () => {
        const result = await checkDocumentCompliance(base64, file.type || "application/pdf", tender.requirements_json.mandatory_docs);
        setComplianceResult(result);
        setComplianceState("done");
      });
    };
    reader.readAsDataURL(file);
  };

  const meetsEmd = tender.startup_exemption || tender.requirements_json.emd_lakhs === 0;
  const meetsTurnover = msmeProfile.turnover_lakhs >= tender.requirements_json.min_turnover_lakhs;
  const meetsYears = msmeProfile.years_in_business >= tender.requirements_json.min_years;
  const domainMatch = domainsMatch(msmeProfile.domain_category, tender.domain);

  const eligibilityChecks = [
    {
      label: lang === "kn" ? "ವಾರ್ಷಿಕ ವಹಿವಾಟು" : "Annual Turnover",
      detail: lang === "kn"
        ? `ನಿಮ್ಮ ₹${msmeProfile.turnover_lakhs}L — ಅಗತ್ಯ ₹${tender.requirements_json.min_turnover_lakhs}L`
        : `Your ₹${msmeProfile.turnover_lakhs}L — required ₹${tender.requirements_json.min_turnover_lakhs}L`,
      pass: meetsTurnover || tender.startup_exemption,
      exempted: !meetsTurnover && tender.startup_exemption,
    },
    {
      label: lang === "kn" ? "ವ್ಯಾಪಾರದ ಅನುಭವ" : "Years in Business",
      detail: lang === "kn"
        ? `ನಿಮ್ಮ ${msmeProfile.years_in_business} ವರ್ಷ — ಅಗತ್ಯ ${tender.requirements_json.min_years} ವರ್ಷ`
        : `Your ${msmeProfile.years_in_business}yr — required ${tender.requirements_json.min_years}yr`,
      pass: meetsYears || tender.startup_exemption,
      exempted: !meetsYears && tender.startup_exemption,
    },
    {
      label: lang === "kn" ? "EMD ಠೇವಣಿ" : "EMD Deposit",
      detail: tender.startup_exemption
        ? (lang === "kn" ? "ಸ್ಟಾರ್ಟಪ್ ವಿನಾಯತಿ — EMD ಅಗತ್ಯವಿಲ್ಲ" : "Startup exempt — EMD waived")
        : (lang === "kn"
          ? `₹${tender.requirements_json.emd_lakhs}L ಠೇವಣಿ ಅಗತ್ಯ`
          : `₹${tender.requirements_json.emd_lakhs}L deposit required`),
      pass: meetsEmd,
      exempted: tender.startup_exemption && tender.requirements_json.emd_lakhs > 0,
    },
    {
      label: lang === "kn" ? "ಕ್ಷೇತ್ರ ಹೊಂದಾಣಿಕೆ" : "Domain Match",
      detail: domainMatch
        ? (msmeProfile.domain_category === tender.domain
          ? (lang === "kn" ? `✓ ನಿಖರ ಹೊಂದಾಣಿಕೆ — ${msmeProfile.domain_category}` : `✓ Exact — ${msmeProfile.domain_category}`)
          : (lang === "kn"
            ? `✓ ಸಂಬಂಧಿತ: ${msmeProfile.domain_category} ≈ ${tender.domain}`
            : `✓ Related: ${msmeProfile.domain_category} ≈ ${tender.domain}`))
        : (lang === "kn"
          ? `ನಿಮ್ಮ: ${msmeProfile.domain_category} — ಟೆಂಡರ್: ${tender.domain}`
          : `Yours: ${msmeProfile.domain_category} — Tender: ${tender.domain}`),
      pass: domainMatch,
      exempted: false,
    },
    ...tender.requirements_json.certifications.map((cert) => {
      const has = msmeProfile.certifications.includes(cert);
      return {
        label: cert,
        detail: has
          ? (lang === "kn" ? "ಪ್ರಮಾಣೀಕೃತ ✓" : "Certified ✓")
          : (lang === "kn" ? "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಇಲ್ಲ" : "Not in your profile"),
        pass: has,
        exempted: false,
      };
    }),
  ];

  const passCount = eligibilityChecks.filter((c) => c.pass).length;
  const total = eligibilityChecks.length;

  const sections = [
    { key: "scope", icon: ClipboardList, label: lang === "kn" ? "ಕಾರ್ಯಾಧಿಕ್ಷೇತ್ರ" : "Scope of Work", color: "text-[#7C6FF7]", bg: "bg-[#F3EFFF]" },
    { key: "financials", icon: TrendingUp, label: lang === "kn" ? "ಆರ್ಥಿಕ ವಿವರಗಳು" : "Financial Details", color: "text-[#22C55E]", bg: "bg-[#E8F8F0]" },
    { key: "eligibility_assessment", icon: FileText, label: lang === "kn" ? "ನಿಮ್ಮ ಅರ್ಹತೆ" : "Eligibility for You", color: "text-[#F97316]", bg: "bg-[#FFF0E8]" },
    { key: "tips", icon: Lightbulb, label: lang === "kn" ? "ಬಿಡ್ ಸಲಹೆಗಳು" : "Bidding Tips", color: "text-[#EAB308]", bg: "bg-[#FFFBEA]" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: "white",
          boxShadow: "inset 3px 3px 10px rgba(255,255,255,0.9), inset -2px -2px 8px rgba(0,0,0,0.06), 20px 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-2 mb-1.5">
              {tender.startup_exemption && (
                <span className="clay-badge px-2.5 py-1 bg-[#FFF3CD] text-[#B45309] text-xs">🔥 {t.startupExempt}</span>
              )}
              <span className="clay-badge px-2.5 py-1 bg-[#F3EFFF] text-[#7C6FF7] text-xs">{tender.domain}</span>
              <span className="clay-badge px-2.5 py-1 bg-[#E8F8F0] text-[#16A34A] text-xs">₹{tender.estimated_value_lakhs}L</span>
              <span className="clay-badge px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] text-xs">Due: {tender.deadline}</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 leading-tight">{displayTitle}</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-semibold">{tender.issuer}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleListen}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                ttsPlaying ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#F3EFFF] text-[#7C6FF7] hover:bg-[#E8E3FF]"
              )}
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}
            >
              {ttsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {ttsPlaying ? t.stopListening : t.listen}
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
              style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: Summary + Checklist + Compliance ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 border-r border-gray-100">

            {/* Overview */}
            <div className="clay-inset p-5 rounded-3xl">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-3">{t.detailedAnalysis}</p>
              {analysisLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">{t.generating}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{displayOverview}</p>
              )}
            </div>

            {/* Analysis sections */}
            {!analysisLoading && analysis && sections.map(({ key, icon: Icon, label, color, bg }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", bg)}
                    style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 4px rgba(0,0,0,0.06)" }}>
                    <Icon className={cn("w-3.5 h-3.5", color)} />
                  </div>
                  <h3 className="font-extrabold text-gray-800 text-sm">{label}</h3>
                </div>
                <div className="clay-inset p-4 rounded-2xl">
                  <SectionText text={analysis[key]} />
                </div>
              </div>
            ))}

            {/* Eligibility Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800">{t.eligibilityChecklist}</h3>
                <span className={cn("clay-badge px-3 py-1 text-sm",
                  passCount === total ? "bg-[#E8F8F0] text-[#16A34A]" : "bg-[#FFF3CD] text-[#B45309]")}>
                  {passCount}/{total} {t.pass}
                </span>
              </div>
              <div className="space-y-2">
                {eligibilityChecks.map((check, i) => (
                  <div key={i}
                    className={cn("flex items-start gap-3 p-3 rounded-2xl", check.pass ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]")}
                    style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7)" }}
                  >
                    {check.pass
                      ? <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-700">{check.label}</span>
                        {check.exempted && (
                          <span className="clay-badge px-2 py-0.5 bg-[#FFF3CD] text-[#B45309] text-xs">{t.exempted} 🔥</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-Flight Compliance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#22C55E]" />
                <h3 className="font-extrabold text-gray-800">{t.preFlightCheck}</h3>
                <span className="clay-badge px-2 py-0.5 bg-[#E8F8F0] text-[#16A34A] text-xs ml-auto">{t.poweredByGemini}</span>
              </div>
              <p className="text-xs text-gray-400 font-semibold">{t.uploadBid}</p>

              {complianceState === "idle" && (
                <DropZone onFile={handleComplianceCheck} accept=".pdf,.zip"
                  label={t.dropBidPackage} sublabel="PDF or ZIP · AI verifies mandatory docs" compact />
              )}
              {complianceState === "checking" && (
                <div className="clay-inset py-8 flex flex-col items-center gap-3 rounded-3xl">
                  <Loader2 className="w-7 h-7 text-[#7C6FF7] animate-spin" />
                  <p className="text-sm font-bold text-gray-600">{t.verifyingDocs}</p>
                </div>
              )}
              {complianceState === "done" && complianceResult && (
                complianceResult.pass ? (
                  <div className="p-4 rounded-3xl bg-[#E8F8F0] flex items-start gap-3"
                    style={{ boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.8)" }}>
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#16A34A] text-sm">{t.allDocsVerified}</p>
                      <p className="text-xs text-[#16A34A]/70 mt-0.5">{t.found}: {complianceResult.found.join(", ")}</p>
                    </div>
                    <button onClick={() => { setComplianceState("idle"); setComplianceResult(null); }}
                      className="ml-auto text-xs text-[#16A34A] font-bold hover:underline">{t.recheck}</button>
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-[#FFF7ED] flex items-start gap-3"
                    style={{ boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.8)" }}>
                    <AlertTriangle className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-extrabold text-[#C2410C] text-sm">{t.missingDocs}</p>
                      {complianceResult.found.length > 0 && (
                        <p className="text-xs text-[#16A34A] mt-1 font-semibold">✓ {t.found}: {complianceResult.found.join(", ")}</p>
                      )}
                      <ul className="mt-1.5 space-y-1">
                        {complianceResult.missing.map((doc) => (
                          <li key={doc} className="text-xs text-[#C2410C]/80 font-semibold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => { setComplianceState("idle"); setComplianceResult(null); }}
                      className="ml-auto text-xs text-[#F97316] font-bold hover:underline flex-shrink-0">{t.reupload}</button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat ── */}
          <div className="w-80 xl:w-96 flex flex-col flex-shrink-0 bg-[#FAFAFA]">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#7C6FF7] flex items-center justify-center"
                  style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.3), 2px 2px 6px rgba(124,111,247,0.3)" }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-sm">{t.askCopilot}</p>
                  <p className="text-xs text-[#16A34A] font-semibold">{t.poweredByGemini}</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#7C6FF7] font-semibold transition-colors">
                  <RotateCcw className="w-3 h-3" /> {t.clear}
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col gap-3 h-full justify-end">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#7C6FF7] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-600 font-medium"
                      style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 2px 2px 8px rgba(0,0,0,0.06)" }}>
                      <p className="font-bold text-[#7C6FF7] text-xs mb-1">Tender Copilot</p>
                      Hi! I know everything about this tender. Ask me anything — eligibility, documents, EMD, timelines. 💬
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2 pl-1">{t.quickQuestions}</p>
                    <div className="flex flex-col gap-1.5">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button key={q} onClick={() => sendMessage(q)} disabled={isPending}
                          className="text-left px-3 py-2 rounded-2xl bg-white text-xs font-bold text-[#7C6FF7] hover:bg-[#F3EFFF] transition-all disabled:opacity-50"
                          style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 2px 2px 6px rgba(0,0,0,0.06)" }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "model" && (
                        <div className="w-6 h-6 rounded-full bg-[#7C6FF7] flex items-center justify-center flex-shrink-0 mb-0.5">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={cn("flex flex-col gap-1 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                        <div
                          className={cn("px-3 py-2.5 text-xs leading-relaxed font-medium w-full",
                            msg.role === "user"
                              ? "bg-[#7C6FF7] text-white rounded-2xl rounded-br-sm"
                              : "bg-white text-gray-700 rounded-2xl rounded-bl-sm"
                          )}
                          style={{
                            boxShadow: msg.role === "user"
                              ? "2px 2px 10px rgba(124,111,247,0.3)"
                              : "inset 1px 1px 3px rgba(255,255,255,0.9), 2px 2px 8px rgba(0,0,0,0.06)",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {msg.role === "model" ? cleanMarkdown(msg.text) : msg.text}
                        </div>
                        {msg.role === "model" && (
                          <button
                            onClick={() => handleSpeakMsg(cleanMarkdown(msg.text), i)}
                            title={speakingMsgIdx === i ? "Stop" : "Read aloud"}
                            className={cn("w-5 h-5 rounded-lg flex items-center justify-center transition-all",
                              speakingMsgIdx === i ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-gray-100 text-gray-400 hover:bg-[#F3EFFF] hover:text-[#7C6FF7]"
                            )}
                          >
                            {speakingMsgIdx === i ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isPending && (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full bg-[#7C6FF7] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3"
                        style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 2px 2px 8px rgba(0,0,0,0.06)" }}>
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-[#7C6FF7] animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isPending && messages.length < 6 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      {SUGGESTED_QUESTIONS.filter((q) => !messages.some((m) => m.text === q))
                        .slice(0, 3)
                        .map((q) => (
                          <button key={q} onClick={() => sendMessage(q)}
                            className="text-left px-3 py-1.5 rounded-2xl bg-white text-xs font-bold text-[#7C6FF7] hover:bg-[#F3EFFF] transition-all opacity-70 hover:opacity-100"
                            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.9), 2px 2px 6px rgba(0,0,0,0.06)" }}>
                            {q}
                          </button>
                        ))}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 flex items-center gap-2 bg-white flex-shrink-0">
              <button
                onClick={handleMic}
                title={micActive ? "Stop recording" : "Speak your question"}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                  micActive ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-gray-100 text-gray-400 hover:bg-[#F3EFFF] hover:text-[#7C6FF7]"
                )}
                style={micActive ? { boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 0 0 0 2px rgba(220,38,38,0.3)" } : {}}
              >
                {micActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={micActive ? "Listening…" : t.askAnything}
                disabled={isPending}
                className="flex-1 bg-transparent text-xs text-gray-700 font-medium outline-none placeholder:text-gray-300 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isPending}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  input.trim() && !isPending ? "bg-[#7C6FF7] text-white" : "bg-gray-100 text-gray-300")}
                style={input.trim() && !isPending
                  ? { boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.3), 2px 2px 8px rgba(124,111,247,0.3)" }
                  : {}}
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <ClayButton variant="primary" size="md" className="flex-1" onClick={() => setShowBidModal(true)}>
            {lang === "kn" ? "ಬಿಡ್ ಡಾಕ್ಯುಮೆಂಟ್ ರಚಿಸಿ" : "Create Bid Document"}
          </ClayButton>
          <ClayButton variant="ghost" size="md" onClick={onClose}>{t.close}</ClayButton>
        </div>
      </div>

      {showBidModal && (
        <CreateBidModal
          tender={tender}
          msmeProfile={msmeProfile}
          onClose={() => setShowBidModal(false)}
        />
      )}
    </div>
  );
}
