/**
 * Intelligence Service — Tier S/A roadmap features.
 * Computes, from observed Product data only:
 *   1. Opportunity Map data points + whitespace zones (price × rating × density)
 *   2. Market Radar Scorecard (5 axes, 0–100, all derived from measured data)
 *   3. Feature Gap Matrix (table stakes vs. differentiator gaps with adoption %)
 *
 * Core principle: OBSERVED FACT ➔ DERIVED METRIC ➔ INTERPRETATION.
 * Every computed value carries its supporting evidence (sample size, product ids).
 */

import Product from '../models/Product.js';

/**
 * Compute the full intelligence bundle for a scan.
 */
export async function computeIntelligence(scanId) {
  const products = await Product.find({ scanId }).lean();

  if (products.length === 0) {
    return {
      opportunityMap: { points: [], whitespaceZones: [], stats: null },
      radarScorecard: null,
      featureGap: { tableStakes: [], differentiatorGaps: [], totalProducts: 0 },
    };
  }

  const priced = products.filter((p) => p.price != null && p.price > 0);
  const rated = priced.filter((p) => p.rating != null && p.rating > 0);

  return {
    opportunityMap: buildOpportunityMap(products, priced, rated),
    radarScorecard: buildRadarScorecard(products, priced, rated),
    featureGap: buildFeatureGapMatrix(products),
  };
}

/* ------------------------------------------------------------------ */
/* 1. Opportunity Map (Tier S)                                         */
/* ------------------------------------------------------------------ */

function buildOpportunityMap(products, priced, rated) {
  if (rated.length === 0) {
    // Fall back to price vs. review-volume map when no ratings exist
    return buildFallbackMap(priced);
  }

  const points = rated.map((p) => ({
    id: String(p._id),
    title: p.title,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount || 0,
    merchant: p.merchant || 'Unknown',
    productUrl: p.productUrl || '',
    imageUrl: p.imageUrl || '',
    currency: p.currency || 'USD',
    // Bubble size driver: normalized review volume (log scale to tame outliers)
    weight: Math.log10((p.reviewCount || 0) + 10),
  }));

  const zones = detectWhitespaceZones(points);

  return {
    points,
    whitespaceZones: zones,
    stats: {
      totalProducts: products.length,
      pricedProducts: priced.length,
      ratedProducts: rated.length,
      medianPrice: median(points.map((pt) => pt.price)),
      medianRating: median(points.map((pt) => pt.rating)),
    },
  };
}

/**
 * No-rating fallback: Y axis becomes review density.
 */
function buildFallbackMap(priced) {
  const points = priced.map((p) => ({
    id: String(p._id),
    title: p.title,
    price: p.price,
    rating: null,
    reviewCount: p.reviewCount || 0,
    merchant: p.merchant || 'Unknown',
    productUrl: p.productUrl || '',
    imageUrl: p.imageUrl || '',
    currency: p.currency || 'USD',
    weight: Math.log10((p.reviewCount || 0) + 10),
  }));

  return {
    points,
    whitespaceZones: detectWhitespaceZones(points),
    stats: {
      totalProducts: priced.length,
      pricedProducts: priced.length,
      ratedProducts: 0,
      medianPrice: median(points.map((pt) => pt.price)),
      medianRating: null,
    },
  };
}

/**
 * Detect whitespace zones: divide the price×rating plane into a grid
 * and flag cells with demand signal (high rating) but low competitor density.
 * Grid: 4 price bands × 2 rating bands (above/below median rating).
 */
