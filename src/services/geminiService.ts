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

**Glossary & Definitions**: 
1. **Existing Terms**: The system automatically links recognized terms like Fiqh or Aqidah. Simply use them in your text.
2. **New/Complex Terms**: If you use a term that is potentially unfamiliar to the user (e.g., specific legal maxims or advanced terminology), you MUST provide a brief definition for it at the very end of your response using the specific format: \`<term>Word|Definition|Category</term>\`. 
   - Category can be: Fiqh, Aqidah, Hadith, or General.
   - Example: \`<term>Istihsan|Legal preference; a method used in Islamic jurisprudence to choose a ruling that is most suitable to the public interest.|Fiqh</term>\`

**Formatting Guidelines**:
- Use clear headings (###) to separate different sections of your answer.
- Use bullet points or numbered lists for clarity when presenting multiple points or madhahib.
- Use **tables** to compare different schools of thought (Madhahib) or to present structured data (e.g., conditions of prayer, pillars of Islam).
- Use **bold text** for key terms, scholar names, and book titles.
- Keep paragraphs concise and well-spaced.

**Mandatory Follow-up Questions**:
At the very end of every single response, you MUST provide exactly 3 relevant follow-up questions that the user might want to ask next based on your current answer. These questions must be wrapped in a single <related> tag, with each question on a new line.
Example:
<related>
What are the sunnah acts of prayer?
How does the Hanafi school differ on this point?
Can you provide the specific verse reference in the Quran?
</related>
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

export async function generateChatTitle(messages: Message[]) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { 
          role: "user", 
          parts: [{ 
            text: `Based on the following conversation, generate a very concise (maximum 5 words) and descriptive title for this chat session. 
            Do not use quotes or punctuation in the title.
            
            Conversation:
            ${messages.map(m => `${m.role}: ${m.text}`).join('\n')}` 
          }] 
        }
      ],
      config: {
        temperature: 0.5,
      },
    });

    return response.text?.trim() || "Untitled Conversation";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Conversation";
  }
}

export async function generateTermRelevance(term: string, definition: string, messages: Message[]) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { 
          role: "user", 
          parts: [{ 
            text: `Given the following Islamic glossary term and its definition, explain its relevance or implication within the context of the provided conversation. 
            Keep it brief, insightful, and respect the Shariah-compliant tone of DeenSeek.
            
            Term: ${term}
            Definition: ${definition}
            
            Conversation:
            ${messages.map(m => `${m.role}: ${m.text}`).join('\n')}` 
          }] 
        }
      ],
      config: {
        temperature: 0.5,
      },
    });

    return response.text?.trim() || "No contextual relevance found.";
  } catch (error) {
    console.error("Error generating term relevance:", error);
    return "Unable to determine contextual relevance at this time.";
  }
}
