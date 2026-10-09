import { getJson } from 'serpapi';

/**
 * SerpApi Service — communicates with SerpApi for Google Shopping data.
 * When SERPAPI_KEY is provided in server/.env, queries live Google Shopping.
 * If SERPAPI_KEY is not yet configured, automatically uses an intelligent commerce
 * simulation engine so user scans and market intelligence reports always work smoothly.
 */

// Country code → SerpApi location/language mapping
const COUNTRY_CONFIG = {
  in: { gl: 'in', hl: 'en', location: 'India', currency: '₹', baseMin: 499, baseMax: 8999 },
  us: { gl: 'us', hl: 'en', location: 'United States', currency: '$', baseMin: 19, baseMax: 249 },
  gb: { gl: 'uk', hl: 'en', location: 'United Kingdom', currency: '£', baseMin: 15, baseMax: 199 },
  de: { gl: 'de', hl: 'de', location: 'Germany', currency: '€', baseMin: 18, baseMax: 220 },
  fr: { gl: 'fr', hl: 'fr', location: 'France', currency: '€', baseMin: 18, baseMax: 220 },
  ca: { gl: 'ca', hl: 'en', location: 'Canada', currency: 'CA$', baseMin: 25, baseMax: 299 },
  au: { gl: 'au', hl: 'en', location: 'Australia', currency: 'A$', baseMin: 29, baseMax: 349 },
  jp: { gl: 'jp', hl: 'ja', location: 'Japan', currency: '¥', baseMin: 2500, baseMax: 32000 },
};

const MERCHANTS_BY_COUNTRY = {
  in: ['Amazon.in', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata CLiQ', 'Myntra', 'Meesho', 'Nykaa'],
  us: ['Amazon.com', 'Walmart', 'Best Buy', 'Target', 'eBay', 'Home Depot', 'B&H Photo Video', 'Newegg'],
  gb: ['Amazon.co.uk', 'Currys', 'Argos', 'John Lewis', 'ASOS', 'Very', 'eBay UK'],
  de: ['Amazon.de', 'Otto', 'MediaMarkt', 'Saturn', 'Zalando', 'Conrad'],
  fr: ['Amazon.fr', 'Cdiscount', 'Fnac', 'Darty', 'La Redoute', 'Boulanger'],
  ca: ['Amazon.ca', 'Walmart Canada', 'Best Buy Canada', 'Canadian Tire', 'Costco Canada'],
  au: ['Amazon.com.au', 'JB Hi-Fi', 'Harvey Norman', 'Kogan', 'Catch.com.au'],
  jp: ['Amazon.co.jp', 'Rakuten', 'Yahoo! Shopping Japan', 'Yodobashi Camera', 'Bic Camera'],
};

/**
 * Search Google Shopping via SerpApi, with intelligent commerce simulation fallback
 * if SERPAPI_KEY is not set.
 */
export async function searchGoogleShopping({ query, country = 'in', minPrice, maxPrice }) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_serpapi_key_here') {
    console.warn(`[MarketLens] SERPAPI_KEY is not set in server/.env. Using realistic commerce simulation for query: "${query}" (${country.toUpperCase()}).`);
    console.warn('             To use live Google Shopping results, add your free key to server/.env: SERPAPI_KEY=...');
    return generateSimulatedShoppingData({ query, country, minPrice, maxPrice });
  }

  const countryConfig = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.in;

  const params = {
    engine: 'google_shopping',
    api_key: apiKey,
    q: query,
    gl: countryConfig.gl,
    hl: countryConfig.hl,
    num: 40,
  };

  if (minPrice != null || maxPrice != null) {
    if (minPrice != null && maxPrice != null) {
      params.tbs = `mr:1,price:1,ppr_min:${minPrice},ppr_max:${maxPrice}`;
    } else if (minPrice != null) {
      params.tbs = `mr:1,price:1,ppr_min:${minPrice}`;
    } else if (maxPrice != null) {
      params.tbs = `mr:1,price:1,ppr_max:${maxPrice}`;
    }
  }

  try {
    const result = await serpApiGetJson(params);
    return {
      shoppingResults: result.shopping_results || [],
      searchMetadata: {
        ...(result.search_metadata || {}),
        isLive: true,
        source: 'SerpApi Live Google Shopping',
      },
      searchInformation: result.search_information || {},
      filters: result.filters || [],
      relatedSearches: extractRelatedSearches(result),
    };
  } catch (error) {
    console.error('SerpApi live request error:', error.message);
    console.warn('Falling back to simulated commerce response so user scan completes.');
    return generateSimulatedShoppingData({ query, country, minPrice, maxPrice });
  }
}

/**
 * Search Google for related queries and trend signals.
 */
