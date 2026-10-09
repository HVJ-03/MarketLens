import { useMemo, useState } from 'react';
import { formatPrice } from './format.js';

/**
 * AI Market Entry & Price War Simulator (Tier S).
 * Real-time sliders for price / unit cost / marketing spend / inventory.
 * All computations derive from observed scan data — competitor pressure is a
 * measured count of products within ±10% of the proposed price.
 */
export default function PriceWarSimulator({ priceStats, products = [], country }) {
  const [price, setPrice] = useState(null);
  const [unitCost, setUnitCost] = useState(null);
  const [marketingSpend, setMarketingSpend] = useState(null);
  const [inventory, setInventory] = useState(500);

  const min = priceStats?.min ?? 0;
  const max = priceStats?.max ?? 100;
  const effectivePrice = price ?? Math.round((priceStats?.median ?? 50));
  const effectiveCost = unitCost ?? Math.round((effectivePrice || 50) * 0.45);
  const effectiveMarketing = marketingSpend ?? Math.max(Math.round((effectivePrice || 50) * 120), 10000);

  // Competitor pressure: observed count within ±10% of proposed price
  const competitorPressure = useMemo(() => {
    if (effectivePrice == null) return { count: 0, list: [], share: 0 };
    const window = effectivePrice * 0.1;
    const list = products.filter(
      (p) => p.price != null && Math.abs(p.price - effectivePrice) <= window
    );
    const pricedTotal = products.filter((p) => p.price != null).length;
    return {
      count: list.length,
      list: list.slice(0, 5),
      share: pricedTotal ? Math.round((list.length / pricedTotal) * 100) : 0,
    };
  }, [effectivePrice, products]);

  // Positioning tier (same thresholds as Competitor X-Ray for consistency)
  const positioning = getPositioningTier(effectivePrice, priceStats?.median);

  // Unit economics
  const unitMargin = effectivePrice - effectiveCost;
  const marginPct = effectivePrice > 0 ? Math.round((unitMargin / effectivePrice) * 100) : 0;
  const breakEvenUnits = unitMargin > 0 ? Math.ceil(effectiveMarketing / unitMargin) : null;
  const inventoryValue = effectiveCost * inventory;
  const projectedRevenue = effectivePrice * inventory;
  const projectedProfit = unitMargin * inventory - effectiveMarketing;

  return (
    <div className="card-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Market Entry &amp; Price War Simulator</h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border border-white/15 bg-white/[0.06] text-neutral-300">
              Tier S
            </span>
          </div>
          <p className="text-xs text-neutral-400">Drag sliders to simulate entry — every metric recalculates in real time</p>
        </div>
        <span className="text-[11px] font-mono text-neutral-500 shrink-0">
          Based on {products.length || '—'} observed listings
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-5">
          <SliderRow
            label="Proposed Selling Price"
            value={effectivePrice}
            display={formatPrice(effectivePrice, country)}
            minv={Math.max(1, Math.round(min * 0.5))}
            maxv={Math.round(max * 1.5)}
            step={Math.max(1, Math.round((max - min) / 200))}
            onChange={setPrice}
          />
          <SliderRow
            label="Estimated Unit Cost (COGS)"
            value={effectiveCost}
            display={formatPrice(effectiveCost, country)}
            minv={1}
            maxv={Math.max(10, Math.round(effectivePrice * 0.9))}
            step={1}
            onChange={setUnitCost}
          />
          <SliderRow
            label="Target Marketing Spend"
            value={effectiveMarketing}
            display={formatPrice(effectiveMarketing, country)}
            minv={1000}
            maxv={Math.max(50000, Math.round(effectivePrice * 2000))}
            step={500}
            onChange={setMarketingSpend}
          />
          <SliderRow
            label="Initial Inventory Volume"
            value={inventory}
            display={`${inventory.toLocaleString()} units`}
            minv={50}
            maxv={5000}
            step={50}
            onChange={setInventory}
          />

          {/* Positioning tier */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-1.5">
              <span>BUDGET</span>
              <span>MID-TIER</span>
              <span>PREMIUM</span>
            </div>
            <div className="relative h-2 rounded bg-white/[0.06] overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[35%] bg-cyan-500/20" />
              <div className="absolute inset-y-0 left-[35%] w-[30%] bg-white/15" />
              <div className="absolute inset-y-0 left-[65%] w-[35%] bg-amber-500/20" />
              <div
                className="absolute top-0 h-full w-1 bg-white rounded transition-all duration-200"
                style={{
                  left: `${Math.min(98, Math.max(1,
                    ((effectivePrice - Math.max(1, Math.round(min * 0.5))) /
                      Math.max(1, Math.round(max * 1.5) - Math.max(1, Math.round(min * 0.5)))) * 100
                  ))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">Positioning</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${positioning.cls}`}>
                {positioning.label}
              </span>
            </div>
          </div>
        </div>

        {/* Live results */}
        <div className="space-y-3">
          {/* Competitor pressure */}
          <div
            className={`p-3.5 rounded-md border ${
              competitorPressure.count === 0
                ? 'bg-emerald-500/[0.05] border-emerald-500/25'
                : competitorPressure.count <= 3
                ? 'bg-amber-500/[0.04] border-amber-500/20'
                : 'bg-rose-500/[0.04] border-rose-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Competitor Pressure (±10% price)
              </span>
              <span
                className={`text-sm font-bold font-mono ${
                  competitorPressure.count === 0
                    ? 'text-emerald-400'
                    : competitorPressure.count <= 3
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {competitorPressure.count} rivals
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {competitorPressure.count === 0
                ? 'No observed listings compete within ±10% of this price — clear whitespace.'
                : `${competitorPressure.count} of ${products.length} observed listings (${competitorPressure.share}%) compete within ±10% of this price point.`}
            </p>
            {competitorPressure.list.length > 0 && (
              <div className="mt-2 space-y-1">
                {competitorPressure.list.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span className="truncate max-w-[70%]">{p.title}</span>
                    <span>{formatPrice(p.price, country)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Margin & break-even */}
          <div className="grid grid-cols-2 gap-2.5">
            <MetricBox
              label="Unit Margin"
              value={formatPrice(unitMargin, country)}
              sub={`${marginPct}% of price`}
              tone={unitMargin > 0 ? 'good' : 'bad'}
            />
            <MetricBox
              label="Break-even Volume"
              value={breakEvenUnits != null ? `${breakEvenUnits.toLocaleString()} units` : '—'}
              sub={breakEvenUnits == null ? 'Margin ≤ 0 — unviable' : `At ${formatPrice(effectiveMarketing, country)} spend`}
              tone={breakEvenUnits == null ? 'bad' : 'neutral'}
            />
            <MetricBox
              label="Inventory Investment"
              value={formatPrice(inventoryValue, country)}
              sub={`${inventory.toLocaleString()} units at cost`}
              tone="neutral"
            />
            <MetricBox
              label="Projected Net (full sell-through)"
              value={formatPrice(projectedProfit, country)}
              sub={`Revenue ${formatPrice(projectedRevenue, country)} − spend − COGS`}
              tone={projectedProfit > 0 ? 'good' : 'bad'}
            />
          </div>

          <p className="text-[10px] font-mono text-neutral-500 leading-relaxed">
            Projections assume full sell-through of initial inventory and are derived from observed
            competitor pricing. They model entry economics — they do not predict demand.
          </p>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, display, minv, maxv, step, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">{label}</label>
        <span className="text-sm font-bold font-mono text-white">{display}</span>
      </div>
      <input
        type="range"
        min={minv}
        max={maxv}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white cursor-pointer"
      />
    </div>
  );
}

function MetricBox({ label, value, sub, tone }) {
  const toneCls =
    tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-rose-400' : 'text-white';
  return (
    <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06]">
      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 block">{label}</span>
      <span className={`text-base font-bold font-mono block mt-0.5 ${toneCls}`}>{value}</span>
      <span className="text-[10px] text-neutral-500 block mt-0.5">{sub}</span>
    </div>
  );
}

function getPositioningTier(price, median) {
  if (price == null || median == null || median === 0) {
    return { label: 'Unknown', cls: 'border-white/15 bg-white/[0.06] text-neutral-300' };
  }
  if (price < median * 0.7) return { label: 'Budget', cls: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' };
  if (price <= median * 1.3) return { label: 'Mid-Tier', cls: 'border-white/20 bg-white/10 text-neutral-200' };
  return { label: 'Premium', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };
}
