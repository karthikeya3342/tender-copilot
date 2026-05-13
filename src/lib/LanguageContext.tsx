"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Lang = "en" | "kn";

// ── Static UI string dictionary ────────────────────────────────────────────
const strings = {
  en: {
    signOut: "Sign Out",
    myDashboard: "My Dashboard",
    signedInAs: "Signed in as",
    language: "Language",
    english: "English",
    kannada: "ಕನ್ನಡ",
    goodMorning: "Good morning, here's your curated feed",
    domain: "Domain",
    turnover: "Turnover",
    experience: "Experience",
    bringYourOwn: "Bring Your Own Tender",
    bringYourOwnDesc: "Have an external tender PDF? Gemini AI extracts all details and opens instant analysis.",
    matched: "Matched",
    bookmarked: "Bookmarked",
    showingTenders: "Showing tenders matching",
    detailedAnalysis: "Detailed AI Analysis",
    eligibilityChecklist: "Eligibility Checklist",
    askCopilot: "Ask Tender Copilot",
    poweredByGemini: "Powered by Gemini",
    preFlightCheck: "Pre-Flight Compliance Check",
    applyForTender: "Apply for Tender",
    close: "Close",
    listen: "🔊 Listen",
    stopListening: "Stop",
    translating: "Translating…",
    generating: "Generating detailed analysis…",
    pass: "Pass",
    startupExempt: "Startup Exempt",
    exempted: "Exempted",
    quickQuestions: "Quick questions:",
    askAnything: "Ask anything about this tender…",
    uploadBid: "Upload your bid PDF — AI will verify all mandatory documents.",
    dropBidPackage: "Drop your bid package",
    verifyingDocs: "Gemini is verifying your documents…",
    allDocsVerified: "✅ All Documents Verified. Ready to Apply!",
    missingDocs: "⚠️ Missing Documents Detected",
    found: "Found",
    recheck: "Re-check",
    reupload: "Re-upload",
    clear: "Clear",
    years: "years",
    analyzeInDetail: "Analyze in Detail",
    eligibleAll: "Eligible — You meet all requirements",
    notEligible: "Not Eligible",
    startupExemptionApplies: "Startup exemption applies",
    globalTenderFeed: "Global Tender Feed",
    discoverOpportunities: "Discover Opportunities",
    withStartupExemption: "with Startup Exemption",
    totalValueLabel: "total value",
    searchPlaceholder: "Search tenders by title, domain, issuer…",
    startupExemptOnly: "Startup Exempt Only",
    showing: "Showing",
    tendersLabel: "tenders",
    noTendersMatch: "No tenders match your filters",
    geminiReadingTender: "Gemini is reading your tender…",
    extractingDetails: "Extracting title, requirements, EMD, documents…",
    dropExternalPdf: "Drop external tender PDF",
    geminiExtractsDetails: "Gemini extracts all details automatically",
    noMatchingTenders: "No matching tenders yet",
    noBookmarks: "No bookmarks yet",
    checkBackSoon: "Check back soon or use \"Bring Your Own Tender\"",
    bookmarkFromMatched: "Bookmark tenders from the matched tab",
    newLabel: "New",
    activeTenders: "active tenders",
    startupFriendly: "startup-friendly",
    sortNewest: "Newest",
    sortValueHigh: "Value: High to Low",
    sortDeadlineSoon: "Deadline: Soonest",
    domainAll: "All",
  },
  kn: {
    signOut: "ಸೈನ್ ಔಟ್",
    myDashboard: "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    signedInAs: "ಇದರಲ್ಲಿ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ",
    language: "ಭಾಷೆ",
    english: "English",
    kannada: "ಕನ್ನಡ",
    goodMorning: "ಶುಭೋದಯ, ನಿಮ್ಮ ಟೆಂಡರ್ ಫೀಡ್ ಇಲ್ಲಿದೆ",
    domain: "ಕ್ಷೇತ್ರ",
    turnover: "ವಹಿವಾಟು",
    experience: "ಅನುಭವ",
    bringYourOwn: "ನಿಮ್ಮ ಟೆಂಡರ್ ತನ್ನಿ",
    bringYourOwnDesc: "ಬಾಹ್ಯ ಟೆಂಡರ್ PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — Gemini AI ಎಲ್ಲ ವಿವರಗಳನ್ನು ತೆಗೆಯುತ್ತದೆ.",
    matched: "ಹೊಂದಾಣಿಕೆ",
    bookmarked: "ಬುಕ್‌ಮಾರ್ಕ್",
    showingTenders: "ಹೊಂದಾಣಿಕೆಯ ಟೆಂಡರ್‌ಗಳು",
    detailedAnalysis: "ವಿಸ್ತೃತ AI ವಿಶ್ಲೇಷಣೆ",
    eligibilityChecklist: "ಅರ್ಹತಾ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
    askCopilot: "ಟೆಂಡರ್ ಕೋಪೈಲಟ್ ಕೇಳಿ",
    poweredByGemini: "Gemini ಚಾಲಿತ",
    preFlightCheck: "ಪ್ರಿ-ಫ್ಲೈಟ್ ಅನುಸರಣೆ ತಪಾಸಣೆ",
    applyForTender: "ಟೆಂಡರ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    close: "ಮುಚ್ಚಿ",
    listen: "🔊 ಕೇಳಿ",
    stopListening: "ನಿಲ್ಲಿಸಿ",
    translating: "ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ…",
    generating: "ವಿಸ್ತೃತ ವಿಶ್ಲೇಷಣೆ ರಚಿಸಲಾಗುತ್ತಿದೆ…",
    pass: "ಪಾಸ್",
    startupExempt: "ಸ್ಟಾರ್ಟಪ್ ವಿನಾಯತಿ",
    exempted: "ವಿನಾಯತಿ",
    quickQuestions: "ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳು:",
    askAnything: "ಈ ಟೆಂಡರ್ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ…",
    uploadBid: "ನಿಮ್ಮ ಬಿಡ್ PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — AI ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.",
    dropBidPackage: "ಬಿಡ್ ಪ್ಯಾಕೇಜ್ ಇಲ್ಲಿ ಹಾಕಿ",
    verifyingDocs: "Gemini ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ…",
    allDocsVerified: "✅ ಎಲ್ಲ ದಾಖಲೆಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ. ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಿದ್ಧ!",
    missingDocs: "⚠️ ಕಾಣೆಯಾದ ದಾಖಲೆಗಳು ಪತ್ತೆಯಾಗಿವೆ",
    found: "ಕಂಡುಬಂದಿದೆ",
    recheck: "ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ",
    reupload: "ಮತ್ತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    clear: "ತೆರವು",
    years: "ವರ್ಷ",
    analyzeInDetail: "ವಿಸ್ತೃತ ವಿಶ್ಲೇಷಣೆ",
    eligibleAll: "ಅರ್ಹ — ಎಲ್ಲ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪೂರೈಸುತ್ತೀರಿ",
    notEligible: "ಅನರ್ಹ",
    startupExemptionApplies: "ಸ್ಟಾರ್ಟಪ್ ವಿನಾಯತಿ ಅನ್ವಯಿಸುತ್ತದೆ",
    globalTenderFeed: "ಜಾಗತಿಕ ಟೆಂಡರ್ ಫೀಡ್",
    discoverOpportunities: "ಅವಕಾಶಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ",
    withStartupExemption: "ಸ್ಟಾರ್ಟಪ್ ವಿನಾಯತಿಯೊಂದಿಗೆ",
    totalValueLabel: "ಒಟ್ಟು ಮೌಲ್ಯ",
    searchPlaceholder: "ಶೀರ್ಷಿಕೆ, ಕ್ಷೇತ್ರ, ನೀಡುಗರ ಮೂಲಕ ಹುಡುಕಿ…",
    startupExemptOnly: "ಸ್ಟಾರ್ಟಪ್ ವಿನಾಯತಿ ಮಾತ್ರ",
    showing: "ತೋರಿಸಲಾಗುತ್ತಿದೆ",
    tendersLabel: "ಟೆಂಡರ್‌ಗಳು",
    noTendersMatch: "ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ಟೆಂಡರ್ ಹೊಂದಿಕೆಯಾಗಿಲ್ಲ",
    geminiReadingTender: "Gemini ನಿಮ್ಮ ಟೆಂಡರ್ ಓದುತ್ತಿದೆ…",
    extractingDetails: "ಶೀರ್ಷಿಕೆ, ಅವಶ್ಯಕತೆಗಳು, EMD, ದಾಖಲೆಗಳನ್ನು ಹೊರತೆಗೆಯಲಾಗುತ್ತಿದೆ…",
    dropExternalPdf: "ಬಾಹ್ಯ ಟೆಂಡರ್ PDF ಇಲ್ಲಿ ಹಾಕಿ",
    geminiExtractsDetails: "Gemini ಎಲ್ಲ ವಿವರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತೆಗೆಯುತ್ತದೆ",
    noMatchingTenders: "ಇನ್ನೂ ಹೊಂದಾಣಿಕೆಯ ಟೆಂಡರ್‌ಗಳಿಲ್ಲ",
    noBookmarks: "ಇನ್ನೂ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳಿಲ್ಲ",
    checkBackSoon: "ಶೀಘ್ರದಲ್ಲೇ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ ಅಥವಾ \"ನಿಮ್ಮ ಟೆಂಡರ್ ತನ್ನಿ\" ಬಳಸಿ",
    bookmarkFromMatched: "ಹೊಂದಾಣಿಕೆ ಟ್ಯಾಬ್‌ನಿಂದ ಟೆಂಡರ್‌ಗಳನ್ನು ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಿ",
    newLabel: "ಹೊಸದು",
    activeTenders: "ಸಕ್ರಿಯ ಟೆಂಡರ್‌ಗಳು",
    startupFriendly: "ಸ್ಟಾರ್ಟಪ್-ಸ್ನೇಹಿ",
    sortNewest: "ಹೊಸತು",
    sortValueHigh: "ಮೌಲ್ಯ: ಹೆಚ್ಚಿನದರಿಂದ ಕಡಿಮೆಗೆ",
    sortDeadlineSoon: "ಗಡುವು: ಶೀಘ್ರ",
    domainAll: "ಎಲ್ಲ",
  },
} as const;

export type Strings = { [K in keyof typeof strings.en]: string };

// ── MyMemory translate (free, no API key, client-side) ─────────────────────
export async function translateContent(text: string, to: Lang): Promise<string> {
  if (to === "en") return text;
  if (!text.trim()) return text;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|kn`
    );
    const json = await res.json() as { responseData: { translatedText: string }; responseStatus: number };
    if (json.responseStatus === 200 && json.responseData.translatedText) {
      return json.responseData.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}

// ── Context ────────────────────────────────────────────────────────────────
interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
  translate: (text: string) => Promise<string>;
}

const Ctx = createContext<LanguageCtx>({
  lang: "en",
  setLang: () => {},
  t: strings.en,
  translate: async (t) => t,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("tc_lang") as Lang | null;
    if (saved === "en" || saved === "kn") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("tc_lang", l);
  };

  const translate = useCallback(
    (text: string) => translateContent(text, lang),
    [lang]
  );

  return (
    <Ctx.Provider value={{ lang, setLang, t: strings[lang], translate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() {
  return useContext(Ctx);
}
