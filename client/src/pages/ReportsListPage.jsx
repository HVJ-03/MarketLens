import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data.reports || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400">
        <LoadingSpinner size="lg" />
        <span className="text-xs font-mono mt-4 text-neutral-500">Loading intelligence archive…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>INTELLIGENCE</span>
            <span>/</span>
            <span className="text-white">REPORTS_ARCHIVE</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Market Intelligence Reports
          </h1>
          <p className="text-xs text-neutral-400">
            Synthesized commercial assessments and category viability studies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/new-scan" className="btn-primary text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Scan
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {reports.length > 0 && (
        <div className="relative max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by product…"
            className="input-field pl-9 text-xs"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="card-panel p-12 text-center">
          <div className="w-10 h-10 rounded-md bg-white/[0.05] border border-white/10 mx-auto flex items-center justify-center text-neutral-400 mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white mb-1">
            {reports.length === 0 ? 'No intelligence reports generated yet' : 'No matching reports found'}
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
            {reports.length === 0
              ? 'Run a market scan and click "Generate Full AI Report" to create an in-depth viability study.'
              : 'Try searching with different keywords.'}
          </p>
          <Link to="/new-scan" className="btn-primary text-xs inline-flex">
            Start a Market Scan
          </Link>
        </div>
      ) : (
        <div className="card-panel overflow-hidden divide-y divide-white/[0.06]">
          {filteredReports.map((report) => (
            <Link
              key={report._id}
              to={`/reports/${report._id}`}
              className="p-4 flex items-center justify-between no-underline block hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-white/[0.04] border border-white/10 flex items-center justify-center text-neutral-400 shrink-0 mt-0.5 group-hover:text-white group-hover:border-white/20 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white group-hover:text-neutral-200 transition-colors">
                    {report.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <span className="font-mono text-[10px] uppercase text-neutral-300 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/10">
                      {report.metadata?.country || 'GLOBAL'}
                    </span>
                    <span>·</span>
                    <span>{report.metadata?.totalProducts || 0} products sampled</span>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-neutral-500">
                      {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 group-hover:text-white transition-colors">
                <span className="hidden sm:inline">View Briefing</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
