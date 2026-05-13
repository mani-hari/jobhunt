import { GoogleGenerativeAI } from "@google/generative-ai";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function client() {
  if (!KEY) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(KEY);
}

export async function geminiText(prompt: string, system?: string, maxTokens = 2048) {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 },
  });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function geminiJson<T = unknown>(prompt: string, system?: string, maxTokens = 1024): Promise<T> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });
  const res = await model.generateContent(prompt);
  const text = res.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const start = cleaned.search(/[\[{]/);
  const candidate = start >= 0 ? cleaned.slice(start) : cleaned;
  return JSON.parse(candidate) as T;
}

export const isGeminiConfigured = () => !!KEY;
