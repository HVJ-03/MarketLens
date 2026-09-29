/**
 * AI Service — abstracts the LLM provider for market report generation.
 * Default implementation: Google Gemini.
 * The rest of the application never communicates with the AI directly.
 *
 * IMPORTANT: The AI receives pre-computed structured data, NOT raw web results.
 * This reduces hallucination and ensures evidence-backed analysis.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_API_KEY = process.env.AI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash';

let genAI = null;

function getClient() {
  if (!genAI) {
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY environment variable is not configured');
    }
    genAI = new GoogleGenerativeAI(AI_API_KEY);
  }
  return genAI;
}

/**
 * Generate a structured market intelligence report from analysis data.
 * @param {Object} params
 * @param {string} params.query - The original search query
 * @param {string} params.country - Market/country code
 * @param {Object} params.analysisResults - Pre-computed market analysis
 * @param {Array} params.sampleProducts - Representative product samples
 * @param {Array} params.opportunities - Pre-identified opportunity signals
 * @param {Array} params.relatedSearches - Related search terms
 * @returns {Object} Structured report sections
 */
export async function generateMarketReport({
  query,
  country,
  analysisResults,
  sampleProducts = [],
  opportunities = [],
  relatedSearches = [],
}) {
  const prompt = buildReportPrompt({
    query,
    country,
    analysisResults,
    sampleProducts,
    opportunities,
    relatedSearches,
  });

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const reportData = JSON.parse(text);
    return normalizeReportOutput(reportData);
  } catch (error) {
    console.error('AI report generation failed:', error.message);

    // Fallback: return analysis-only report without AI narrative
    return buildFallbackReport({ query, country, analysisResults, opportunities });
  }
}

/**
 * Build the prompt for the LLM.
 * Instructs the model to distinguish between observed facts, derived metrics,
 * interpretations, and hypotheses.
 */
function buildReportPrompt({ query, country, analysisResults, sampleProducts, opportunities, relatedSearches }) {
  const countryNames = {
    in: 'India', us: 'United States', gb: 'United Kingdom',
    de: 'Germany', fr: 'France', ca: 'Canada', au: 'Australia', jp: 'Japan',
  };
  const countryName = countryNames[country] || country;

  return `You are a market intelligence analyst. Generate a structured market report based on the following OBSERVED DATA.

CRITICAL RULES:
1. Only reference data provided below. Do NOT invent statistics or products.
2. Clearly distinguish between:
   - OBSERVED FACTS (directly from data)
   - DERIVED METRICS (calculated from data)
   - INTERPRETATIONS (your analysis of patterns)
   - HYPOTHESES (potential opportunities that need validation)
3. Use professional, analytical language.
4. Be specific with numbers — cite the actual data.
5. Acknowledge limitations of the analysis.

MARKET SCAN DETAILS:
- Product/Category: ${query}
- Market: ${countryName}
- Total Products Analyzed: ${analysisResults.totalProducts || 0}
- Unique Merchants: ${analysisResults.uniqueMerchants || 0}

PRICE STATISTICS:
${analysisResults.priceStats ? `
- Minimum: ${analysisResults.priceStats.min}
- Maximum: ${analysisResults.priceStats.max}
- Average: ${analysisResults.priceStats.average}
- Median: ${analysisResults.priceStats.median}
- Std Dev: ${analysisResults.priceStats.stdDev}
` : 'No price data available.'}

PRICE DISTRIBUTION:
${analysisResults.priceDistribution?.map((b) => `${b.range}: ${b.count} products`).join('\n') || 'Not available.'}

TOP MERCHANTS:
${analysisResults.topMerchants?.slice(0, 8).map((m) => `${m.name}: ${m.count} products`).join('\n') || 'Not available.'}

RATING STATS:
${analysisResults.ratingStats ? `Average rating: ${analysisResults.ratingStats.average}, Total rated: ${analysisResults.ratingStats.totalRated}` : 'Not available.'}

COMPETITION LEVEL:
${analysisResults.competitionLevel ? `${analysisResults.competitionLevel.label} (score: ${analysisResults.competitionLevel.score}/100) — ${analysisResults.competitionLevel.description}` : 'Not assessed.'}

COMMON FEATURES:
${analysisResults.featureFrequency?.slice(0, 10).map((f) => `"${f.feature}" — ${f.percentage}% of products`).join('\n') || 'Not available.'}

SAMPLE PRODUCTS (for context only):
${sampleProducts.slice(0, 8).map((p) => `- ${p.title} | ${p.price} | ${p.merchant} | Rating: ${p.rating || 'N/A'}`).join('\n') || 'None available.'}

PRE-IDENTIFIED OPPORTUNITY SIGNALS:
${opportunities.map((o) => `- ${o.title}: ${o.description} (confidence: ${o.confidence})`).join('\n') || 'None identified.'}

RELATED SEARCH TERMS:
${relatedSearches.slice(0, 10).join(', ') || 'None available.'}

Return a JSON object with these exact keys:
{
  "executiveSummary": "2-3 paragraph overview of key findings",
  "marketOverview": "Detailed market landscape description",
  "competitionAnalysis": "Analysis of competitive dynamics",
  "pricingAnalysis": "Price positioning analysis",
  "trendAnalysis": "Observable trends and related search patterns",
  "opportunitySignals": [{"title": "...", "description": "...", "evidence": "...", "confidence": "high|medium|low"}],
  "risks": [{"title": "...", "description": "..."}],
  "keyObservations": ["observation 1", "observation 2"],
  "limitations": ["limitation 1", "limitation 2"]
}`;
}

