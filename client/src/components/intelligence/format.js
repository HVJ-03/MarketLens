/**
 * Shared formatting helpers for MarketLens intelligence components.
 */

const CURRENCY_MAP = {
  in: 'INR', us: 'USD', gb: 'GBP', de: 'EUR', fr: 'EUR',
  ca: 'CAD', au: 'AUD', jp: 'JPY',
};

export function formatPrice(value, country) {
  if (value == null || isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: CURRENCY_MAP[country] || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

export function formatCompact(value) {
  if (value == null) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return `${Math.round(value)}`;
}
