import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data.report);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleCopyMarkdown = () => {
    if (!report) return;
    const md = `# ${report.title}
Market: ${report.metadata?.country?.toUpperCase() || 'Global'}
Generated: ${new Date(report.createdAt).toLocaleString()}

## Executive Summary
${report.executiveSummary || ''}

## Market Overview
${report.marketOverview || ''}

## Competition Analysis
${report.competitionAnalysis || ''}

## Pricing Analysis
${report.pricingAnalysis || ''}

## Trend Intelligence
${report.trendAnalysis || ''}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400">
        <LoadingSpinner size="lg" />
        <span className="text-xs font-mono mt-4 text-neutral-500">Compiling intelligence report…</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="card-panel p-8 text-center max-w-xl mx-auto my-12">
        <h2 className="text-base font-semibold text-white mb-2">Report Compilation Error</h2>
        <p className="text-xs text-neutral-400 mb-4">{error || 'Report could not be retrieved.'}</p>
        <Link to="/reports" className="btn-secondary text-xs">Return to Reports</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center justify-between gap-4 mb-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors no-underline"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            BACK_TO_REPORTS
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="btn-secondary text-xs px-2.5 py-1"
            >
              {copied ? 'Copied Markdown ✓' : 'Copy Briefing'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary text-xs px-2.5 py-1"
            >
              Print / Export PDF
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          {report.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300 uppercase">
            {report.metadata?.country || 'GLOBAL'} MARKET
          </span>
          <span>·</span>
          <span>{report.metadata?.totalProducts || 0} products sampled</span>
          <span>·</span>
          <span>Synthesized {new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {report.executiveSummary && (
          <ReportSection title="Executive Summary" tag="KEY_FINDINGS">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{report.executiveSummary}</p>
          </ReportSection>
        )}

        {report.marketOverview && (
          <ReportSection title="Market Landscape & Dynamics" tag="LANDSCAPE">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{report.marketOverview}</p>
          </ReportSection>
        )}

        {report.competitionAnalysis && (
          <ReportSection title="Competitive Structure & Merchant Distribution" tag="COMPETITION">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{report.competitionAnalysis}</p>
          </ReportSection>
        )}

        {report.pricingAnalysis && (
          <ReportSection title="Price Elasticity & Positioning Strategy" tag="PRICING">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{report.pricingAnalysis}</p>
          </ReportSection>
        )}

        {report.trendAnalysis && (
          <ReportSection title="Category Trends & Consumer Sentiments" tag="TRENDS">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{report.trendAnalysis}</p>
          </ReportSection>
        )}

        {report.opportunitySignals && report.opportunitySignals.length > 0 && (
          <ReportSection title="Commercial Opportunity Signals" tag="OPPORTUNITIES">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {report.opportunitySignals.map((opp, i) => (
                <div key={i} className="p-3.5 rounded bg-white/[0.02] border border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-white mb-1">{opp.title}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">{opp.description}</p>
                  {opp.evidence && (
                    <p className="text-[11px] text-neutral-500 font-mono mt-2 pt-2 border-t border-white/[0.04]">
                      Evidence: {opp.evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {report.risks && report.risks.length > 0 && (
          <ReportSection title="Risk Factors & Structural Headwinds" tag="RISK_FACTORS">
            <ul className="space-y-2 mt-2">
              {report.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-300 p-2.5 rounded bg-rose-500/[0.03] border border-rose-500/10">
                  <span className="text-rose-400 font-mono font-bold">!</span>
                  <span>{typeof risk === 'string' ? risk : risk.description || risk.title}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {report.keyObservations && report.keyObservations.length > 0 && (
          <ReportSection title="Strategic Recommendations & Next Steps" tag="ACTION_ITEMS">
            <ul className="space-y-2 mt-2">
              {report.keyObservations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-300 p-2.5 rounded bg-emerald-500/[0.03] border border-emerald-500/10">
                  <span className="text-emerald-400 font-mono font-bold">→</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {report.limitations && report.limitations.length > 0 && (
          <div className="card-panel p-4 text-[11px] text-neutral-500 font-mono border-dashed">
            <span className="font-semibold text-neutral-400 uppercase block mb-1">Methodology & Sampling Scope:</span>
            <ul className="list-disc pl-4 space-y-1">
              {report.limitations.map((lim, i) => (
                <li key={i}>{typeof lim === 'string' ? lim : lim.description || JSON.stringify(lim)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportSection({ title, tag, children }) {
  return (
    <div className="card-panel p-5">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
        {tag && <span className="text-[10px] font-mono text-neutral-500 tracking-wider uppercase">{tag}</span>}
      </div>
      {children}
    </div>
  );
}
