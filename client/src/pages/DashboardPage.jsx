import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const TRENDING_QUICK_SCANS = [
  { label: 'Ergonomic Desk Chair', country: 'us' },
  { label: 'Minimalist Titanium Watch', country: 'us' },
  { label: 'Ceramic Pour-Over Coffee Dripper', country: 'in' },
  { label: 'Noise Cancelling Wireless Earbuds', country: 'in' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ scans: 0, products: 0, reports: 0 });
  const [recentScans, setRecentScans] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'products'
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const scansRes = await api.get('/scans');
        const scans = scansRes.data.scans || [];
        setRecentScans(scans);
        setStats({
          scans: scans.length,
          products: scans.reduce((sum, s) => sum + (s.scanResults?.totalProducts || 0), 0),
          reports: scans.filter((s) => s.status === 'completed').length,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleQuickScan = (query, country) => {
    navigate(`/new-scan?q=${encodeURIComponent(query)}&c=${country}`);
  };

  const filteredScans = recentScans
    .filter((s) => {
      if (filter === 'completed') return s.status === 'completed';
      if (filter === 'in-progress') return ['pending', 'searching', 'analyzing'].includes(s.status);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'products') {
        const countA = a.scanResults?.totalProducts || 0;
        const countB = b.scanResults?.totalProducts || 0;
        return countB - countA;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400">
        <LoadingSpinner size="lg" />
        <span className="text-xs font-mono mt-4 text-neutral-500">Loading intelligence data…</span>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Market Intelligence Dashboard
            </h1>
            <span className="text-xs font-mono text-neutral-500">v1.2</span>
          </div>
          <p className="text-xs text-neutral-400">
            Welcome back, <span className="text-neutral-200 font-medium">{displayName}</span>. Live tracking active for global commerce queries.
          </p>
        </div>
      </div>

      {/* Quick Launch Query Templates Bar (Improves User Flow) */}
      <div className="card-panel p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Trending Scans:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TRENDING_QUICK_SCANS.map((item, i) => (
            <button
              key={i}
              onClick={() => handleQuickScan(item.label, item.country)}
              className="text-xs px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/10 hover:border-white/20 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <span>{item.label}</span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">{item.country}</span>
            </button>
          ))}
        </div>
      </div>

      {/* High-Precision KPI Metric Grid with Enhanced 3D Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-panel p-5 card-interactive">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Markets Scanned</span>
            <div className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{stats.scans}</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Active
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Queries executed through SerpApi</p>
        </div>

        <div className="card-panel p-5 card-interactive">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Products Tracked</span>
            <div className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{stats.products.toLocaleString()}</span>
            <span className="text-xs font-mono text-neutral-400">catalog items</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Extracted pricing & competitor listings</p>
        </div>

        <div className="card-panel p-5 card-interactive">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Completed Reports</span>
            <div className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{stats.reports}</span>
            <span className="text-xs font-mono text-neutral-400">generated</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Evidence-backed AI syntheses</p>
        </div>
      </div>

      {/* Recent Scans Section with Dropdown Filter & Sort Menu */}
      <div className="card-panel overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Recent Market Scans</h2>
            <p className="text-xs text-neutral-400">Real-time status of commercial searches and generated reports</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Status Filters */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/10 rounded-md">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({recentScans.length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  filter === 'completed'
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Completed ({recentScans.filter((s) => s.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  filter === 'in-progress'
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                In Progress
              </button>
            </div>

            {/* Sort Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/10 text-xs text-neutral-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M6 12h12M10 18h4" />
                </svg>
                <span className="font-mono text-[11px]">
                  {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Product Count'}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {sortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 p-1.5 rounded-md bg-[#0e1117] border border-white/15 shadow-2xl z-40 animate-fade-in space-y-1">
                    <button
                      type="button"
                      onClick={() => { setSortBy('newest'); setSortDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                        sortBy === 'newest' ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('oldest'); setSortDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                        sortBy === 'oldest' ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Oldest First
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('products'); setSortDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                        sortBy === 'products' ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      Highest Product Count
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scans List with Enhanced Hover Effects */}
        {filteredScans.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-md bg-white/[0.05] border border-white/10 mx-auto flex items-center justify-center text-neutral-400 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">No market scans found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
              Enter any e-commerce product or category to analyze live pricing, competitor density, and market gaps.
            </p>
            <Link to="/new-scan" className="btn-primary text-xs inline-flex">
              Run Your First Scan
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredScans.map((scan) => (
              <div
                key={scan._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-all duration-200 group border-l-2 border-l-transparent hover:border-l-white/60"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white/[0.04] border border-white/10 flex items-center justify-center text-neutral-400 shrink-0 mt-0.5 group-hover:text-white group-hover:border-white/25 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div>
                    <Link
                      to={`/scan/${scan._id}`}
                      className="text-sm font-medium text-white group-hover:text-neutral-200 no-underline transition-colors flex items-center gap-1.5"
                    >
                      <span>{scan.query}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <path d="M7 17l9.2-9.2M17 17V8H8" />
                      </svg>
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                      <span className="font-mono uppercase text-neutral-300 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/10 text-[10px]">
                        {scan.country || 'IN'}
                      </span>
                      <span>·</span>
                      <span>{scan.scanResults?.totalProducts ? `${scan.scanResults.totalProducts} items` : 'Extracting data'}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        {new Date(scan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <StatusBadge status={scan.status} />
                  <Link
                    to={`/scan/${scan._id}`}
                    className="btn-secondary text-xs px-2.5 py-1"
                  >
                    Open Intelligence
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    pending: { label: 'PENDING', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    searching: { label: 'SEARCHING', class: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    analyzing: { label: 'ANALYZING', class: 'text-neutral-300 bg-white/10 border-white/20' },
    completed: { label: 'COMPLETED', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    failed: { label: 'FAILED', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  };

  const current = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${current.class}`}>
      {status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
      {['pending', 'searching', 'analyzing'].includes(status) && (
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-led" />
      )}
      {current.label}
    </span>
  );
}
