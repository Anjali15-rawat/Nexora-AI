export interface RevenueImpactResult {
  potentialRevenue: number; // Monthly projected revenue in INR (or USD base)
  implementationTime: number; // in minutes
  confidence: number; // 0-100 percentage
  priority: "Low" | "Medium" | "High";
}

/**
 * Calculates revenue impact, implementation times, and confidence based on opportunity properties.
 * 
 * Heuristics / Assumptions:
 * 1. Base Revenue Lift: We assume a typical mid-market store baseline revenue of $10,000 / month.
 * 2. Category Multipliers:
 *    - SEO: High traffic multiplier (1.5x)
 *    - AEO: Critical conversational search visibility (1.3x)
 *    - GEO: Generative overview citation visibility (1.4x)
 *    - CRO: Direct conversion rate optimization (1.8x)
 *    - Content: Mid-range content positioning (1.1x)
 *    - Others: 1.0x
 * 3. Difficulty / Implementation Time:
 *    - Easy: 15 to 45 mins, Confidence: 90%
 *    - Medium: 60 to 120 mins, Confidence: 80%
 *    - Hard: 180 to 480 mins, Confidence: 65%
 * 4. Visibility Impact:
 *    - High: 2.0x
 *    - Medium: 1.0x
 *    - Low: 0.5x
 */
export function getRevenueImpact(
  title: string,
  category: string,
  difficulty: "Easy" | "Medium" | "Hard" | string,
  impact: "Low" | "Medium" | "High" | string
): RevenueImpactResult {
  const normCategory = category.toUpperCase();
  const normDifficulty = (difficulty || "Medium").toUpperCase();
  const normImpact = (impact || "Medium").toUpperCase();

  // Baseline potential revenue (approx $500 to $1000 base)
  let baseRevenue = 15000; // in INR (₹15,000/month baseline)

  // Title checks for specific quick wins
  const titleLower = title.toLowerCase();
  if (titleLower.includes("faq") || titleLower.includes("schema")) {
    baseRevenue = 12000; // specific pricing
  } else if (titleLower.includes("competitor") || titleLower.includes("comparison")) {
    baseRevenue = 35000; // higher ROI
  } else if (titleLower.includes("bundle") || titleLower.includes("checkout")) {
    baseRevenue = 45000; // very high ROI
  }

  // Multiplier based on Category
  let categoryMultiplier = 1.0;
  switch (normCategory) {
    case "CRO":
      categoryMultiplier = 1.8;
      break;
    case "SEO":
      categoryMultiplier = 1.5;
      break;
    case "GEO":
      categoryMultiplier = 1.4;
      break;
    case "AEO":
      categoryMultiplier = 1.3;
      break;
    case "CONTENT":
      categoryMultiplier = 1.1;
      break;
    case "TREND":
      categoryMultiplier = 1.6;
      break;
    default:
      categoryMultiplier = 1.0;
  }

  // Multiplier based on Impact
  let impactMultiplier = 1.0;
  switch (normImpact) {
    case "HIGH":
      impactMultiplier = 2.0;
      break;
    case "MEDIUM":
      impactMultiplier = 1.0;
      break;
    case "LOW":
      impactMultiplier = 0.5;
      break;
  }

  const potentialRevenue = Math.round(baseRevenue * categoryMultiplier * impactMultiplier);

  // Difficulty determines implementation time and confidence
  let implementationTime = 60;
  let confidence = 80;
  switch (normDifficulty) {
    case "EASY":
      implementationTime = titleLower.includes("faq") || titleLower.includes("schema") ? 15 : 30;
      confidence = 90;
      break;
    case "MEDIUM":
      implementationTime = 90;
      confidence = 80;
      break;
    case "HARD":
      implementationTime = 240;
      confidence = 65;
      break;
  }

  // Adjust confidence slightly based on title specificity
  if (titleLower.includes("missing") || titleLower.includes("fix")) {
    confidence = Math.min(confidence + 5, 98);
  }

  // Calculate priority
  let priority: "Low" | "Medium" | "High" = "Medium";
  if (potentialRevenue > 30000 || (normImpact === "HIGH" && normDifficulty === "EASY")) {
    priority = "High";
  } else if (potentialRevenue < 10000 || normImpact === "LOW") {
    priority = "Low";
  }

  return {
    potentialRevenue,
    implementationTime,
    confidence,
    priority,
  };
}
