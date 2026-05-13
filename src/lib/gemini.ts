import { GoogleGenerativeAI } from "@google/generative-ai";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function client() {
  if (!KEY) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(KEY);
}

export async function geminiText(prompt: string, system?: string, maxTokens = 4096) {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 },
    } as never,
  });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function geminiJson<T = unknown>(prompt: string, system?: string, maxTokens = 4096): Promise<T> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.4,
      responseMimeType: "application/json",
      // Gemini 2.5 Flash spends thinking tokens against the output budget.
      // For structured JSON output we don't need thinking.
      thinkingConfig: { thinkingBudget: 0 },
    } as never,
  });
  const res = await model.generateContent(prompt);
  const text = res.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const start = cleaned.search(/[\[{]/);
  const candidate = start >= 0 ? cleaned.slice(start) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch (err) {
    console.error("[gemini] JSON parse failed. Raw response:", text.slice(0, 800));
    throw err;
  }
}

export const isGeminiConfigured = () => !!KEY;
