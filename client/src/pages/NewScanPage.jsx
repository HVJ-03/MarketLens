import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';

const COUNTRIES = [
  { code: 'in', name: 'India', currency: '₹', flag: 'IN' },
  { code: 'us', name: 'United States', currency: '$', flag: 'US' },
  { code: 'gb', name: 'United Kingdom', currency: '£', flag: 'GB' },
  { code: 'de', name: 'Germany', currency: '€', flag: 'DE' },
  { code: 'fr', name: 'France', currency: '€', flag: 'FR' },
  { code: 'ca', name: 'Canada', currency: 'CA$', flag: 'CA' },
  { code: 'au', name: 'Australia', currency: 'A$', flag: 'AU' },
  { code: 'jp', name: 'Japan', currency: '¥', flag: 'JP' },
];

const SUGGESTED_QUERIES = [
  'Minimalist Mechanical Keyboard',
  'Ergonomic Lumbar Cushion',
  'Matcha Whisk Ceramic Set',
  'Titanium EDC Pen',
  'Portable Espresso Machine',
  'Leather Desk Mat 90x40',
];

export default function NewScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    query: searchParams.get('q') || '',
    country: searchParams.get('c') || 'in',
    minPrice: '',
    maxPrice: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    const c = searchParams.get('c');
    if (q) setForm((prev) => ({ ...prev, query: q, country: c || prev.country }));
  }, [searchParams]);

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country) || COUNTRIES[0];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.query.trim()) {
      setError('Please specify a product or commercial keyword.');
      return;
    }

    if (form.minPrice && form.maxPrice && Number(form.minPrice) > Number(form.maxPrice)) {
      setError('Minimum price threshold cannot exceed maximum price.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/scans', {
        query: form.query.trim(),
        country: form.country,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      });
      navigate(`/scan/${res.data.scan._id}`);
    } catch (err) {
      setError(err.message || 'Failed to initiate market scan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-4">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
          <span>MARKET_SCAN</span>
          <span>/</span>
          <span className="text-white">NEW_INQUIRY</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Execute Real-Time Market Scan
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Collect live listings across Google Shopping, analyze merchant dominance, and detect under-served price brackets.
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="card-panel p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Query Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="query" className="input-label">Product / Category Query</label>
              <span className="text-[11px] font-mono text-neutral-500">REQUIRED</span>
            </div>
            <div className="relative">
              <input
                id="query"
                name="query"
                type="text"
                value={form.query}
                onChange={handleChange}
                placeholder="e.g., Wireless Noise-Cancelling Headphones"
                required
                className="input-field pl-9 text-sm"
                autoFocus
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
            </div>

            {/* Suggestions Chips (Improves User Flow) */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-500 font-mono">Suggestions:</span>
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setForm((prev) => ({ ...prev, query: sq }))}
                  className="text-[11px] px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer font-sans"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace / Region */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="input-label">Target Marketplace</label>
              <span className="text-[11px] font-mono text-neutral-400">Currency: {selectedCountry.currency}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COUNTRIES.map((c) => {
                const selected = form.country === c.code;
                return (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => setForm((prev) => ({ ...prev, country: c.code }))}
                    className={`p-2.5 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between ${
                      selected
                        ? 'bg-white/[0.08] border-white/30 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-white">{c.name}</p>
                      <p className="text-[10px] font-mono text-neutral-500">{c.currency}</p>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-400">
                      {c.flag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter (Optional) */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="input-label">Price Bracket Filter ({selectedCountry.currency})</label>
              <span className="text-[11px] font-mono text-neutral-500">OPTIONAL</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  id="min-price"
                  name="minPrice"
                  type="number"
                  min="0"
                  step="any"
                  value={form.minPrice}
                  onChange={handleChange}
                  placeholder={`Min price (${selectedCountry.currency})`}
                  className="input-field text-xs font-mono"
                />
              </div>
              <div>
                <input
                  id="max-price"
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="any"
                  value={form.maxPrice}
                  onChange={handleChange}
                  placeholder={`Max price (${selectedCountry.currency})`}
                  className="input-field text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md text-xs font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action (NO COLOR FILL, NO PILL SHAPE) */}
          <div className="pt-2">
            <button
              id="analyze-market-button"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-semibold uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Initiating SerpApi Engine…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Execute Market Intelligence Scan
                </>
              )}
            </button>
            <p className="text-[11px] text-neutral-500 text-center mt-2 font-mono">
              Searches live Google Shopping results · Aggregates merchants & pricing
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
