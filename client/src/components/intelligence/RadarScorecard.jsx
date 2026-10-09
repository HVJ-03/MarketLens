import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

/**
 * Market Radar Scorecard (Tier A) — 5-axis executive health check.
 * All axis values 0–100, derived from observed scan data.
 */
export default function RadarScorecard({ radarScorecard }) {
  if (!radarScorecard?.axes?.length) return null;

  const data = radarScorecard.axes.map((a) => ({
    axis: a.axis.replace('Competition Density', 'Competition'),
    full: a.axis,
    value: a.value,
    higherMeans: a.higherMeans,
  }));

  return (
    <div className="card-panel p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Market Radar Scorecard</h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border border-white/15 bg-white/[0.06] text-neutral-300">
              Tier A
            </span>
          </div>
          <p className="text-xs text-neutral-400">Executive health check — five measured market dimensions</p>
        </div>
        {radarScorecard.summary && (
          <span className="text-[11px] font-mono text-neutral-500 shrink-0">
            N={radarScorecard.summary.totalProducts} · {radarScorecard.summary.uniqueMerchants} merchants
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={1.5}
                fill="rgba(255,255,255,0.18)"
                fillOpacity={0.9}
                dot={{ r: 2.5, fill: '#fff', strokeWidth: 0 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-md border border-white/15 bg-[#0e1117] px-3 py-2 shadow-2xl max-w-[220px]">
                      <p className="text-xs font-medium text-white">{d.full}</p>
                      <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        {d.value}/100 — higher = {d.higherMeans}
                      </p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Axis breakdown */}
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.full} className="flex items-center gap-3">
              <span className="text-[11px] text-neutral-300 w-36 shrink-0 truncate">{d.full}</span>
              <div className="flex-1 h-1.5 rounded bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-700 ${
                    d.full === 'Competition Density'
                      ? d.value >= 70 ? 'bg-rose-400/80' : d.value >= 40 ? 'bg-amber-400/80' : 'bg-emerald-400/80'
                      : 'bg-white/70'
                  }`}
                  style={{ width: `${d.value}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-neutral-400 w-8 text-right">{d.value}</span>
            </div>
          ))}
          <p className="text-[10px] font-mono text-neutral-500 pt-2 border-t border-white/[0.06]">
            Competition Density color signals saturation (green = low opportunity cost, red = crowded).
            All other axes: higher is better for a new entrant.
          </p>
        </div>
      </div>
    </div>
  );
}
