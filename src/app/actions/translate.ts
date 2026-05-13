"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function translateToKannada(text: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return text;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });
    const result = await model.generateContent(
      `Translate the following text to Kannada (ಕನ್ನಡ script). Return ONLY the Kannada translation, no English, no explanation:\n\n${text}`
    );
    return result.response.text().trim();
  } catch {
    return text;
  }
}
