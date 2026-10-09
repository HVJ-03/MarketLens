import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import OpportunityMap from '../components/intelligence/OpportunityMap.jsx';
import EvidenceModal from '../components/intelligence/EvidenceModal.jsx';
import CompetitorXRay from '../components/intelligence/CompetitorXRay.jsx';
import PriceWarSimulator from '../components/intelligence/PriceWarSimulator.jsx';
import RadarScorecard from '../components/intelligence/RadarScorecard.jsx';
import FeatureGapMatrix from '../components/intelligence/FeatureGapMatrix.jsx';

export default function ScanDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [evidenceOpp, setEvidenceOpp] = useState(null);
  const [xrayProduct, setXrayProduct] = useState(null);

  const fetchScan = useCallback(async () => {
    try {
      const res = await api.get(`/scans/${id}`);
      setScan(res.data.scan);

      // Poll if scan is in progress
      if (['pending', 'searching', 'analyzing'].includes(res.data.scan.status)) {
        setTimeout(fetchScan, 2500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScan();
  }, [fetchScan]);

  // Fetch full product listings once scan completes (for X-Ray / simulator / evidence)
  useEffect(() => {
    if (scan?.status !== 'completed') return;
    let cancelled = false;
    api.get(`/scans/${id}/products`)
      .then((res) => { if (!cancelled) setProducts(res.data.products || []); })
      .catch(() => {}); // non-critical
    return () => { cancelled = true; };
  }, [scan?.status, id]);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await api.post(`/scans/${id}/report`);
      window.location.href = `/reports/${res.data.report._id}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopySummary = () => {
    if (!scan) return;
    const text = `MarketLens Scan: ${scan.query} (${scan.country?.toUpperCase()})\nProducts Found: ${scan.scanResults?.totalProducts || 0}\nAverage Price: ${formatPrice(scan.scanResults?.priceStats?.average, scan.country)}\nMerchants: ${scan.scanResults?.uniqueMerchants || 0}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400">
        <LoadingSpinner size="lg" />
        <span className="text-xs font-mono mt-4 text-neutral-500">Querying market database…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-panel p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white mb-1">Scan Retrieval Error</h2>
        <p className="text-xs text-neutral-400 mb-4">{error}</p>
        <Link to="/dashboard" className="btn-secondary text-xs">Return to Dashboard</Link>
      </div>
    );
  }

  if (!scan) return null;

  // Render scanning progress state
  if (['pending', 'searching', 'analyzing'].includes(scan.status)) {
    return <TelemetryScanner status={scan.status} query={scan.query} country={scan.country} />;
  }

  if (scan.status === 'failed') {
    return (
      <div className="max-w-xl mx-auto card-panel p-8 text-center my-12">
        <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white mb-1">Scan Execution Failed</h2>
        <p className="text-xs text-neutral-400 mb-6">{scan.errorMessage || 'The commerce data provider was unable to return results for this query.'}</p>
        <div className="flex items-center justify-center gap-2">
          <Link to="/new-scan" className="btn-primary text-xs">Configure New Query</Link>
          <Link to="/dashboard" className="btn-secondary text-xs">Dashboard</Link>
        </div>
      </div>
    );
  }

  const results = scan.scanResults || {};

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <Link to="/dashboard" className="hover:text-white transition-colors no-underline">SCANS</Link>
            <span>/</span>
            <span className="text-neutral-300 font-mono uppercase">{scan.country}</span>
            <span>/</span>
            <span className="text-white font-mono">{scan._id.slice(-6)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">{scan.query}</h1>
            {results.isLive ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-led" />
                LIVE SERPAPI GOOGLE SHOPPING
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1.5">
                ⚡ SIMULATION PREVIEW
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="btn-secondary text-xs cursor-pointer"
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Snapshot
              </>
            )}
          </button>

          <button
            id="generate-report-button"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="btn-primary text-xs"
          >
            {generatingReport ? (
              <>
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Synthesizing Report…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Generate Full AI Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notice if running in simulation preview */}
      {!results.isLive && (
        <div className="card-panel p-3.5 bg-amber-500/[0.04] border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-neutral-300 font-mono text-[11px]">
              <strong className="text-amber-300 font-semibold">Simulation Preview:</strong> This scan used our realistic commerce engine because <code className="text-neutral-200 bg-white/10 px-1 py-0.5 rounded">SERPAPI_KEY</code> is not yet configured in <code className="text-neutral-200 bg-white/10 px-1 py-0.5 rounded">server/.env</code>.
            </span>
          </div>
          <a
            href="https://serpapi.com/manage-api-key"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0 self-start sm:self-auto"
          >
            Get Free SerpApi Key (100 searches) →
          </a>
        </div>
      )}

      {/* 4 Architectural Metric Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card-panel p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">Products Analyzed</span>
          <span className="text-2xl font-bold font-mono text-white">{results.totalProducts || 0}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Direct shopping listings</span>
        </div>

        <div className="card-panel p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">Active Merchants</span>
          <span className="text-2xl font-bold font-mono text-white">{results.uniqueMerchants || 0}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Unique retail storefronts</span>
        </div>

        <div className="card-panel p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">Market Avg Price</span>
          <span className="text-2xl font-bold font-mono text-white">{formatPrice(results.priceStats?.average, scan.country)}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Across all matching tiers</span>
        </div>

        <div className="card-panel p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">Median Price</span>
          <span className="text-2xl font-bold font-mono text-white">{formatPrice(results.priceStats?.median, scan.country)}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Central pricing tendency</span>
        </div>
      </div>

      {/* Market Radar Scorecard (Tier A) */}
      <RadarScorecard radarScorecard={results.radarScorecard} />

      {/* Market Opportunity Map (Tier S) */}
      <OpportunityMap
        opportunityMap={results.opportunityMap}
        country={scan.country}
        onPointClick={(point) => {
          const full = products.find((p) => p._id === point.id);
          if (full) setXrayProduct(full);
        }}
      />

      {/* Feature Gap Detector (Tier A) */}
      <FeatureGapMatrix featureGap={results.featureGap} />

      {/* Price War Simulator (Tier S) */}
      {results.priceStats && (
        <PriceWarSimulator
          priceStats={results.priceStats}
          products={products}
          country={scan.country}
        />
      )}

      {/* Price Distribution Chart */}
      {results.priceDistribution && results.priceDistribution.length > 0 && (
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Price Distribution Density</h2>
              <p className="text-xs text-neutral-400">Frequency of product listings grouped by price bracket</p>
            </div>
            {results.priceStats && (
              <span className="text-xs font-mono text-neutral-400">
                Range: {formatPrice(results.priceStats.min, scan.country)} — {formatPrice(results.priceStats.max, scan.country)}
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.priceDistribution} margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e1117',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="count" fill="#e4e4e7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid: Top Merchants & Competition Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Merchants */}
        {results.topMerchants && results.topMerchants.length > 0 && (
          <div className="card-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white tracking-tight">Dominant Merchants</h2>
              <span className="text-[11px] font-mono text-neutral-500">SHARE OF VOICE</span>
            </div>
            <div className="space-y-2">
              {results.topMerchants.slice(0, 7).map((m, i) => {
                const total = results.totalProducts || 1;
                const percentage = Math.round((m.count / total) * 100);
                return (
                  <div key={i} className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-500 w-4">{i + 1}.</span>
                      <span className="text-xs font-medium text-white">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-white/[0.06] h-1.5 rounded overflow-hidden hidden sm:block">
                        <div className="bg-white/70 h-full rounded" style={{ width: `${Math.min(percentage * 2, 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-neutral-400">{m.count} items ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Competition & Market Saturation Indicator */}
        {results.competitionLevel && (
          <div className="card-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white tracking-tight">Market Competition Index</h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border border-white/10 text-neutral-300">
                  {results.competitionLevel.score}/100
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                {results.competitionLevel.description}
              </p>

              {/* Segmented Architectural Gauge (NO Rainbow Gradient) */}
              <div className="space-y-1.5">
                <div className="w-full h-2 rounded bg-white/[0.06] overflow-hidden flex">
                  <div
                    className="h-full bg-white transition-all duration-700"
                    style={{ width: `${Math.min(results.competitionLevel.score || 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>LOW (OPPORTUNITY)</span>
                  <span>MODERATE</span>
                  <span>HIGH SATURATION</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/[0.06] text-[11px] text-neutral-500 font-mono">
              Evaluated using seller concentration ratio and pricing dispersion variance.
            </div>
          </div>
        )}
      </div>

      {/* Competitor Listings — X-Ray entry points */}
      {products.length > 0 && (
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Competitor Listings</h2>
              <p className="text-xs text-neutral-400">Click any listing to open its Competitor X-Ray profile</p>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">{products.length} LISTINGS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {products.slice(0, 12).map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => setXrayProduct(p)}
                className="text-left p-2.5 rounded bg-white/[0.02] border border-white/[0.06] hover:border-white/25 hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <p className="text-xs text-white truncate">{p.title}</p>
                <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                  {formatPriceDisplay(p.price, scan.country)}
                  {p.rating != null ? ` · ${p.rating.toFixed(1)}★` : ''}
                  {p.merchant ? ` · ${p.merchant}` : ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Signals */}
      {results.opportunities && results.opportunities.length > 0 && (
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Detected Commercial Opportunities</h2>
              <p className="text-xs text-neutral-400">Algorithmic signals identifying product and pricing gaps</p>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">{results.opportunities.length} SIGNALS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.opportunities.map((opp, i) => (
              <div key={i} className="p-4 rounded-md bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-semibold text-white">{opp.title}</h3>
                    <ConfidenceBadge confidence={opp.confidence} />
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed mb-2">{opp.description}</p>
                </div>
                {opp.evidence && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <p className="text-[11px] text-neutral-500 font-mono">Evidence: {opp.evidence}</p>
                  </div>
                )}
                {/* Why? Evidence Audit (Tier A) */}
                <button
                  type="button"
                  onClick={() => setEvidenceOpp({ ...opp, sampleSize: results.totalProducts })}
                  className="mt-2 self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-white/[0.05] border border-white/15 text-neutral-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Why?
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Expansion — related search explorer */}
      {results.relatedSearches && results.relatedSearches.length > 0 && (
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Search Intelligence &amp; Query Expansion</h2>
              <p className="text-xs text-neutral-400">Commercial search phrases discovered from the SerpApi search graph — click to scan a niche</p>
            </div>
            <Link to="/compare" className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0 no-underline">
              Compare markets →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {results.relatedSearches.slice(0, 16).map((term, i) => (
              <Link
                key={i}
                to={`/new-scan?q=${encodeURIComponent(term)}&c=${scan.country}`}
                className="px-2.5 py-1.5 rounded text-xs bg-white/[0.03] border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 hover:bg-white/[0.07] transition-all no-underline"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Audit Modal */}
      <EvidenceModal
        open={!!evidenceOpp}
        opportunity={evidenceOpp}
        country={scan.country}
        products={products}
        onClose={() => setEvidenceOpp(null)}
      />

      {/* Competitor X-Ray Drawer */}
      <CompetitorXRay
        open={!!xrayProduct}
        product={xrayProduct}
        priceStats={results.priceStats}
        country={scan.country}
        products={products}
        onClose={() => setXrayProduct(null)}
      />
    </div>
  );
}

function TelemetryScanner({ status, query, country }) {
  const steps = [
    { key: 'pending', label: 'Query validation & routing' },
    { key: 'searching', label: 'SerpApi real-time product harvest' },
    { key: 'analyzing', label: 'Merchant concentration & pricing analysis' },
    { key: 'completed', label: 'Synthesis complete' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="max-w-md mx-auto py-20 animate-fade-in">
      <div className="card-panel p-7 text-center">
        {/* Animated Scanner Radar */}
        <div className="w-12 h-12 rounded-md bg-white/[0.06] border border-white/15 mx-auto flex items-center justify-center text-white mb-4 relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-led" />
        </div>

        <h1 className="text-base font-semibold text-white tracking-tight mb-1">
          Market Intelligence Harvest
        </h1>
        <p className="text-xs font-mono text-neutral-400 mb-6 truncate">
          TARGET: "{query}" ({country?.toUpperCase()})
        </p>

        {/* Telemetry Steps */}
        <div className="space-y-2.5 text-left border-t border-white/[0.08] pt-4">
          {steps.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={step.key} className="flex items-center gap-3 text-xs font-mono">
                <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : active
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/[0.08] bg-transparent text-neutral-600'
                }`}>
                  {done ? '✓' : active ? <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-led" /> : i + 1}
                </div>
                <span className={done ? 'text-neutral-300' : active ? 'text-white font-medium' : 'text-neutral-600'}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-neutral-500 font-mono">
          Average turnaround: 10–25s
        </div>
      </div>
    </div>
  );
}

function formatPriceDisplay(value, country) {
  if (value == null) return '—';
  const currencyMap = { in: 'INR', us: 'USD', gb: 'GBP', de: 'EUR', fr: 'EUR', ca: 'CAD', au: 'AUD', jp: 'JPY' };
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyMap[country] || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

function ConfidenceBadge({ confidence }) {
  const configs = {
    high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  const cls = configs[confidence] || configs.medium;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase border ${cls}`}>
      {confidence || 'MED'} CONFIDENCE
    </span>
  );
}

function formatPrice(value, country) {
  if (value == null) return '—';
  const currencyMap = { in: 'INR', us: 'USD', gb: 'GBP', de: 'EUR', fr: 'EUR', ca: 'CAD', au: 'AUD', jp: 'JPY' };
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyMap[country] || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}
