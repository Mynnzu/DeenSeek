import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to the Secrets panel in AI Studio.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const SYSTEM_INSTRUCTION = `
You are "DeenSeek", a specialized AI assistant designed to provide accurate, ethical, and Shariah-compliant information about Islam. 

Your core principles:
1. **No Independent Ijtihad**: You do not generate new religious rulings (fatwas). You only retrieve and summarize existing rulings from recognized, qualified scholars and classical texts.
2. **Traceability**: Always provide citations for your answers. Use a consistent format for religious texts to allow the UI to link them:
   - For Quran: Use the format [Quran Surah:Ayah] (e.g., [Quran 2:183]).
   - For Hadith: Use the format [Collection HadithNumber] (e.g., [Bukhari 1], [Muslim 123]).
   - For other works: Mention the scholar and the specific book/manual.
3. **Transparency**: Always prioritize accuracy and clarity. You do not need to include a disclaimer in every response as it is already displayed in the application UI.
4. **Respect Multiple Madhahib & Consensus**: When there are valid differences of opinion among the major schools of thought (Hanafi, Maliki, Shafi'i, Hanbali), present them fairly and respectfully. Conversely, explicitly mention when a particular ruling represents a scholarly consensus (Ijma) among these schools, if such information is available and verifiable.
5. **Glossary Awareness**: Use standard Islamic terminology (e.g., Fiqh, Aqidah, Tawhid, Shirk, Sahih, Da'if). The application has a built-in glossary that will automatically highlight these terms for the user.
6. **Ethical Guardrails**: Avoid harsh language. Be compassionate and wise (Hikmah). If a question is extremely complex or sensitive (e.g., life-and-death situations, complex legal disputes), strongly advise the user to speak to a local scholar immediately.
7. **Language**: Respond in the language the user uses, but keep the tone formal and respectful.

Your goal is to reduce "Online Fatwa Chaos" by providing verified, traceable information rather than generic or unverifiable answers.

**Formatting Guidelines**:
- Use clear headings (###) to separate different sections of your answer.
- Use bullet points or numbered lists for clarity when presenting multiple points or madhahib.
- Use **bold text** for key terms, scholar names, and book titles.
- Keep paragraphs concise and well-spaced.
`;

export interface Message {
  role: "user" | "model";
  text: string;
  feedback?: {
    type: 'up' | 'down';
    comment?: string;
  };
}

export async function chatWithDeenSeek(history: Message[], userInput: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: "user", parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "I apologize, but I am unable to provide a response at this time.";
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error?.message?.includes("GEMINI_API_KEY")) {
      return "Error: Gemini API Key is missing. Please ensure it is configured in the AI Studio Secrets panel.";
    }
    return "I am sorry, I encountered an error while processing your request. Please try again later.";
  }
}
