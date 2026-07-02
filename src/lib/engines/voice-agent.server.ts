import { generateContent } from "../ai/gemini.server";
import { ADVISOR_SYSTEM_PROMPT } from "./advisor-prompt.server";

export interface VoiceResponseResult {
  textResponse: string;
  audioPlaceholderUrl?: string;
}

/**
 * Handles incoming conversational requests from the voice assistant client.
 * Prepares the prompt context using current business data and returns an AI speech transcript.
 */
export async function processVoiceQuery(params: {
  query: string;
  businessName: string;
  growthScore: number;
  explanation: string;
  opportunities: any[];
  competitors: any[];
}): Promise<VoiceResponseResult> {
  const queryLower = params.query.toLowerCase().trim();

  // Route queries to prepare specific contexts
  let queryContext = "";
  if (queryLower.includes("focus") || queryLower.includes("today")) {
    queryContext = `The user is asking: "What should I focus on today?". Rely on the top opportunities: ${JSON.stringify(params.opportunities.slice(0, 2))}.`;
  } else if (queryLower.includes("why") || queryLower.includes("low") || queryLower.includes("score")) {
    queryContext = `The user is asking: "Why is my score low?". The score explanation is: "${params.explanation}". Highlight the biggest gaps.`;
  } else if (queryLower.includes("opportunity") || queryLower.includes("missing")) {
    queryContext = `The user is asking: "What opportunities am I missing?". Present the top 3 items: ${JSON.stringify(params.opportunities.slice(0, 3))}.`;
  } else if (queryLower.includes("competitor") || queryLower.includes("biggest")) {
    queryContext = `The user is asking: "Who is my biggest competitor?". Competitors list: ${JSON.stringify(params.competitors)}. Focus on high threat competitors.`;
  } else if (queryLower.includes("do next") || queryLower.includes("next step")) {
    queryContext = `The user is asking: "What should I do next?". Provide a clear step-by-step instruction from the highest priority recommended action: ${JSON.stringify(params.opportunities[0])}.`;
  } else {
    queryContext = `General query: "${params.query}". Answer conversationally using the business state: Score=${params.growthScore}, Competitors=${params.competitors.length}, Opps=${params.opportunities.length}.`;
  }

  const prompt = `
You are Nora, Nexora AI's Voice Agent Assistant.
Provide a direct, spoken response to the user's query.
Keep the answer under 3 sentences so that it reads naturally when spoken aloud. Keep the language simple, friendly, and authoritative.

Business Context:
- Brand Name: "${params.businessName}"
- Current Growth Score: ${params.growthScore}/100

Query Context:
${queryContext}

Provide a conversational response. Do not use markdown bullet points or bold text in the text output, as this is intended for text-to-speech rendering.
`;

  try {
    const responseText = await generateContent(prompt, {
      systemInstruction: ADVISOR_SYSTEM_PROMPT + "\n\nCRITICAL FOR VOICE: Keep responses under 3 sentences. DO NOT use markdown, bullet points, or bold text. Speak directly and naturally.",
    });

    return {
      textResponse: responseText.trim(),
    };
  } catch (error) {
    console.error("Voice query processing failed, returning fallback:", error);
    return {
      textResponse: "I'm having trouble connecting to my growth database right now, but you should focus on adding structured JSON-LD schema to your product pages as a priority today.",
    };
  }
}
