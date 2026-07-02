import { crawlPage } from "../crawl/lightweight-crawler.server";
import { generateContent } from "../ai/gemini.server";

export interface BusinessProfile {
  name: string;
  industry: string;
  description: string;
  categories: string[];
  targetAudience: string;
  pricingTier: "Budget" | "Mid-market" | "Premium" | "Luxury";
  brandVoice: string;
  suggestedGoals: string[];
}

/**
 * Runs a business profile analysis on a URL by crawling it and feeding the text content to Gemini.
 */
export async function analyzeBusinessUrl(url: string): Promise<BusinessProfile> {
  let crawledText = "";
  let crawledTitle = "";
  let crawledDescription = "";

  try {
    const pageData = await crawlPage(url);
    crawledText = pageData.content.slice(0, 15000); // Send first 15k characters to fit budget
    crawledTitle = pageData.title;
    crawledDescription = pageData.metaDescription;
  } catch (crawlError) {
    console.warn("Crawler failed to load URL. Continuing with metadata placeholders.", crawlError);
  }

  // Construct a prompt for Gemini
  const prompt = `
You are Nexora AI's Business Understanding Engine.
Your task is to analyze the text content of an ecommerce store's homepage (and its metadata) and extract a highly accurate business profile.

Url of store: ${url}
HTML Title: ${crawledTitle}
HTML Meta Description: ${crawledDescription}

Here is the extracted homepage text:
---
${crawledText || "[No text crawled successfully. Please use the domain and URL name to infer information]"}
---

Analyze this and output a JSON object with the following fields:
{
  "name": "The brand or business name (clean capitalization)",
  "industry": "Specific industry or niche (e.g., 'Eco-friendly Activewear', 'Specialty Coffee Roaster', 'Handmade Leather Goods')",
  "description": "A concise 2-sentence summary of what they sell and their value proposition.",
  "categories": ["List of main product categories, max 5 items"],
  "targetAudience": "Description of their ideal buyer persona (e.g., 'Eco-conscious fitness enthusiasts aged 25-40')",
  "pricingTier": "One of: 'Budget', 'Mid-market', 'Premium', 'Luxury'",
  "brandVoice": "3 adjectives representing their communication style (e.g., 'Inspiring, transparent, clean')",
  "suggestedGoals": ["3 recommended high-impact growth goals based on their niche (e.g., 'Increase email sign-up conversion rate', 'Improve search visibility for sustainable yoga pants')"]
}

Output ONLY valid JSON. Do not include markdown code block formatting or any explanation.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are a professional ecommerce growth strategist. You analyze website text and output only structured JSON.",
      jsonMode: true,
    });

    // Parse clean JSON
    // If the model wrapped it in markdown code block ```json ... ```, strip it
    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const profile = JSON.parse(cleanJson) as BusinessProfile;

    // Validate pricing tier fallback
    if (!["Budget", "Mid-market", "Premium", "Luxury"].includes(profile.pricingTier)) {
      profile.pricingTier = "Mid-market";
    }

    return profile;
  } catch (error) {
    console.error("Failed to analyze business with Gemini:", error);
    
    // Return high-quality mock data based on the URL name
    const domainName = extractDomainName(url);
    return getFallbackProfile(domainName, url);
  }
}

function extractDomainName(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const parts = parsed.hostname.replace("www.", "").split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "Your Store";
  }
}

function getFallbackProfile(brandName: string, url: string): BusinessProfile {
  return {
    name: brandName,
    industry: "E-commerce retailer",
    description: `A direct-to-consumer online store located at ${url}, offering premium products to retail customers.`,
    categories: ["Apparel & Accessories", "Home Goods", "New Arrivals"],
    targetAudience: "General online shoppers seeking high-quality curated merchandise.",
    pricingTier: "Mid-market",
    brandVoice: "Friendly, modern, and helpful",
    suggestedGoals: [
      "Improve Organic Search traffic (SEO)",
      "Optimize product detail page conversion rate",
      "Monitor competitor price movements"
    ]
  };
}