/**
 * Normalize and validate the AI response.
 */
function normalizeReportOutput(data) {
  return {
    executiveSummary: data.executiveSummary || '',
    marketOverview: data.marketOverview || '',
    competitionAnalysis: data.competitionAnalysis || '',
    pricingAnalysis: data.pricingAnalysis || '',
    trendAnalysis: data.trendAnalysis || '',
    opportunitySignals: Array.isArray(data.opportunitySignals)
      ? data.opportunitySignals.map((o) => ({
          title: o.title || '',
          description: o.description || '',
          evidence: o.evidence || '',
          confidence: ['high', 'medium', 'low'].includes(o.confidence) ? o.confidence : 'medium',
        }))
      : [],
    risks: Array.isArray(data.risks)
      ? data.risks.map((r) =>
          typeof r === 'string' ? { title: r, description: r } : { title: r.title || '', description: r.description || '' }
        )
      : [],
    keyObservations: Array.isArray(data.keyObservations) ? data.keyObservations : [],
    limitations: Array.isArray(data.limitations) ? data.limitations : [],
  };
}

/**
 * Build a fallback report when AI fails. Uses pre-computed analysis data only.
 */
function buildFallbackReport({ query, country, analysisResults, opportunities }) {
  const stats = analysisResults.priceStats;
  const total = analysisResults.totalProducts || 0;
  const merchants = analysisResults.uniqueMerchants || 0;

  return {
    executiveSummary: `Market analysis for "${query}" identified ${total} products across ${merchants} merchants. ${stats ? `Prices range from ${stats.min} to ${stats.max} with a median of ${stats.median}.` : ''} This report is based on observed data without AI-enhanced narrative (AI service was unavailable).`,
    marketOverview: `${total} products were found from ${merchants} unique merchants in the analyzed market.`,
    competitionAnalysis: analysisResults.competitionLevel?.description || 'Competition data not available.',
    pricingAnalysis: stats
      ? `Prices range from ${stats.min} to ${stats.max}. Average price: ${stats.average}. Median price: ${stats.median}.`
      : 'Price data not available.',
    trendAnalysis: 'AI-powered trend analysis was not available for this report.',
    opportunitySignals: opportunities || [],
    risks: [
      { title: 'Limited data scope', description: 'Analysis is based on a single search snapshot and may not represent the full market.' },
    ],
    keyObservations: [
      `${total} products analyzed from ${merchants} merchants`,
      stats ? `Median price: ${stats.median}` : null,
      analysisResults.competitionLevel ? `Competition level: ${analysisResults.competitionLevel.label}` : null,
    ].filter(Boolean),
    limitations: [
      'This report is based on a single point-in-time search and does not represent long-term trends.',
      `Only ${total} products were analyzed — the actual market may contain more products.`,
      'AI narrative generation was unavailable; this is a data-only report.',
    ],
  };
}
