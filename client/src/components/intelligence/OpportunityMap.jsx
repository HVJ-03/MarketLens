import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, Cell,
} from 'recharts';
import { formatPrice } from './format.js';

/**
 * Market Opportunity Map (Tier S) — interactive price × rating scatter plot.
 * Bubble size = review volume. Whitespace zones rendered as highlighted overlays.
 */
export default function OpportunityMap({ opportunityMap, country, onPointClick }) {
  const { points = [], whitespaceZones = [], stats } = opportunityMap || {};

  const ratedPoints = useMemo(
    () => points.filter((p) => p.rating != null).map((p) => ({ ...p, x: p.price, y: p.rating })),
    [points]
  );

  if (!points || points.length === 0) {
    return (
      <div className="card-panel p-8 text-center">
        <h2 className="text-sm font-semibold text-white tracking-tight mb-1">Market Opportunity Map</h2>
        <p className="text-xs text-neutral-400">No mappable product data for this scan.</p>
      </div>
    );
  }

  const maxWeight = Math.max(...points.map((p) => p.weight || 1), 2);
  const priceExtent = points.map((p) => p.price).filter((v) => v != null);
  const minP = priceExtent.length ? Math.min(...priceExtent) : 0;
  const maxP = priceExtent.length ? Math.max(...priceExtent) : 100;

  return (
    <div className="card-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Market Opportunity Map</h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border border-white/15 bg-white/[0.06] text-neutral-300">
              Tier S
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Price × Rating × Review Density — highlighted regions are uncrowded, high-demand whitespace
          </p>
        </div>
        {stats && (
          <span className="text-[11px] font-mono text-neutral-500 shrink-0">
            N={stats.totalProducts} · {stats.ratedProducts} rated
          </span>
        )}
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: -10 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[minP * 0.92, maxP * 1.05]}
              tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              tickFormatter={(v) => formatPrice(v, country)}
              label={{ value: 'Price', position: 'insideBottom', offset: -14, fill: '#52525b', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0.5, 5.25]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              tickFormatter={(v) => `${v}★`}
              label={{ value: 'Customer Rating', angle: -90, position: 'insideLeft', offset: 16, fill: '#52525b', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="rounded-md border border-white/15 bg-[#0e1117] px-3 py-2 shadow-2xl max-w-[260px]">
                    <p className="text-xs font-medium text-white leading-snug mb-1.5">{p.title}</p>
                    <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
                      <p>Price: {formatPrice(p.price, country)}</p>
                      <p>Rating: {p.rating?.toFixed(1)}★</p>
                      <p>{p.reviewCount?.toLocaleString()} reviews · {p.merchant}</p>
                      {onPointClick && <p className="text-emerald-400 mt-1">Click to X-Ray →</p>}
                    </div>
                  </div>
                );
              }}
            />
            {/* Whitespace overlays */}
            {whitespaceZones.map((z, i) => (
              <ReferenceArea
                key={i}
                x1={z.priceMin}
                x2={z.priceMax}
                y1={z.ratingBand === 'quality-desert' ? 0.5 : z.ratingThreshold}
                y2={5.25}
                fill={z.ratingBand === 'quality-desert' ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.10)'}
                stroke="rgba(52,211,153,0.45)"
                strokeDasharray="4 3"
              />
            ))}
            <Scatter
              data={ratedPoints}
              onClick={onPointClick ? (_data, index) => onPointClick(ratedPoints[index]) : undefined}
              className={onPointClick ? 'cursor-pointer' : ''}
            >
              {ratedPoints.map((p, i) => (
                <Cell
                  key={i}
                  fill="rgba(228,228,231,0.55)"
                  stroke="rgba(255,255,255,0.7)"
                  fillOpacity={0.45}
                  r={4 + ((p.weight || 1) / maxWeight) * 9}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
          <span className="w-2.5 h-2.5 rounded-full bg-white/50 border border-white/70" />
          Bubble = review volume
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
          <span className="w-4 h-2.5 rounded-sm bg-emerald-500/15 border border-dashed border-emerald-500/50" />
          Opportunity whitespace
        </span>
        {whitespaceZones.length === 0 && ratedPoints.length > 0 && (
          <span className="text-[11px] font-mono text-neutral-500">No uncrowded segments detected in this sample.</span>
        )}
      </div>

      {/* Whitespace zone callouts */}
      {whitespaceZones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
          {whitespaceZones.map((z, i) => (
            <div
              key={i}
              className="p-3 rounded-md bg-emerald-500/[0.04] border border-emerald-500/20"
              role={onPointClick && z.sampleProductId ? 'button' : undefined}
              onClick={onPointClick && z.sampleProductId ? () => onPointClick({ id: z.sampleProductId }) : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-xs font-semibold text-emerald-300">
                  Whitespace: {z.bandLabel} {z.ratingBand === 'quality-desert' ? '(quality desert)' : `≥ ${z.ratingThreshold}★`}
                </h3>
                <span className="text-[10px] font-mono text-emerald-400/80 shrink-0">
                  {z.competitorCount} competitor{z.competitorCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">{z.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
