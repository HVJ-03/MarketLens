import { useEffect } from 'react';
import { formatPrice } from './format.js';

/**
 * Competitor X-Ray (Tier S) — slide-over drawer aggregating public evidence
 * about a single listing into a structured profile.
 */
export default function CompetitorXRay({ open, product, onClose, priceStats, country, products = [] }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const median = priceStats?.median ?? null;
  const average = priceStats?.average ?? null;
  const positioning = getPositioning(product.price, median);
  const traction = getTractionIndex(product);
  const { strengths, weaknesses } = deriveObservations(product, { median, average, products });

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/15 bg-[#0e1117] shadow-2xl animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Competitor X-Ray"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10 bg-[#0e1117]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-white/[0.06] border border-white/15 flex items-center justify-center text-white shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Competitor X-Ray</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border border-white/15 bg-white/[0.06] text-neutral-300">
                  Tier S
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                100% public search data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close X-Ray"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                className="w-full h-36 object-cover rounded-md border border-white/10 mb-3"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <h3 className="text-sm font-semibold text-white leading-snug">{product.title}</h3>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              {product.merchant || 'Unknown merchant'} · {product.source || 'google_shopping'}
            </p>
          </div>

          {/* Price positioning */}
          <section>
            <SectionTitle>Price Positioning</SectionTitle>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              <Stat label="This Product" value={formatPrice(product.price, country)} highlight />
              <Stat label="Category Median" value={formatPrice(median, country)} />
              <Stat label="Category Average" value={formatPrice(average, country)} />
            </div>
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">Positioning Tier</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${positioning.cls}`}>
                {positioning.label}
              </span>
            </div>
            {product.price != null && median != null && (
              <p className="text-[11px] text-neutral-400 mt-2">
                {product.price > median ? 'Priced above' : product.price < median ? 'Priced below' : 'Priced at'} the
                observed market median ({positioning.delta}).
              </p>
            )}
          </section>

          {/* Rating & traction */}
          <section>
            <SectionTitle>Rating &amp; Traction Index</SectionTitle>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              <Stat label="Rating" value={product.rating != null ? `${product.rating.toFixed(1)}★` : '—'} />
              <Stat label="Reviews" value={product.reviewCount != null ? product.reviewCount.toLocaleString() : '—'} />
              <Stat label="Traction Index" value={traction != null ? `${traction}/100` : '—'} highlight />
            </div>
            {traction != null && (
              <div className="w-full h-1.5 rounded bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-white/70 rounded transition-all duration-500" style={{ width: `${traction}%` }} />
              </div>
            )}
            <p className="text-[10px] font-mono text-neutral-500 mt-1.5">
              Traction = weighted blend of star rating and log-scaled review volume vs. sample max.
            </p>
          </section>

          {/* Feature spec matrix */}
          {Array.isArray(product.features) && product.features.length > 0 && (
            <section>
              <SectionTitle>Feature Spec Matrix</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {product.features.slice(0, 12).map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded text-[11px] bg-white/[0.04] border border-white/10 text-neutral-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Observed strengths & weaknesses */}
          <section>
            <SectionTitle>Observed Strengths &amp; Weaknesses</SectionTitle>
            <div className="space-y-1.5">
              {strengths.map((s, i) => (
                <ObservationRow key={`s${i}`} kind="strength" text={s} />
              ))}
              {weaknesses.map((w, i) => (
                <ObservationRow key={`w${i}`} kind="weakness" text={w} />
              ))}
              {strengths.length === 0 && weaknesses.length === 0 && (
                <p className="text-[11px] text-neutral-500 font-mono">
                  Not enough comparable data to derive observations for this listing.
                </p>
              )}
            </div>
          </section>

          {/* Source link */}
          {product.productUrl && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs inline-flex items-center gap-1.5 no-underline"
            >
              Open original listing
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">{children}</div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div
      className={`p-2.5 rounded-md border text-center ${
        highlight ? 'bg-white/[0.06] border-white/20' : 'bg-white/[0.02] border-white/[0.06]'
      }`}
    >
      <span className="text-sm font-bold font-mono text-white block truncate">{value}</span>
      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">{label}</span>
    </div>
  );
}

function ObservationRow({ kind, text }) {
  const isStrength = kind === 'strength';
  return (
    <div
      className={`flex items-start gap-2 p-2.5 rounded border ${
        isStrength ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-amber-500/[0.04] border-amber-500/20'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${isStrength ? 'text-emerald-400' : 'text-amber-400'}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {isStrength ? <polyline points="20 6 9 17 4 12" /> : <line x1="12" y1="8" x2="12" y2="12" />}
        </svg>
      </span>
      <p className="text-[11px] text-neutral-300 leading-relaxed">{text}</p>
    </div>
  );
}

function getPositioning(price, median) {
  if (price == null || median == null || median === 0) {
    return { label: 'Unknown', cls: 'border-white/15 bg-white/[0.06] text-neutral-300', delta: '' };
  }
  const pct = Math.round(((price - median) / median) * 100);
  const delta = `${pct >= 0 ? '+' : ''}${pct}% vs median`;
  if (price < median * 0.7) return { label: 'Budget', cls: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', delta };
  if (price <= median * 1.3) return { label: 'Mid-Tier', cls: 'border-white/20 bg-white/10 text-neutral-200', delta };
  return { label: 'Premium', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', delta };
}

function getTractionIndex(product) {
  if (product.rating == null && !product.reviewCount) return null;
  const ratingPart = product.rating != null ? (product.rating / 5) * 70 : 35;
  // log10(5000) ≈ 3.7 → saturates
  const reviewPart = Math.min(Math.log10((product.reviewCount || 0) + 10) / 3.7, 1) * 30;
  return Math.round(ratingPart + reviewPart);
}

/**
 * Derive observations strictly from comparable observed data in the scan sample.
 */
function deriveObservations(product, { median, products }) {
  const strengths = [];
  const weaknesses = [];

  if (product.rating != null && products.length > 0) {
    const rated = products.filter((p) => p.rating != null);
    if (rated.length >= 3) {
      const avgRating = rated.reduce((a, p) => a + p.rating, 0) / rated.length;
      if (product.rating >= avgRating + 0.4) {
        strengths.push(`Rating (${product.rating.toFixed(1)}★) is well above the sample average of ${avgRating.toFixed(1)}★.`);
      } else if (product.rating <= avgRating - 0.4) {
        weaknesses.push(`Rating (${product.rating.toFixed(1)}★) trails the sample average of ${avgRating.toFixed(1)}★.`);
      }
    }
  }

  if (product.reviewCount != null && products.length > 0) {
    const withReviews = products.filter((p) => p.reviewCount != null);
    if (withReviews.length >= 3) {
      const sorted = withReviews.map((p) => p.reviewCount).sort((a, b) => a - b);
      const p70 = sorted[Math.floor(sorted.length * 0.7)];
      if (product.reviewCount >= p70) {
        strengths.push(`Review volume (${product.reviewCount.toLocaleString()}) is in the top 30% of observed listings — strong sales traction.`);
      } else if (product.reviewCount < 25) {
        weaknesses.push(`Very few reviews (${product.reviewCount}) — limited established trust signals.`);
      }
    }
  }

  if (product.price != null && median != null) {
    if (product.price > median * 1.5) {
      weaknesses.push(`Priced ${Math.round(((product.price - median) / median) * 100)}% above the market median — premium positioning without guaranteed differentiation.`);
    } else if (product.price < median * 0.7) {
      strengths.push(`Aggressive pricing ${Math.abs(Math.round(((product.price - median) / median) * 100))}% below the market median — strong value positioning.`);
    }
  }

  const features = Array.isArray(product.features) ? product.features.map((f) => f.toLowerCase()) : [];
  if (features.some((f) => /free deliver|free ship/.test(f))) {
    strengths.push('Offers free delivery/shipping — meets baseline buyer expectation.');
  } else if (features.length > 0 && products.length > 0) {
    const othersWithFreeDelivery = products.filter((p) =>
      Array.isArray(p.features) && p.features.some((f) => /free deliver|free ship/i.test(f))
    ).length;
    if (othersWithFreeDelivery / products.length > 0.6) {
      weaknesses.push('Lacks free delivery, which most competing listings advertise.');
    }
  }

  if (features.some((f) => /warrant|guarantee/.test(f))) {
    strengths.push('Advertises warranty/guarantee coverage.');
  }

  return { strengths, weaknesses };
}
