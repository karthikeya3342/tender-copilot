"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export type ComplianceResult = {
  pass: boolean;
  found: string[];
  missing: string[];
};

export async function checkDocumentCompliance(
  fileBase64: string,
  mimeType: string,
  mandatoryDocs: string[]
): Promise<ComplianceResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { pass: false, found: [], missing: mandatoryDocs };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });

    const prompt = `You are a compliance checker for Indian government tender bid documents.

Analyze the uploaded document and determine which of these mandatory documents are present:
${mandatoryDocs.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Rules:
- A document is "found" if the file clearly contains it, references it, or it is visible as a section/attachment
- Be practical: match by document name, heading, or clear content match
- Respond with ONLY a JSON object, no markdown fences, no explanation:
{"found": ["exact doc name from list"], "missing": ["exact doc name from list"]}`;

    const result = await model.generateContent([
      { inlineData: { data: fileBase64, mimeType } },
      prompt,
    ]);

    const text = result.response.text().trim();
    const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    if (!jsonStr || jsonStr.length < 2) throw new Error("No JSON in Gemini response");

    const parsed = JSON.parse(jsonStr) as { found?: string[]; missing?: string[] };
    const found: string[] = Array.isArray(parsed.found) ? parsed.found : [];
    const missing: string[] = Array.isArray(parsed.missing)
      ? parsed.missing
      : mandatoryDocs.filter((d) => !found.includes(d));

    return { pass: missing.length === 0, found, missing };
  } catch (err) {
    console.error("[compliance] Gemini error:", err);
    // Fail open with all docs missing so user knows something went wrong
    return { pass: false, found: [], missing: mandatoryDocs };
  }
}
