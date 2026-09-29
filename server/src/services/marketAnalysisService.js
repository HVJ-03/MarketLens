/**
 * Market Analysis Service — computes measurable market signals from collected product data.
 * All metrics are derived from observed data, never fabricated.
 */

import Product from '../models/Product.js';

/**
 * Run full market analysis on products from a given scan.
 * Returns a structured analysis result to be saved on MarketScan.scanResults.
 */
export async function analyzeScan(scanId) {
  const products = await Product.find({ scanId }).lean();

  if (products.length === 0) {
    return {
      totalProducts: 0,
      uniqueMerchants: 0,
      priceStats: null,
      priceDistribution: [],
      ratingStats: null,
      topMerchants: [],
      featureFrequency: [],
      competitionLevel: {
        score: 0,
        label: 'Unknown',
        description: 'No products found to analyze.',
      },
    };
  }

  const priceStats = calculatePriceStats(products);
  const ratingStats = calculateRatingStats(products);
  const merchants = calculateMerchantStats(products);
  const priceDistribution = calculatePriceDistribution(products, priceStats);
  const featureFrequency = calculateFeatureFrequency(products);
  const competitionLevel = assessCompetition(products, merchants);

  return {
    totalProducts: products.length,
    uniqueMerchants: merchants.length,
    priceStats,
    priceDistribution,
    ratingStats,
    topMerchants: merchants.slice(0, 10),
    featureFrequency: featureFrequency.slice(0, 20),
    competitionLevel,
  };
}

/**
 * Calculate price statistics: min, max, average, median, standard deviation.
 */
function calculatePriceStats(products) {
  const prices = products
    .map((p) => p.price)
    .filter((p) => p != null && p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const sum = prices.reduce((acc, p) => acc + p, 0);
  const avg = sum / prices.length;
  const median =
    prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

  const variance =
    prices.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: Math.round(prices[0] * 100) / 100,
    max: Math.round(prices[prices.length - 1] * 100) / 100,
    average: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}

/**
 * Calculate rating statistics.
 */
function calculateRatingStats(products) {
  const ratings = products
    .map((p) => p.rating)
    .filter((r) => r != null && r > 0);

  if (ratings.length === 0) return null;

  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = sum / ratings.length;

  // Distribution: count products in each star range
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of ratings) {
    const bucket = Math.min(5, Math.max(1, Math.ceil(rating)));
    distribution[bucket]++;
  }

  return {
    average: Math.round(avg * 100) / 100,
    totalRated: ratings.length,
    distribution,
  };
}

/**
 * Calculate merchant stats: unique merchants ranked by product count.
 */
function calculateMerchantStats(products) {
  const counts = {};
  for (const p of products) {
    const merchant = (p.merchant || 'Unknown').trim();
    if (merchant) {
      counts[merchant] = (counts[merchant] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Dynamically generate price distribution buckets based on actual data range.
 * Creates 5–8 evenly-spaced buckets.
 */
function calculatePriceDistribution(products, priceStats) {
  if (!priceStats || priceStats.min === priceStats.max) return [];

  const prices = products
    .map((p) => p.price)
    .filter((p) => p != null && p > 0);

  const range = priceStats.max - priceStats.min;

  // Determine nice bucket size
  const rawBucketSize = range / 6;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawBucketSize)));
  const bucketSize = Math.ceil(rawBucketSize / magnitude) * magnitude;

  const bucketStart = Math.floor(priceStats.min / bucketSize) * bucketSize;
  const buckets = [];
  let current = bucketStart;

  while (current < priceStats.max) {
    const min = current;
    const max = current + bucketSize;
    const count = prices.filter((p) => p >= min && p < max).length;

    buckets.push({
      range: `${formatBucketPrice(min)}–${formatBucketPrice(max)}`,
      min,
      max,
      count,
    });

    current += bucketSize;
  }

  // Include any products at exactly the max price in the last bucket
  if (buckets.length > 0) {
    const lastBucket = buckets[buckets.length - 1];
    lastBucket.count += prices.filter((p) => p === priceStats.max && p === lastBucket.max).length;
  }

  return buckets.filter((b) => b.count > 0);
}

/**
 * Format a price for bucket labels.
 */
function formatBucketPrice(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  }
  return Math.round(value).toString();
}

/**
 * Count feature frequencies across all products.
 */
function calculateFeatureFrequency(products) {
  const counts = {};
  const total = products.length;

  for (const p of products) {
    if (!Array.isArray(p.features)) continue;
    for (const feature of p.features) {
      const normalized = feature.trim().toLowerCase();
      if (normalized.length > 2) {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([feature, count]) => ({
      feature,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Assess competition level based on measurable factors.
 * Score 0-100 based on product density, merchant diversity, and price concentration.
 */
function assessCompetition(products, merchants) {
  const totalProducts = products.length;
  const merchantCount = merchants.length;

  // Factor 1: Product density (more products = more competition)
  const densityScore = Math.min(totalProducts / 50, 1) * 40;

  // Factor 2: Merchant diversity (more merchants = more competition)
  const diversityScore = Math.min(merchantCount / 15, 1) * 30;

  // Factor 3: Price concentration (HHI-inspired)
  // Lower concentration = more competition
  const prices = products.map((p) => p.price).filter((p) => p != null && p > 0);
  let concentrationScore = 15; // default mid
  if (prices.length > 3) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, p) => a + Math.pow(p - avg, 2), 0) / prices.length;
    const cv = Math.sqrt(variance) / avg; // coefficient of variation
    // High CV = diverse prices = potentially less direct competition
    concentrationScore = cv < 0.3 ? 30 : cv < 0.6 ? 20 : 10;
  }

  const totalScore = Math.round(densityScore + diversityScore + concentrationScore);

  let label, description;
  if (totalScore >= 70) {
    label = 'High';
    description = `The analyzed market shows high competition: ${totalProducts} products across ${merchantCount} merchants with significant overlap.`;
  } else if (totalScore >= 40) {
    label = 'Moderate';
    description = `The analyzed market shows moderate competition: ${totalProducts} products from ${merchantCount} merchants.`;
  } else {
    label = 'Low';
    description = `The analyzed market shows relatively low competition: only ${totalProducts} products from ${merchantCount} merchants were found.`;
  }

  return { score: totalScore, label, description };
}