function detectWhitespaceZones(points) {
  if (points.length < 8) return [];

  const prices = points.map((pt) => pt.price).sort((a, b) => a - b);
  const ratings = points.map((pt) => pt.rating ?? 0).sort((a, b) => a - b);
  const medianPrice = median(prices);
  const medianRating = median(ratings);

  const bands = buildPriceBands(prices, 4);
  const cellCounts = bands.map(() => ({ high: 0, low: 0 }));

  for (const pt of points) {
    const bandIdx = bands.findIndex((b) => pt.price >= b.min && pt.price <= b.max);
    const idx = bandIdx === -1 ? bands.length - 1 : bandIdx;
    const isHighRating = (pt.rating ?? 0) >= medianRating;
    cellCounts[idx][isHighRating ? 'high' : 'low']++;
  }

  const avgPerCell = points.length / (bands.length * 2);
  const zones = [];

  bands.forEach((band, i) => {
    const { high, low } = cellCounts[i];
    // High rating (demand exists) + below-average density (uncrowded)
    if (high > 0 && high < avgPerCell * 0.6) {
      const sample = points.find(
        (pt) => pt.price >= band.min && pt.price <= band.max && (pt.rating ?? 0) >= medianRating
      );
      zones.push({
        bandLabel: band.label,
        priceMin: band.min,
        priceMax: band.max,
        ratingThreshold: Math.round(medianRating * 10) / 10,
        competitorCount: high,
        avgDensity: Math.round(avgPerCell * 10) / 10,
        ratingBand: 'high',
        rationale: `Only ${high} competitor(s) at or above the ${Math.round(medianRating * 10) / 10}★ median in the ${band.label} price band (average cell density: ${Math.round(avgPerCell)}).`,
        sampleProductId: sample?.id || null,
      });
    }
    // Also flag "quality desert": crowded price band where almost nothing rates well
    if (low >= avgPerCell && high === 0) {
      zones.push({
        bandLabel: band.label,
        priceMin: band.min,
        priceMax: band.max,
        ratingThreshold: Math.round(medianRating * 10) / 10,
        competitorCount: high,
        avgDensity: Math.round(avgPerCell * 10) / 10,
        ratingBand: 'quality-desert',
        rationale: `${low} products priced in ${band.label}, none reaching the ${Math.round(medianRating * 10) / 10}★ median rating — an unserved quality segment.`,
        sampleProductId: null,
      });
    }
  });

  // Evidence: attach supporting products per zone
  for (const zone of zones) {
    zone.supportingProducts = points
      .filter(
        (pt) =>
          pt.price >= zone.priceMin &&
          pt.price <= zone.priceMax &&
          (zone.ratingBand === 'quality-desert'
            ? (pt.rating ?? 0) < zone.ratingThreshold
            : (pt.rating ?? 0) >= zone.ratingThreshold)
      )
      .slice(0, 5)
      .map((pt) => ({ id: pt.id, title: pt.title, price: pt.price, rating: pt.rating, merchant: pt.merchant }));
  }

  return zones.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* 2. Market Radar Scorecard (Tier A)                                  */
/* ------------------------------------------------------------------ */

/**
 * Five axes, each 0–100. For "health" interpretation higher = more favorable
 * for entry, except Competition Density where higher = more crowded
 * (the chart label clarifies direction).
 */
function buildRadarScorecard(products, priced, rated) {
  const total = products.length;
  if (total === 0) return null;

  const merchants = new Set(products.map((p) => (p.merchant || '').trim()).filter(Boolean));

  // Axis 1 — Competition Density (0–100, higher = more crowded)
  const densityScore = Math.round(
    Math.min(total / 50, 1) * 60 + Math.min(merchants.size / 15, 1) * 40
  );

  // Axis 2 — Price Stability (higher = tighter, more predictable pricing)
  let priceStability = 50;
  if (priced.length >= 3) {
    const prices = priced.map((p) => p.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const cv = Math.sqrt(prices.reduce((a, p) => a + (p - avg) ** 2, 0) / prices.length) / avg;
    // CV 0 → very stable (100), CV ≥ 0.8 → volatile (0)
    priceStability = Math.round(Math.max(0, Math.min(1, 1 - cv / 0.8)) * 100);
  }

  // Axis 3 — Rating Traction (higher = satisfied customers + review volume)
  let ratingTraction = 50;
  if (rated.length > 0) {
    const avgRating = rated.reduce((a, p) => a + p.rating, 0) / rated.length;
    const avgReviews = rated.reduce((a, p) => a + Math.log10((p.reviewCount || 0) + 10), 0) / rated.length;
    const ratingPart = (avgRating / 5) * 70; // up to 70
    const reviewPart = Math.min(avgReviews / 3, 1) * 30; // log10(1000)=3 → full
    ratingTraction = Math.round(ratingPart + reviewPart);
  }

  // Axis 4 — Feature Gap Potential (higher = more unserved differentiators)
  const freq = countFeatureFrequency(products);
  const gaps = freq.filter((f) => f.percentage >= 10 && f.percentage <= 30);
  const tableStakes = freq.filter((f) => f.percentage > 60);
  // Many emerging-but-rare attributes + few saturated ones → high potential
  const gapScore = Math.min(gaps.length / 6, 1) * 70 + Math.min(tableStakes.length / 4, 1) * 30;
  const featureGapPotential = freq.length >= 5 ? Math.round(gapScore) : 40;

  // Axis 5 — Evidence Confidence (sample size & data completeness)
  const fieldsComplete = products.filter(
    (p) => p.price != null && p.rating != null && p.merchant
  ).length;
  const sizePart = Math.min(total / 30, 1) * 60;
  const completenessPart = (fieldsComplete / total) * 40;
  const evidenceConfidence = Math.round(sizePart + completenessPart);

  return {
    axes: [
      { axis: 'Competition Density', value: densityScore, higherMeans: 'more crowded' },
      { axis: 'Price Stability', value: priceStability, higherMeans: 'more stable pricing' },
      { axis: 'Rating Traction', value: ratingTraction, higherMeans: 'stronger demand' },
      { axis: 'Feature Gap Potential', value: featureGapPotential, higherMeans: 'more whitespace' },
      { axis: 'Evidence Confidence', value: evidenceConfidence, higherMeans: 'stronger evidence' },
    ],
    summary: {
      totalProducts: total,
      uniqueMerchants: merchants.size,
      fieldsComplete,
    },
  };
}

/* ------------------------------------------------------------------ */
/* 3. Feature Gap Detector (Tier A)                                    */
/* ------------------------------------------------------------------ */

function buildFeatureGapMatrix(products) {
  const total = products.length;
  const freq = countFeatureFrequency(products);

  const tableStakes = freq
    .filter((f) => f.percentage > 60)
    .map((f) => ({ ...f, category: 'table_stakes', interpretation: `Baseline expectation — ${f.percentage}% of competing products include it. Shipping without it is a disadvantage.` }));

  const differentiatorGaps = freq
    .filter((f) => f.percentage >= 10 && f.percentage <= 30 && f.count >= 2)
    .map((f) => ({ ...f, category: 'differentiator_gap', interpretation: `Emerging attribute — only ${f.percentage}% adoption. Adopting it can differentiate your product.` }));

  return {
    tableStakes,
    differentiatorGaps,
    totalProducts: total,
    uniqueFeatureCount: freq.length,
  };
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function countFeatureFrequency(products) {
  const counts = {};
  let withFeatures = 0;

  for (const p of products) {
    if (!Array.isArray(p.features) || p.features.length === 0) continue;
    withFeatures++;
    for (const feature of new Set(p.features.map((f) => String(f).trim().toLowerCase()))) {
      if (feature.length > 2) counts[feature] = (counts[feature] || 0) + 1;
    }
  }

  // Adoption measured against products that have feature data at all
  const denom = withFeatures || products.length;
  return Object.entries(counts)
    .map(([feature, count]) => ({
      feature,
      count,
      percentage: Math.round((count / denom) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildPriceBands(sortedPrices, bandCount) {
  const min = sortedPrices[0];
  const max = sortedPrices[sortedPrices.length - 1];
  if (min === max) return [{ label: formatPriceBand(min, max), min, max }];

  const step = (max - min) / bandCount;
  const bands = [];
  for (let i = 0; i < bandCount; i++) {
    const bandMin = min + step * i;
    const bandMax = i === bandCount - 1 ? max : min + step * (i + 1);
    bands.push({ label: formatPriceBand(bandMin, bandMax), min: bandMin, max: bandMax });
  }
  return bands;
}

function formatPriceBand(min, max) {
  const fmt = (v) => (v >= 1000 ? `${Math.round(v / 100) / 10}K` : Math.round(v).toString());
  return `${fmt(min)}–${fmt(max)}`;
}

function median(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}
