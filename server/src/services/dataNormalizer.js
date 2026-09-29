/**
 * Data Normalizer — transforms raw SerpApi responses into standardized Product shapes.
 * Handles missing fields gracefully with null-safe defaults.
 */

// Currency symbols to code mapping
const CURRENCY_MAP = {
  '₹': 'INR',
  '$': 'USD',
  '£': 'GBP',
  '€': 'EUR',
  'CA$': 'CAD',
  'A$': 'AUD',
  '¥': 'JPY',
};

const COUNTRY_CURRENCY = {
  in: 'INR',
  us: 'USD',
  gb: 'GBP',
  de: 'EUR',
  fr: 'EUR',
  ca: 'CAD',
  au: 'AUD',
  jp: 'JPY',
};

/**
 * Normalize a single Google Shopping result into our Product schema.
 */
export function normalizeShoppingResult(rawItem, country = 'in') {
  const price = extractPrice(rawItem);
  const currency = COUNTRY_CURRENCY[country] || 'USD';

  return {
    title: rawItem.title || '',
    price,
    currency,
    rating: parseFloat(rawItem.rating) || null,
    reviewCount: parseInt(rawItem.reviews, 10) || null,
    merchant: rawItem.source || rawItem.merchant?.name || '',
    source: 'google_shopping',
    productUrl: rawItem.link || rawItem.product_link || '',
    imageUrl: rawItem.thumbnail || rawItem.image || '',
    description: rawItem.snippet || rawItem.description || '',
    features: extractFeatures(rawItem),
    rawData: rawItem,
  };
}

/**
 * Normalize an array of shopping results.
 * Filters out items that cannot be meaningfully used (no title).
 */
export function normalizeShoppingResults(rawItems, country = 'in') {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => normalizeShoppingResult(item, country))
    .filter((item) => item.title && item.title.trim() !== '');
}

/**
 * Extract numeric price from various SerpApi price formats.
 * Handles: "$19.99", "₹1,299", "1299", { raw: "₹1,299" }, etc.
 */
function extractPrice(item) {
  // Try extracted_price first (numeric)
  if (item.extracted_price != null && !isNaN(item.extracted_price)) {
    return parseFloat(item.extracted_price);
  }

  // Try price string
  const priceStr = item.price || item.old_price || '';
  if (!priceStr) return null;

  // Remove currency symbols and commas, extract number
  const cleaned = String(priceStr)
    .replace(/[₹$£€¥,\s]/g, '')
    .replace(/[A-Za-z]/g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extract product features from various fields.
 */
function extractFeatures(item) {
  const features = [];

  // From extensions array (common in Google Shopping)
  if (Array.isArray(item.extensions)) {
    features.push(...item.extensions);
  }

  // From snippet - split on common delimiters
  if (item.snippet) {
    const snippetFeatures = item.snippet
      .split(/[·•|,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s.length < 80);
    features.push(...snippetFeatures);
  }

  return [...new Set(features)].slice(0, 15); // deduplicate, limit
}
