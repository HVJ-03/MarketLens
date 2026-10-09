import { useEffect } from 'react';
import { formatPrice } from './format.js';

/**
 * "Why?" Evidence Audit Modal (Tier A) — explains exactly how an insight was
 * derived: sample size, percentile stats, and direct links to supporting
 * SerpApi-harvested listings.
 */
export default function EvidenceModal({ open, onClose, opportunity, country, products = [] }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !opportunity) return null;

  const supporting = opportunity.supportingProducts || [];
  // Resolve supporting product titles to full listings when product data is available
  const resolveListing = (ref) => {
    if (typeof ref === 'string') {
      return products.find((p) => p._id === ref || p.title === ref) || { title: ref };
    }
    return ref;
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Evidence audit"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-white/15 bg-[#0e1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0e1117]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">Why? — Evidence Audit</h2>
              <p className="text-[11px] text-neutral-400">{opportunity.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close evidence audit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Evidence chain */}
          <div className="p-3.5 rounded-md bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
              Evidence Chain
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-neutral-200">Observed Fact</span>
              <span className="text-neutral-600">→</span>
              <span className="px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-neutral-200">Derived Metric</span>
              <span className="text-neutral-600">→</span>
              <span className="px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-neutral-200">Interpretation</span>
              <span className="text-neutral-600">→</span>
              <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">Hypothesis</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mt-3">{opportunity.description}</p>
            {opportunity.evidence && (
              <p className="text-[11px] text-neutral-400 font-mono leading-relaxed mt-2 pt-2 border-t border-white/[0.06]">
                {opportunity.evidence}
              </p>
            )}
          </div>

          {/* Sample metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-center">
              <span className="text-lg font-bold font-mono text-white block">
                {opportunity.sampleSize ?? '—'}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Sample Size (N)</span>
            </div>
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-center">
              <span className="text-lg font-bold font-mono text-white block capitalize">
                {opportunity.confidence || '—'}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Confidence</span>
            </div>
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-center">
              <span className="text-lg font-bold font-mono text-white block">{supporting.length}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Linked Listings</span>
            </div>
          </div>

          {/* Supporting listings */}
          {supporting.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
                Supporting SerpApi-Harvested Listings
              </div>
              <div className="space-y-1.5">
                {supporting.map((ref, i) => {
                  const listing = resolveListing(ref);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-2.5 rounded bg-white/[0.02] border border-white/[0.06]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{listing.title || 'Unnamed listing'}</p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          {listing.price != null ? formatPrice(listing.price, country) : '—'}
                          {listing.rating != null ? ` · ${listing.rating.toFixed(1)}★` : ''}
                          {listing.merchant ? ` · ${listing.merchant}` : ''}
                        </p>
                      </div>
                      {listing.productUrl && (
                        <a
                          href={listing.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0"
                        >
                          View source →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {supporting.length === 0 && (
            <p className="text-[11px] text-neutral-500 font-mono">
              This signal is derived from aggregate statistics across the full sample; no individual
              listings are attached. See the Market Opportunity Map for per-listing evidence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
