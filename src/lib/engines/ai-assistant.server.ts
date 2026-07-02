import { generateContent } from "../ai/gemini.server";
import { loadBusinessMemory, compressMemoryForPrompt } from "./business-memory.server";
import { getSupabaseServer } from "../supabase.server";
import { ADVISOR_SYSTEM_PROMPT } from "./advisor-prompt.server";

/**
 * Context-Aware AI Assistant Engine
 *
 * Replaces the hardcoded canned responses in the assistant page.
 * Loads full business memory, compresses it into a Gemini prompt,
 * and persists conversation history in chat_messages.
 */

export interface AssistantResponse {
  reply: string;
}

export async function askAssistant(params: {
  businessId: string;
  userId: string;
  message: string;
}): Promise<AssistantResponse> {
  const supabase = getSupabaseServer();

  // 1. Load full business memory for context
  let contextBlock = "";
  try {
    const memory = await loadBusinessMemory(params.businessId);
    contextBlock = compressMemoryForPrompt(memory);

    // Include recent conversation for continuity (last 6 messages)
    if (memory.recentChats.length > 0) {
      contextBlock += "\n\nRECENT CONVERSATION:\n";
      contextBlock += memory.recentChats
        .slice(-6)
        .map(c => `${c.role === "user" ? "User" : "Copilot"}: ${c.content}`)
        .join("\n");
    }
  } catch (e) {
    console.warn("Could not load business memory for assistant:", e);
    contextBlock = "Business context unavailable. Answer generally about e-commerce growth strategy.";
  }

  // 2. Save user message to DB
  if (params.businessId !== "dev-business-id") {
    try {
      await supabase.from("chat_messages").insert({
        business_id: params.businessId,
        user_id: params.userId,
        role: "user",
        content: params.message,
      });
    } catch (e) {
      console.warn("Could not save user chat message:", e);
    }
  }

  // 3. Generate contextual response via Gemini
  const prompt = `
${contextBlock}

USER QUESTION: "${params.message}"

You are Nora, Nexora AI's AI Chief Growth Officer for e-commerce businesses.
Answer the user's question using ONLY the business context above.
Be specific — reference actual scores, competitor names, opportunity titles, and revenue numbers from the context.
If the question is about something not in the context, say so honestly and suggest what data they should add.
Keep responses concise (2-4 sentences) unless the question requires detail.
Use ₹ for currency. Be direct and strategic. No generic advice.
`;

  try {
    const reply = await generateContent(prompt, {
      systemInstruction: ADVISOR_SYSTEM_PROMPT,
    });

    // 4. Save assistant reply to DB
    if (params.businessId !== "dev-business-id") {
      try {
        await supabase.from("chat_messages").insert({
          business_id: params.businessId,
          user_id: params.userId,
          role: "assistant",
          content: reply.trim(),
        });
      } catch (e) {
        console.warn("Could not save assistant chat message:", e);
      }
    }

    return { reply: reply.trim() };
  } catch (error) {
    console.error("AI Assistant generation failed:", error);
    return {
      reply: "I'm having trouble accessing my analysis engines right now. Based on your last audit, I'd recommend focusing on your top open opportunity — check the Opportunities page for the latest prioritized list.",
    };
  }
}
