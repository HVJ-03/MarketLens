/**
 * Opportunity Service — identifies observable market signals from analysis data.
 * Each signal is evidence-backed and clearly labeled by confidence level.
 * Does NOT predict business success — identifies patterns and gaps.
 */

import Product from '../models/Product.js';

/**
 * Identify opportunity signals for a given scan based on analysis results.
 */
export async function identifyOpportunities(scanId, analysisResults) {
  const products = await Product.find({ scanId }).lean();
  const opportunities = [];

  if (products.length < 3) {
    return opportunities; // Not enough data for meaningful signals
  }

  // 1. Price gap opportunities
  const priceGaps = findPriceGaps(analysisResults);
  opportunities.push(...priceGaps);

  // 2. Feature-based opportunities
  const featureOps = findFeatureOpportunities(products, analysisResults);
  opportunities.push(...featureOps);

  // 3. Rating-based opportunities
  const ratingOps = findRatingOpportunities(products);
  opportunities.push(...ratingOps);

  // 4. Merchant concentration opportunities
  const merchantOps = findMerchantOpportunities(analysisResults);
  opportunities.push(...merchantOps);

  return opportunities;
}

/**
 * Detect underrepresented price ranges in the distribution.
 */
function findPriceGaps(analysis) {
  const opportunities = [];
  const dist = analysis.priceDistribution || [];

  if (dist.length < 3) return opportunities;

  const avgCount = dist.reduce((sum, b) => sum + b.count, 0) / dist.length;

  for (const bucket of dist) {
    if (bucket.count < avgCount * 0.4 && bucket.count > 0) {
      opportunities.push({
        title: `Underrepresented price range: ${bucket.range}`,
        description: `Only ${bucket.count} product(s) found in the ${bucket.range} price range, compared to an average of ${Math.round(avgCount)} per range. This segment may have less competition.`,
        evidence: `${bucket.count} products in this range vs. ${Math.round(avgCount)} average across all ranges. Total products analyzed: ${analysis.totalProducts}.`,
        confidence: bucket.count <= 1 ? 'low' : 'medium',
        supportingProducts: [],
      });
    }
  }

  // Detect gaps between buckets (missing ranges with 0 products)
  for (let i = 0; i < dist.length - 1; i++) {
    if (dist[i].count > 0 && dist[i + 1].count === 0 && i + 2 < dist.length && dist[i + 2].count > 0) {
      opportunities.push({
        title: `Price gap detected near ${dist[i + 1].range}`,
        description: `No products found in the ${dist[i + 1].range} range, between populated segments. This could indicate an unserved price tier.`,
        evidence: `Adjacent ranges have ${dist[i].count} and ${dist[i + 2].count} products respectively.`,
        confidence: 'medium',
        supportingProducts: [],
      });
    }
  }

  return opportunities;
}

/**
 * Identify features that appear infrequently — potential differentiation vectors.
 */
function findFeatureOpportunities(products, analysis) {
  const opportunities = [];
  const features = analysis.featureFrequency || [];
  const totalProducts = analysis.totalProducts || 0;

  if (features.length < 5) return opportunities;

  // Find features that appear in 10–30% of products (present but not saturated)
  const emergingFeatures = features.filter(
    (f) => f.percentage >= 10 && f.percentage <= 30 && f.count >= 2
  );

  if (emergingFeatures.length > 0) {
    const topEmerging = emergingFeatures.slice(0, 3);
    opportunities.push({
      title: 'Emerging product features',
      description: `Features like "${topEmerging.map((f) => f.feature).join('", "')}" appear in a minority of products (${topEmerging[0].percentage}% or less). Products with these attributes may stand out.`,
      evidence: `Out of ${totalProducts} products analyzed: ${topEmerging.map((f) => `"${f.feature}" in ${f.count} products (${f.percentage}%)`).join(', ')}.`,
      confidence: totalProducts >= 15 ? 'medium' : 'low',
      supportingProducts: [],
    });
  }

  // Find popular features (>60%) that are table stakes
  const dominantFeatures = features.filter((f) => f.percentage > 60);
  if (dominantFeatures.length > 0) {
    opportunities.push({
      title: 'Must-have product attributes',
      description: `Features like "${dominantFeatures.slice(0, 3).map((f) => f.feature).join('", "')}" are present in over 60% of competing products. Consider these as baseline expectations.`,
      evidence: `${dominantFeatures.slice(0, 3).map((f) => `"${f.feature}" in ${f.percentage}% of products`).join('; ')}.`,
      confidence: 'high',
      supportingProducts: [],
    });
  }

  return opportunities;
}

