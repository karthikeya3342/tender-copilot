"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tender, MsmeProfile } from "@/lib/mockData";

export type TenderAnalysis = {
  overview: string;
  scope: string;
  financials: string;
  eligibility_assessment: string;
  tips: string;
};

// Gemma echoes prompt instructions before giving actual content.
// Slice from the LAST [OVERVIEW] so we only parse the real answer block.
function extractAnswerBlock(text: string): string {
  const last = text.lastIndexOf("[OVERVIEW]");
  return last !== -1 ? text.slice(last) : text;
}

function parseSection(text: string, key: string, next: string | null): string {
  const start = text.indexOf(`[${key}]`);
  if (start === -1) return "";
  const contentStart = start + key.length + 2;
  const end = next ? text.indexOf(`[${next}]`, contentStart) : text.length;
  return text.slice(contentStart, end === -1 ? text.length : end).trim();
}

export async function generateDetailedSummary(
  tender: Tender,
  msme: MsmeProfile,
  lang: "en" | "kn" = "en"
): Promise<TenderAnalysis> {
  const fallback: TenderAnalysis = {
    overview: tender.summary,
    scope: `• Procurement of ${tender.title}\n• Issued by ${tender.issuer}\n• Domain: ${tender.domain}`,
    financials: `• Estimated value: ₹${tender.estimated_value_lakhs} Lakhs\n• EMD: ₹${tender.requirements_json.emd_lakhs} Lakhs\n• Min turnover required: ₹${tender.requirements_json.min_turnover_lakhs} Lakhs`,
    eligibility_assessment: `${msme.company_name} has ₹${msme.turnover_lakhs}L turnover and ${msme.years_in_business} years experience. ${msme.turnover_lakhs >= tender.requirements_json.min_turnover_lakhs ? "Meets" : "Does not meet"} turnover requirement. ${msme.years_in_business >= tender.requirements_json.min_years ? "Meets" : "Does not meet"} experience requirement.`,
    tips: `• Read the full tender document on the official portal\n• Prepare all mandatory documents in advance\n• Submit before the deadline: ${tender.deadline}`,
  };

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });

    const prompt = `You are an expert government tender analyst helping Indian MSMEs.

Analyze this tender for ${msme.company_name} and respond using EXACTLY the format below. No JSON. No markdown. No extra text outside the sections.

TENDER:
Title: ${tender.title}
Issuer: ${tender.issuer}
Domain: ${tender.domain}
Value: ₹${tender.estimated_value_lakhs} Lakhs | Deadline: ${tender.deadline}
Summary: ${tender.summary}
Startup Exemption: ${tender.startup_exemption ? "YES — startups exempt from EMD and turnover" : "No"}
Min Turnover: ₹${tender.requirements_json.min_turnover_lakhs}L | Min Years: ${tender.requirements_json.min_years} | EMD: ₹${tender.requirements_json.emd_lakhs}L
Certifications: ${tender.requirements_json.certifications.join(", ") || "None"}
Mandatory Documents: ${tender.requirements_json.mandatory_docs.join(", ")}

MSME:
Company: ${msme.company_name} | Domain: ${msme.domain_category}
Turnover: ₹${msme.turnover_lakhs}L | Years: ${msme.years_in_business} | Certs: ${msme.certifications.join(", ") || "None"}

REQUIRED OUTPUT FORMAT (copy these exact section headers):
${lang === "kn" ? "LANGUAGE: Write ALL content in Kannada (ಕನ್ನಡ) script only. Every sentence must be in Kannada." : "LANGUAGE: Write in English."}
[OVERVIEW]
Write 3-4 plain sentences: what this tender is, who issued it, what needs to be done, and why it matters.

[SCOPE]
List each deliverable or work item on its own line starting with •

[FINANCIALS]
List each financial detail on its own line starting with •. Include: contract value, EMD, min turnover, any payment terms.

[ELIGIBILITY]
Write 3-4 plain sentences directly assessing whether ${msme.company_name} can bid. State what they meet, what they lack, and what to prepare.

[TIPS]
Give 3-4 practical bidding tips, each on its own line starting with •`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("[detailedSummary] raw response length:", text.length);

    const block = extractAnswerBlock(text);
    const sections = ["OVERVIEW", "SCOPE", "FINANCIALS", "ELIGIBILITY", "TIPS"] as const;
    const parsed: Partial<TenderAnalysis> = {};

    parsed.overview = parseSection(block, "OVERVIEW", "SCOPE");
    parsed.scope = parseSection(block, "SCOPE", "FINANCIALS");
    parsed.financials = parseSection(block, "FINANCIALS", "ELIGIBILITY");
    parsed.eligibility_assessment = parseSection(block, "ELIGIBILITY", "TIPS");
    parsed.tips = parseSection(block, "TIPS", null);

    // Verify we got real content (not empty)
    const hasContent = sections.some(
      (s) => (parsed[s === "ELIGIBILITY" ? "eligibility_assessment" : s.toLowerCase() as keyof TenderAnalysis] ?? "").length > 20
    );

    if (!hasContent) {
      console.error("[detailedSummary] parsing yielded empty sections, raw:", text.slice(0, 300));
      return fallback;
    }

    return {
      overview: parsed.overview || fallback.overview,
      scope: parsed.scope || fallback.scope,
      financials: parsed.financials || fallback.financials,
      eligibility_assessment: parsed.eligibility_assessment || fallback.eligibility_assessment,
      tips: parsed.tips || fallback.tips,
    };
  } catch (err) {
    console.error("[detailedSummary] error:", err);
    return fallback;
  }
}
