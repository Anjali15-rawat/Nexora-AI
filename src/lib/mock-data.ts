export const growthScore = {
  total: 78,
  breakdown: [
    { label: "SEO", value: 82 },
    { label: "AEO", value: 71 },
    { label: "GEO", value: 65 },
    { label: "CRO", value: 88 },
    { label: "Sentiment", value: 84 },
  ],
};

export const healthMetrics = [
  { label: "SEO Score", value: 82, delta: 4.2, hint: "Organic visibility" },
  { label: "AEO Score", value: 71, delta: 6.8, hint: "Answer engine readiness" },
  { label: "GEO Score", value: 65, delta: -1.4, hint: "Generative engine presence" },
  { label: "Competitor Score", value: 74, delta: 2.1, hint: "Vs. tracked rivals" },
  { label: "Customer Score", value: 84, delta: 3.5, hint: "Sentiment + NPS proxy" },
  { label: "Revenue Impact", value: 91, delta: 8.9, hint: "Predicted lift" },
];

export const revenueImpact = {
  gain: 184500,
  loss: 42300,
  trend: Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    gain: 40000 + Math.round(Math.sin(i / 2) * 18000 + i * 8000),
    loss: 12000 + Math.round(Math.cos(i / 3) * 6000 + i * 1200),
  })),
};

export const priorityActions = [
  { id: 1, title: "Fix product schema on top 12 PDPs", difficulty: "Easy", impact: "High", revenue: 24000 },
  { id: 2, title: "Publish comparison vs Allbirds", difficulty: "Medium", impact: "High", revenue: 38000 },
  { id: 3, title: "Add FAQ section answering AI overview queries", difficulty: "Easy", impact: "Medium", revenue: 12500 },
  { id: 4, title: "Launch retargeting on cart abandoners (7-day)", difficulty: "Medium", impact: "High", revenue: 31000 },
  { id: 5, title: "Refresh outdated blog clusters (8 posts)", difficulty: "Hard", impact: "Medium", revenue: 18900 },
];

export const competitors = [
  { id: 1, name: "Allbirds", category: "Sustainable Footwear", traffic: 12, content: 88, threat: "High", trend: [40,42,45,50,55,62,68,72] },
  { id: 2, name: "Rothy's", category: "DTC Footwear", traffic: 6, content: 76, threat: "Medium", trend: [50,52,49,55,57,58,60,63] },
  { id: 3, name: "Veja", category: "Eco Sneakers", traffic: -3, content: 71, threat: "Medium", trend: [60,58,57,55,54,52,53,55] },
  { id: 4, name: "On Running", category: "Performance", traffic: 18, content: 92, threat: "High", trend: [30,38,45,53,60,68,75,84] },
  { id: 5, name: "Cariuma", category: "Lifestyle", traffic: 4, content: 68, threat: "Low", trend: [45,47,48,50,51,52,53,55] },
];

export const competitorChanges = [
  { name: "On Running", change: "Launched Cloudsurfer 7", type: "New Product", at: "2d ago" },
  { name: "Allbirds", change: "Published 4 sustainability articles", type: "New Content", at: "4d ago" },
  { name: "Rothy's", change: "Dropped pricing by 12% on flats", type: "Pricing", at: "1w ago" },
  { name: "Veja", change: "New collab with Mansur Gavriel", type: "New Product", at: "1w ago" },
];

export const sentiment = [
  { name: "Positive", value: 64, color: "var(--color-success)" },
  { name: "Neutral", value: 22, color: "var(--color-muted-foreground)" },
  { name: "Negative", value: 14, color: "var(--color-destructive)" },
];

export const painPoints = [
  { topic: "Shipping delays", mentions: 142, severity: "High" },
  { topic: "Sizing inconsistency", mentions: 98, severity: "High" },
  { topic: "Return policy unclear", mentions: 67, severity: "Medium" },
  { topic: "Limited color options", mentions: 41, severity: "Low" },
];

export const customerRequests = [
  "Wide-fit sizes for the Runner Pro",
  "Apple Pay at checkout on mobile",
  "Loyalty program with early access",
  "Restock alerts for sold-out colors",
];

export const buyingMotivations = [
  { reason: "Sustainability", pct: 38 },
  { reason: "Comfort", pct: 31 },
  { reason: "Style", pct: 18 },
  { reason: "Price", pct: 13 },
];

export const opportunities = [
  { id: 1, name: "Rank for 'best vegan sneakers 2026'", type: "SEO", impact: "High", difficulty: "Medium", revenue: 42000 },
  { id: 2, name: "Capture AI overview for 'eco-friendly shoes'", type: "Content", impact: "High", difficulty: "Easy", revenue: 28500 },
  { id: 3, name: "Bundle: Runner + Socks (3-pack)", type: "Product", impact: "Medium", difficulty: "Easy", revenue: 19000 },
  { id: 4, name: "Trend: barefoot-style trainers (rising 240%)", type: "Trend", impact: "High", difficulty: "Hard", revenue: 86000 },
  { id: 5, name: "Schema markup on collection pages", type: "SEO", impact: "Medium", difficulty: "Easy", revenue: 14500 },
  { id: 6, name: "Influencer review program — micro tier", type: "Content", impact: "Medium", difficulty: "Medium", revenue: 31000 },
];

export const trends = {
  rising: [
    { topic: "Barefoot trainers", growth: 240, signal: "TikTok" },
    { topic: "Recycled ocean plastic", growth: 168, signal: "Search" },
    { topic: "Zero-drop running", growth: 122, signal: "Reddit" },
    { topic: "Carbon-neutral checkout", growth: 95, signal: "News" },
  ],
  declining: [
    { topic: "Chunky dad sneakers", growth: -34, signal: "Search" },
    { topic: "Neon colorways", growth: -21, signal: "TikTok" },
    { topic: "Premium leather sneakers", growth: -12, signal: "Search" },
  ],
  series: Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    barefoot: 20 + i * 18 + Math.round(Math.random() * 8),
    recycled: 30 + i * 12 + Math.round(Math.random() * 6),
    chunky: 80 - i * 4 - Math.round(Math.random() * 4),
  })),
};

export const reports = [
  { id: 1, title: "Weekly Growth Report — Week 24", period: "Weekly", date: "Jun 10, 2026", summary: "Organic up 8.4%. Competitor On Running launched Cloudsurfer 7. 3 new opportunities surfaced." },
  { id: 2, title: "Daily Brief — June 15", period: "Daily", date: "Jun 15, 2026", summary: "Traffic flat. Sentiment +2pts. Action: respond to 14 new reviews mentioning sizing." },
  { id: 3, title: "Monthly Executive Summary — May", period: "Monthly", date: "Jun 1, 2026", summary: "Revenue +12%. SEO share of voice up 4pts. 2 high-impact opportunities executed." },
];

export const chatPrompts = [
  "Why is my traffic dropping?",
  "What should I focus on today?",
  "What opportunities am I missing?",
  "Which competitor is growing fastest?",
];

export const seoTrendSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  you: 40 + i * 4 + Math.round(Math.sin(i) * 4),
  competitor: 50 + i * 2 + Math.round(Math.cos(i) * 4),
}));
