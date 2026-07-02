import { generateContent } from "../ai/gemini.server";

export interface CustomerVoiceResult {
  sentiment: Array<{ name: string; value: number; color: string }>;
  buyingMotivations: Array<{ reason: string; pct: number }>;
  painPoints: Array<{ topic: string; mentions: number; severity: "Low" | "Medium" | "High" }>;
  customerRequests: string[];
  reviews: Array<{ name: string; text: string; tag: string }>;
}

/**
 * Runs customer voice analysis based on business description & categories.
 * Generates synthetic insights tailored to the business if no explicit reviews are provided,
 * converting them into structured objects.
 */
export async function analyzeCustomerVoice(
  businessName: string,
  description: string,
  categories: string[]
): Promise<CustomerVoiceResult> {
  const prompt = `
You are Nexora AI's Customer Voice Engine.
Your task is to synthesize and structure realistic customer feedback, reviews, and sentiment insights for an e-commerce business.

Store Name: ${businessName}
Description: ${description}
Categories: ${categories.join(", ")}

Generate a complete customer voice analysis matching this business profile. Provide:
1. Sentiment Overview (percentages for Positive, Neutral, Negative summing to 100)
2. Top 4 buying motivations (e.g. Quality, Eco-friendly, Customer Service, Fit) and their percentage of customers
3. Top 4 pain points (topic, estimated number of mentions, and severity: 'Low', 'Medium', or 'High')
4. 3 specific customer feature/product requests
5. 3 realistic customer reviews with author name, detailed text, and a tag.

Your output MUST be a JSON object with this exact structure:
{
  "sentiment": [
    { "name": "Positive", "value": 75, "color": "var(--color-success)" },
    { "name": "Neutral", "value": 15, "color": "var(--color-muted-foreground)" },
    { "name": "Negative", "value": 10, "color": "var(--color-destructive)" }
  ],
  "buyingMotivations": [
    { "reason": "Reason 1", "pct": 45 },
    { "reason": "Reason 2", "pct": 25 }
  ],
  "painPoints": [
    { "topic": "Pain point topic", "mentions": 142, "severity": "High" }
  ],
  "customerRequests": [
    "Request 1",
    "Request 2",
    "Request 3"
  ],
  "reviews": [
    { "name": "John D.", "text": "Review text...", "tag": "Category" }
  ]
}

Ensure all values sum correctly, colors match tailwind/css variables (var(--color-success) etc.), and the feedback is highly specific to the store's industry.
Do not wrap in markdown code blocks. Output ONLY valid JSON.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are a customer experience analyst. You output structured customer voice metrics in JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanJson) as CustomerVoiceResult;
  } catch (error) {
    console.error("Failed to analyze customer voice with Gemini:", error);
    return getFallbackCustomerVoice();
  }
}

function getFallbackCustomerVoice(): CustomerVoiceResult {
  return {
    sentiment: [
      { name: "Positive", value: 78, color: "var(--color-success)" },
      { name: "Neutral", value: 14, color: "var(--color-muted-foreground)" },
      { name: "Negative", value: 8, color: "var(--color-destructive)" },
    ],
    buyingMotivations: [
      { reason: "Product Quality", pct: 40 },
      { reason: "Brand Sustainability", pct: 28 },
      { reason: "Design & Style", pct: 20 },
      { reason: "Fast Shipping", pct: 12 },
    ],
    painPoints: [
      { topic: "Delivery Delays", mentions: 84, severity: "Medium" },
      { topic: "Sizing Inconsistency", mentions: 67, severity: "High" },
      { topic: "Checkout UI Glitches", mentions: 32, severity: "Low" },
      { topic: "Packaging Waste", mentions: 28, severity: "Medium" },
    ],
    customerRequests: [
      "Add virtual sizing assistant to reduce size exchanges.",
      "Provide carbon-neutral shipping options at checkout.",
      "Release an expanded pastel color collection for summer.",
    ],
    reviews: [
      { name: "Jamie L.", text: "Love the comfort but sizing runs small — had to exchange twice.", tag: "Sizing" },
      { name: "Ravi P.", text: "Shipping took 11 days. Quality was great when it finally arrived.", tag: "Shipping" },
      { name: "Sofia M.", text: "Exactly what I wanted — sustainable AND stylish. Will buy again.", tag: "Positive" },
    ],
  };
}