export async function searchRelatedQueries({ query, country = 'in' }) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_serpapi_key_here') {
    return {
      relatedSearches: [
        `${query} best price`,
        `${query} review 2026`,
        `top rated ${query}`,
        `${query} vs alternatives`,
        `affordable ${query} online`,
      ],
      relatedQuestions: [
        `What is the best ${query} to buy in 2026?`,
        `Is ${query} worth the price?`,
        `What factors to look for when choosing ${query}?`,
      ],
      searchMetadata: { status: 'Simulated' },
    };
  }

  const countryConfig = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.in;

  const params = {
    engine: 'google',
    api_key: apiKey,
    q: `${query} market trends`,
    gl: countryConfig.gl,
    hl: countryConfig.hl,
    num: 10,
  };

  try {
    const result = await serpApiGetJson(params);
    return {
      relatedSearches: result.related_searches?.map((r) => r.query) || [],
      relatedQuestions: result.related_questions?.map((q) => q.question) || [],
      searchMetadata: result.search_metadata || {},
    };
  } catch (error) {
    console.warn('SerpApi related queries error:', error.message);
    return {
      relatedSearches: [],
      relatedQuestions: [],
      searchMetadata: {},
    };
  }
}

/**
 * Generate high-fidelity simulated shopping data based on query & region
 * when SERPAPI_KEY is not configured.
 */
function generateSimulatedShoppingData({ query, country = 'in', minPrice, maxPrice }) {
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.in;
  const merchants = MERCHANTS_BY_COUNTRY[country] || MERCHANTS_BY_COUNTRY.in;
  const currencySymbol = config.currency;

  const effectiveMin = minPrice != null ? Number(minPrice) : config.baseMin;
  const effectiveMax = maxPrice != null ? Number(maxPrice) : config.baseMax;

  const brands = ['AeroTech', 'StudioCraft', 'Zenith Gear', 'ProLine', 'Apex Commerce', 'Luxora', 'UrbanEdge', 'PrimeCore'];
  const modifiers = ['Pro Edition', 'Ultra Slim', 'Classic Ergonomic', 'Series 3', 'Wireless Edition', 'Heavy Duty', 'Compact', 'Precision'];

  const results = [];
  const itemCount = Math.floor(Math.random() * 8) + 24; // 24 to 31 products

  for (let i = 0; i < itemCount; i++) {
    const brand = brands[i % brands.length];
    const mod = modifiers[i % modifiers.length];
    const merchant = merchants[Math.floor(Math.pow(Math.random(), 1.6) * merchants.length)];

    // Calculate realistic spread price with central tendency
    const ratio = Math.pow(Math.random(), 1.4);
    const rawPrice = Math.round(effectiveMin + (effectiveMax - effectiveMin) * ratio);
    const rating = +(3.8 + Math.random() * 1.1).toFixed(1);
    const reviews = Math.floor(Math.pow(Math.random(), 2.2) * 3200) + 14;

    results.push({
      position: i + 1,
      title: `${brand} ${query} — ${mod}`,
      link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      product_link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: merchant,
      price: `${currencySymbol}${rawPrice.toLocaleString()}`,
      extracted_price: rawPrice,
      rating: Math.min(rating, 5.0),
      reviews,
      snippet: `Features high quality components, official warranty, fast delivery from ${merchant}.`,
      extensions: ['Free Delivery', 'Eligible for Return', 'In Stock'],
    });
  }

  return {
    shoppingResults: results,
    searchMetadata: {
      status: 'Simulated Preview',
      isLive: false,
      source: 'Simulated Engine (Add SERPAPI_KEY to server/.env for Live OG Data)',
    },
    searchInformation: { total_results: results.length * 42 },
    filters: [
      {
        type: 'related',
        options: [
          { text: `${query} wireless` },
          { text: `${query} premium` },
          { text: `${query} accessories` },
        ],
      },
    ],
    relatedSearches: [
      `${query} best deals`,
      `${query} price comparison`,
      `${query} top rated models`,
      `cheap ${query} online`,
    ],
  };
}

/**
 * Wrapper around SerpApi getJson that returns a promise.
 * Only called when a valid API key is available.
 */
function serpApiGetJson(params) {
  return new Promise((resolve, reject) => {
    getJson(params, (json) => {
      if (json.error) {
        reject(new Error(json.error));
      } else {
        resolve(json);
      }
    });
  });
}

/**
 * Extract related search terms from SerpApi response.
 */
function extractRelatedSearches(result) {
  const searches = [];

  if (result.related_searches) {
    searches.push(...result.related_searches.map((r) => r.query || r.title).filter(Boolean));
  }

  if (result.filters) {
    for (const filter of result.filters) {
      if (filter.type === 'related' || filter.type === 'category') {
        const options = filter.options || [];
        searches.push(...options.map((o) => o.text || o.value).filter(Boolean));
      }
    }
  }

  return [...new Set(searches)];
}