/**
 * Identify opportunities based on rating patterns.
 */
function findRatingOpportunities(products) {
  const opportunities = [];
  const rated = products.filter((p) => p.rating != null && p.rating > 0 && p.price != null);

  if (rated.length < 5) return opportunities;

  // High-rated products in less competitive price segments
  const highRated = rated.filter((p) => p.rating >= 4.0);
  const lowRated = rated.filter((p) => p.rating < 3.5);

  if (highRated.length > 0 && lowRated.length > highRated.length) {
    opportunities.push({
      title: 'Quality gap in the market',
      description: `${lowRated.length} out of ${rated.length} rated products score below 3.5 stars. Entering with a higher-quality product could differentiate from the majority.`,
      evidence: `${highRated.length} products rated ≥4.0 vs. ${lowRated.length} products rated <3.5 out of ${rated.length} total rated products.`,
      confidence: rated.length >= 15 ? 'medium' : 'low',
      supportingProducts: highRated.slice(0, 3).map((p) => p.title),
    });
  }

  // Check if many products have few reviews (new/low-traction market)
  const fewReviews = rated.filter((p) => p.reviewCount != null && p.reviewCount < 50);
  if (fewReviews.length > rated.length * 0.6) {
    opportunities.push({
      title: 'Low review density',
      description: `${fewReviews.length} of ${rated.length} products have fewer than 50 reviews. This may indicate a newer or less mature market segment where establishing reputation early could be advantageous.`,
      evidence: `${Math.round((fewReviews.length / rated.length) * 100)}% of rated products have <50 reviews.`,
      confidence: 'medium',
      supportingProducts: [],
    });
  }

  return opportunities;
}

/**
 * Identify opportunities from merchant concentration patterns.
 */
function findMerchantOpportunities(analysis) {
  const opportunities = [];
  const merchants = analysis.topMerchants || [];
  const totalProducts = analysis.totalProducts || 0;

  if (merchants.length < 2) return opportunities;

  // High concentration: top merchant has >40% of products
  const topMerchant = merchants[0];
  const topShare = (topMerchant.count / totalProducts) * 100;

  if (topShare > 40) {
    opportunities.push({
      title: 'Market dominated by a few merchants',
      description: `"${topMerchant.name}" accounts for ${Math.round(topShare)}% of observed products. A highly concentrated market may have barriers to entry but also room for alternative sellers.`,
      evidence: `Top merchant: "${topMerchant.name}" with ${topMerchant.count}/${totalProducts} products (${Math.round(topShare)}%). Total unique merchants: ${merchants.length}.`,
      confidence: 'medium',
      supportingProducts: [],
    });
  }

  // Fragmented market: many merchants with few products each
  if (merchants.length > 10 && topShare < 15) {
    opportunities.push({
      title: 'Fragmented merchant landscape',
      description: `${merchants.length} merchants compete with no single seller dominating (largest has ${Math.round(topShare)}% share). This suggests an accessible market without dominant gatekeepers.`,
      evidence: `${merchants.length} unique merchants. Top seller "${topMerchant.name}" has ${topMerchant.count}/${totalProducts} products.`,
      confidence: totalProducts >= 20 ? 'high' : 'medium',
      supportingProducts: [],
    });
  }

  return opportunities;
}
