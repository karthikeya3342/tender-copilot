"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tender } from "@/lib/mockData";

export async function analyzeTenderPdf(
  fileBase64: string,
  mimeType: string
): Promise<{ tender: Tender | null; error?: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return { tender: null, error: "GOOGLE_AI_API_KEY not configured" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });

    const prompt = `You are an expert at extracting structured information from Indian government tender documents.

Analyze the uploaded tender PDF and extract the following information. Return ONLY a valid JSON object with no markdown fences, no explanation.

JSON schema:
{
  "title": "Full official title of the tender",
  "domain": "One of: IT & Software, Civil & Construction, Healthcare, Defence, Education, Agriculture, Other",
  "issuer": "Name of issuing government authority/department",
  "estimated_value_lakhs": <number in lakhs INR, 0 if not found>,
  "deadline": "Deadline date as string (YYYY-MM-DD or descriptive text)",
  "startup_exemption": <true if document mentions DPIIT/startup exemption from EMD or turnover, else false>,
  "nit_number": "NIT / Tender Reference Number exactly as printed (e.g. NIT No. XYZ/2025-26/01), null if not found",
  "summary": "2-3 sentence plain English summary of what this tender is about, what work needs to be done",
  "requirements_json": {
    "min_turnover_lakhs": <minimum annual turnover required in lakhs, 0 if not found>,
    "min_years": <minimum years in business required, 0 if not found>,
    "emd_lakhs": <EMD/earnest money deposit in lakhs, 0 if not found>,
    "certifications": ["list of required certifications like ISO 9001, MSME Udyam, etc"],
    "mandatory_docs": ["list of mandatory documents required for bid submission"]
  }
}

If the uploaded file does not appear to be a tender document, still return your best guess based on any content present. Do not return null — always return a complete JSON object.`;

    const result = await model.generateContent([
      { inlineData: { data: fileBase64, mimeType } },
      prompt,
    ]);

    const text = result.response.text().trim();
    const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    if (!jsonStr || jsonStr.length < 2) throw new Error("Gemini returned no JSON");

    const parsed = JSON.parse(jsonStr);

    const tender: Tender = {
      id: `custom-${Date.now()}`,
      nit_number: parsed.nit_number ?? null,
      title: parsed.title || "Uploaded Tender",
      domain: parsed.domain || "Other",
      issuer: parsed.issuer || "Unknown Authority",
      estimated_value_lakhs: Number(parsed.estimated_value_lakhs) || 0,
      deadline: parsed.deadline || "See document",
      startup_exemption: Boolean(parsed.startup_exemption),
      summary: parsed.summary || "No summary extracted.",
      requirements_json: {
        min_turnover_lakhs: Number(parsed.requirements_json?.min_turnover_lakhs) || 0,
        min_years: Number(parsed.requirements_json?.min_years) || 0,
        emd_lakhs: Number(parsed.requirements_json?.emd_lakhs) || 0,
        certifications: Array.isArray(parsed.requirements_json?.certifications)
          ? parsed.requirements_json.certifications
          : [],
        mandatory_docs: Array.isArray(parsed.requirements_json?.mandatory_docs)
          ? parsed.requirements_json.mandatory_docs
          : [],
      },
    };

    return { tender };
  } catch (err) {
    console.error("[analyzePdf] error:", err);
    return {
      tender: null,
      error: err instanceof Error ? err.message : "Failed to analyze PDF",
    };
  }
}
