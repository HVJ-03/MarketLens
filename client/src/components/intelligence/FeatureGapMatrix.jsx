import { formatCompact } from './format.js';

/**
 * Feature Gap Detector — "Beat the Competition" mode (Tier A).
 * Categorizes observed product attributes into Table Stakes (>60% adoption)
 * and Differentiator Gaps (10–30% adoption), with quantified percentages.
 */
export default function FeatureGapMatrix({ featureGap }) {
  const { tableStakes = [], differentiatorGaps = [], totalProducts = 0 } = featureGap || {};

  if (tableStakes.length === 0 && differentiatorGaps.length === 0) {
    return (
      <div className="card-panel p-8 text-center">
        <h2 className="text-sm font-semibold text-white tracking-tight mb-1">Feature Gap Detector</h2>
        <p className="text-xs text-neutral-400">
          Not enough feature-bearing listings were found to build a reliable adoption matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="card-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Feature Gap Detector</h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border border-white/15 bg-white/[0.06] text-neutral-300">
              Beat the Competition
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Attributes extracted from {totalProducts} listing titles &amp; snippets — quantified adoption rates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Table stakes */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Table Stakes
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">&gt;60% ADOPTION — MANDATORY BASELINE</span>
          </div>
          <div className="space-y-1.5">
            {tableStakes.length === 0 && (
              <p className="text-[11px] text-neutral-500 font-mono">No dominant baseline attributes detected.</p>
            )}
            {tableStakes.map((f, i) => (
              <FeatureRow key={i} feature={f} kind="stakes" />
            ))}
          </div>
        </div>

        {/* Differentiator gaps */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Differentiator Gaps
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">10–30% ADOPTION — WHITESPACE</span>
          </div>
          <div className="space-y-1.5">
            {differentiatorGaps.length === 0 && (
              <p className="text-[11px] text-neutral-500 font-mono">
                No emerging attributes detected in the 10–30% adoption band.
              </p>
            )}
            {differentiatorGaps.map((f, i) => (
              <FeatureRow key={i} feature={f} kind="gap" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-4 text-[10px] font-mono text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-sm bg-rose-400/70" /> Saturated — ship it or lose
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-sm bg-emerald-400/70" /> Emerging — adopt to differentiate
        </span>
      </div>
    </div>
  );
}

function FeatureRow({ feature, kind }) {
  const isStakes = kind === 'stakes';
  const pct = feature.percentage ?? 0;
  return (
    <div
      className={`p-2.5 rounded border ${
        isStakes ? 'bg-rose-500/[0.03] border-rose-500/15' : 'bg-emerald-500/[0.03] border-emerald-500/15'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs text-white truncate capitalize">{feature.feature}</span>
        <span className={`text-[11px] font-mono shrink-0 ${isStakes ? 'text-rose-300' : 'text-emerald-300'}`}>
          {pct}% · {formatCompact(feature.count)} products
        </span>
      </div>
      <div className="w-full h-1 rounded bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded ${isStakes ? 'bg-rose-400/70' : 'bg-emerald-400/70'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
