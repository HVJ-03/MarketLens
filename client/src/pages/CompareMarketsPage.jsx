import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatPrice } from '../components/intelligence/format.js';

/**
 * Multi-Market Regional Comparison (Tier A) — compare the same or related
 * categories across countries side-by-side: pricing, merchants, competition.
 */
export default function CompareMarketsPage() {
  const [scans, setScans] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await api.get('/scans');
        const completed = (res.data.scans || []).filter((s) => s.status === 'completed');
        setScans(completed);
        // Preselect up to 3 most recent completed scans
        setSelected(completed.slice(0, 3).map((s) => s._id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  const toggleScan = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const runComparison = async () => {
    if (selected.length < 2) {
      setError('Select at least 2 completed scans to compare.');
      return;
    }
    setError('');
    setComparing(true);
    try {
      const res = await api.post('/scans/compare', { scanIds: selected });
      setComparison(res.data.comparison);
    } catch (err) {
      setError(err.message);
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400">
        <LoadingSpinner size="lg" />
        <span className="text-xs font-mono mt-4 text-neutral-500">Loading markets…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold tracking-tight text-white">Multi-Market Comparison</h1>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border border-white/15 bg-white/[0.06] text-neutral-300">
            Tier A
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          Cross-border arbitrage — compare pricing, merchants, and competition across markets
        </p>
      </div>

      {scans.length < 2 ? (
        <div className="card-panel p-10 text-center">
          <h2 className="text-sm font-medium text-white mb-1">Need at least 2 completed scans</h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
            Run market scans in different countries (e.g., the same product in 🇮🇳 India and 🇺🇸 United States),
            then return here to compare them side-by-side.
          </p>
          <Link to="/new-scan" className="btn-primary text-xs inline-flex">Run a New Scan</Link>
        </div>
      ) : (
        <>
          {/* Scan picker */}
          <div className="card-panel p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2.5">
              Select 2–4 Completed Scans
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {scans.map((s) => {
                const isSelected = selected.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleScan(s._id)}
                    className={`text-left p-3 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/30'
                        : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-white truncate">{s.query}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-neutral-300 shrink-0">
                        {s.country}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                      {s.scanResults?.totalProducts || 0} products · {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] font-mono text-neutral-500">{selected.length} selected</span>
              <button
                onClick={runComparison}
                disabled={comparing || selected.length < 2}
                className="btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {comparing ? 'Comparing…' : 'Compare Markets →'}
              </button>
            </div>
          </div>

          {error && (
            <div className="card-panel p-3.5 bg-rose-500/[0.04] border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Comparison results */}
          {comparison && comparison.length >= 2 && (
            <>
              {/* Side-by-side table */}
              <div className="card-panel overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500">Metric</th>
                      {comparison.map((c) => (
                        <th key={c.scanId} className="px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider text-neutral-300">
                          {c.query}
                          <span className="ml-1.5 px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[9px]">{c.country}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    <Row label="Products Analyzed" values={comparison.map((c) => c.totalProducts)} />
                    <Row label="Unique Merchants" values={comparison.map((c) => c.uniqueMerchants)} />
                    <Row
                      label="Median Price"
                      values={comparison.map((c) => formatPrice(c.priceStats?.median, c.country))}
                    />
                    <Row
                      label="Average Price"
                      values={comparison.map((c) => formatPrice(c.priceStats?.average, c.country))}
                    />
                    <Row
                      label="Price Range"
                      values={comparison.map(
                        (c) => c.priceStats ? `${formatPrice(c.priceStats.min, c.country)} – ${formatPrice(c.priceStats.max, c.country)}` : '—'
                      )}
                    />
                    <Row
                      label="Avg Rating"
                      values={comparison.map((c) => (c.avgRating != null ? `${c.avgRating.toFixed(1)}★` : '—'))}
                    />
                    <Row
                      label="Competition"
                      values={comparison.map((c) => (c.competitionLevel ? `${c.competitionLevel.label} (${c.competitionLevel.score}/100)` : '—'))}
                    />
                    <Row
                      label="Top Merchant"
                      values={comparison.map((c) => c.topMerchants?.[0]?.name || '—')}
                    />
                  </tbody>
                </table>
              </div>

              {/* Median price comparison chart — normalized view only for same-currency groups */}
              <div className="card-panel p-5">
                <h2 className="text-sm font-semibold text-white tracking-tight mb-1">Median Price by Market</h2>
                <p className="text-xs text-neutral-400 mb-4">
                  Local-currency values — direct comparison requires FX conversion.
                </p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparison.map((c) => ({
                        market: `${c.country.toUpperCase()} · ${c.query.slice(0, 14)}`,
                        median: c.priceStats?.median || 0,
                      }))}
                      margin={{ top: 10, right: 10, bottom: 10, left: -10 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="market" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0e1117',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '12px',
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                      <Bar dataKey="median" name="Median price (local currency)" fill="#e4e4e7" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Arbitrage hints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comparison.map((c) => (
                  <div key={c.scanId} className="card-panel p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-white truncate">
                        {c.query} <span className="text-neutral-500">· {c.country.toUpperCase()}</span>
                      </h3>
                      <Link to={`/scan/${c.scanId}`} className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0 no-underline">
                        Open scan →
                      </Link>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {c.competitionLevel?.description || 'No competition data available.'}
                    </p>
                    {c.topMerchants?.length > 0 && (
                      <p className="text-[11px] font-mono text-neutral-500 mt-2">
                        Key merchants: {c.topMerchants.slice(0, 3).map((m) => m.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, values }) {
  return (
    <tr>
      <td className="px-3 py-2.5 text-neutral-400 font-mono text-[11px] whitespace-nowrap">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-2.5 text-white font-mono">{v}</td>
      ))}
    </tr>
  );
}
