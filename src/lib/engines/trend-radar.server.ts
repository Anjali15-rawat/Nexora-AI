import { generateContent } from "../ai/gemini.server";

export interface TrendRadarResult {
  series: Array<{ week: string; [key: string]: number | string }>;
  rising: Array<{ topic: string; signal: string; growth: number }>;
  declining: Array<{ topic: string; signal: string; growth: number }>;
}

/**
 * Generates emerging search trends and 12-week trajectories tailored to the business category/industry.
 */
export async function analyzeTrends(
  businessName: string,
  industry: string,
  categories: string[]
): Promise<TrendRadarResult> {
  const prompt = `
You are Nexora AI's Trend Radar Engine.
Your task is to analyze emerging search trends, topic volumes, and signal strengths for an e-commerce store's industry.

Store Name: ${businessName}
Industry: ${industry}
Categories: ${categories.join(", ")}

Generate:
1. 3 emerging topic keys (e.g. 'veganSneakers', 'recycledPolyester', 'smartRunning') that are relevant to this store's categories.
2. A 12-week trajectory series array. Each item has a 'week' field (e.g., 'Wk 1', 'Wk 2'...) and numerical interest index (0-100) for the 3 topic keys.
3. A list of 4 'rising' trends (topic title, signal source description, and positive growth percentage).
4. A list of 3 'declining' trends (topic title, signal source description, and negative growth percentage).

Your output MUST be a JSON object with this exact structure:
{
  "series": [
    { "week": "Wk 1", "key1": 34, "key2": 45, "key3": 12 },
    { "week": "Wk 2", "key1": 38, "key2": 47, "key3": 15 }
    // ... up to 12 weeks
  ],
  "rising": [
    { "topic": "Topic Name", "signal": "Signal Source Description", "growth": 45 }
  ],
  "declining": [
    { "topic": "Topic Name", "signal": "Signal Source Description", "growth": -12 }
  ],
  "keys": {
    "key1": "Human Readable Label for Key 1",
    "key2": "Human Readable Label for Key 2",
    "key3": "Human Readable Label for Key 3"
  }
}

Ensure all data is highly realistic and tailored to the industry.
Do not wrap in markdown code blocks. Output ONLY valid JSON.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are a market intelligence analyst. You output structured trend analysis metrics in JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanJson) as TrendRadarResult;
  } catch (error) {
    console.error("Failed to generate trends with Gemini:", error);
    return getFallbackTrends();
  }
}

function getFallbackTrends(): TrendRadarResult {
  return {
    series: [
      { week: "Wk 1", barefoot: 40, recycled: 25, chunky: 80 },
      { week: "Wk 2", barefoot: 42, recycled: 27, chunky: 78 },
      { week: "Wk 3", barefoot: 45, recycled: 30, chunky: 75 },
      { week: "Wk 4", barefoot: 48, recycled: 35, chunky: 73 },
      { week: "Wk 5", barefoot: 55, recycled: 42, chunky: 70 },
      { week: "Wk 6", barefoot: 62, recycled: 48, chunky: 65 },
      { week: "Wk 7", barefoot: 70, recycled: 55, chunky: 60 },
      { week: "Wk 8", barefoot: 75, recycled: 62, chunky: 58 },
      { week: "Wk 9", barefoot: 78, recycled: 70, chunky: 55 },
      { week: "Wk 10", barefoot: 82, recycled: 75, chunky: 50 },
      { week: "Wk 11", barefoot: 85, recycled: 80, chunky: 48 },
      { week: "Wk 12", barefoot: 90, recycled: 88, chunky: 45 },
    ],
    rising: [
      { topic: "Barefoot trainers", signal: "Google Search volume spikes", growth: 125 },
      { topic: "Recycled materials", signal: "Tiktok Mentions", growth: 84 },
      { topic: "Minimalist running shoes", signal: "Subreddit growth r/barefootrunning", growth: 42 },
      { topic: "Zero-drop footwear", signal: "Pinterest boards shares", growth: 38 },
    ],
    declining: [
      { topic: "Chunky sneakers", signal: "Fashion blogs citation drop", growth: -35 },
      { topic: "Platform shoes", signal: "Sales volume indicators", growth: -20 },
      { topic: "Neoprene insoles", signal: "Social media engagement reduction", growth: -12 },
    ],
  };
}
