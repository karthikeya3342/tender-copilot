"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tender, MsmeProfile } from "@/lib/mockData";

// Gemma 4 31B outputs its reasoning chain before the actual answer.
// The reasoning ends with checklist items like "• Kannada script? Yes."
// Extract everything after the last such item.
function extractFinalAnswer(text: string): string {
  // Find the last "? Yes." or "? No." — reasoning always ends here
  const pattern = /\?\s*(?:Yes|No)\.?\s*/g;
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) lastMatch = m;

  if (lastMatch) {
    const after = text.slice(lastMatch.index + lastMatch[0].length).trim();
    if (after.length > 5) return after;
  }

  // Fallback: last non-empty paragraph not starting with a bullet
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i];
    if (!p.startsWith("•") && !/\?\s*(Yes|No)/.test(p)) return p;
  }
  return text.trim();
}

export type ChatMessage = {
  role: "user" | "model";
  text: string;
};

function buildSystemPrompt(tender: Tender, msme: MsmeProfile, lang: "en" | "kn" = "en"): string {
  return `You are Tender Copilot, a helpful assistant for Indian MSMEs navigating government tenders.

OUTPUT FORMAT — NON-NEGOTIABLE:
Your reply must contain ONLY the answer. Nothing else.
DO NOT output: reasoning, thinking steps, "User asks:", "Input Tender Data:", "Constraint Checklist:", bullet analysis, intermediate steps, or any meta-commentary.
DO NOT repeat the question.
DO NOT list tender/MSME fields.
Write plain conversational sentences. Use bullet points only when listing 3+ items.
If info is missing from the data, say so in one sentence.
Max 100 words.

EXAMPLES OF CORRECT BEHAVIOUR:

User: What is the EMD amount?
Assistant: The EMD for this tender is ₹${tender.requirements_json.emd_lakhs} Lakhs.

User: Am I eligible?
Assistant: Yes, ${msme.company_name} meets the turnover and experience requirements${tender.startup_exemption ? " — and startup exemption applies so EMD is waived" : ""}.

User: What documents do I need?
Assistant: You need to submit: ${tender.requirements_json.mandatory_docs.slice(0, 3).join(", ")}${tender.requirements_json.mandatory_docs.length > 3 ? ", and more — check the full tender." : "."}

TENDER DATA:
Title: ${tender.title}
Issuer: ${tender.issuer}
Domain: ${tender.domain}
Value: ₹${tender.estimated_value_lakhs} Lakhs
Deadline: ${tender.deadline}
Startup Exemption: ${tender.startup_exemption ? "YES — DPIIT startups exempt from EMD and turnover" : "No"}
Summary: ${tender.summary}
Min Turnover: ₹${tender.requirements_json.min_turnover_lakhs}L | Min Years: ${tender.requirements_json.min_years} | EMD: ₹${tender.requirements_json.emd_lakhs}L
Certifications required: ${tender.requirements_json.certifications.join(", ") || "None"}
Mandatory documents: ${tender.requirements_json.mandatory_docs.join(", ")}

MSME: ${msme.company_name} | Domain: ${msme.domain_category} | Turnover: ₹${msme.turnover_lakhs}L | Experience: ${msme.years_in_business}yr | Certs: ${msme.certifications.join(", ") || "None"}
Turnover eligible: ${msme.turnover_lakhs >= tender.requirements_json.min_turnover_lakhs || tender.startup_exemption ? "YES" : "NO"} | Experience eligible: ${msme.years_in_business >= tender.requirements_json.min_years || tender.startup_exemption ? "YES" : "NO"}
Missing certs: ${tender.requirements_json.certifications.filter(c => !msme.certifications.includes(c)).join(", ") || "None"}
${lang === "kn" ? "\nIMPORTANT: You MUST respond entirely in Kannada (ಕನ್ನಡ) script. Every word of your answer must be in Kannada." : ""}`;
}

export async function sendTenderChatMessage(
  messages: ChatMessage[],
  tender: Tender,
  msme: MsmeProfile,
  lang: "en" | "kn" = "en"
): Promise<{ text: string; error?: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === "your_google_ai_studio_key_here") {
    return {
      text: "⚠️ Google AI API key not configured. Add GOOGLE_AI_API_KEY to your .env.local file to enable the chatbot.",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemma-4-31b-it",
      systemInstruction: buildSystemPrompt(tender, msme, lang),
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].text;
    const result = await chat.sendMessage(lastMessage);
    const raw = result.response.text();
    const text = extractFinalAnswer(raw);

    return { text };
  } catch (err) {
    console.error("Gemini chat error:", err);
    return {
      text: "Sorry, I couldn't process that question. Please try again.",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
