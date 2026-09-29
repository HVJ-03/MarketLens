import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useState, useRef, useEffect } from 'react';

const REGIONS = [
  { code: 'in', label: 'India', flag: '🇮🇳', currency: '₹' },
  { code: 'us', label: 'United States', flag: '🇺🇸', currency: '$' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧', currency: '£' },
  { code: 'de', label: 'Germany', flag: '🇩🇪', currency: '€' },
  { code: 'jp', label: 'Japan', flag: '🇯🇵', currency: '¥' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null); // 'intelligence' | 'reports' | 'regions' | 'user' | null
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleSelectRegion = (r) => {
    setSelectedRegion(r);
    setActiveDropdown(null);
    navigate(`/new-scan?c=${r.code}`);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav ref={navRef} className="sticky top-0 z-50 bg-[#090a0d]/92 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 no-underline group">
              <div className="w-7 h-7 rounded-md bg-white/[0.08] border border-white/15 flex items-center justify-center text-white transition-colors group-hover:border-white/30 group-hover:bg-white/10">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-4.35-4.35" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">MarketLens</span>
              </div>
            </Link>

            {/* Desktop Navigation with Structured Dropdowns */}
            <div className="hidden md:flex items-center gap-1 pl-4 border-l border-white/[0.08]">
              {/* Dashboard Link */}
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md text-xs font-medium no-underline transition-all ${
                  isActive('/dashboard')
                    ? 'bg-white/[0.08] text-white border border-white/15'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Dashboard
              </Link>

              {/* 1. Intelligence Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('intelligence')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    activeDropdown === 'intelligence' || isActive('/new-scan') || location.pathname.startsWith('/scan/')
                      ? 'bg-white/[0.08] text-white border border-white/15'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>Intelligence</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-200 ${activeDropdown === 'intelligence' ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === 'intelligence' && (
                  <div className="absolute left-0 mt-2 w-72 p-2 rounded-md bg-[#0e1117] border border-white/15 shadow-2xl z-50 animate-fade-in space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      Commercial Analysis Tools
                    </div>
                    <Link
                      to="/new-scan"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-start gap-3 p-2 rounded hover:bg-white/[0.05] no-underline group transition-colors"
                    >
                      <div className="w-7 h-7 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white mt-0.5 shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-neutral-200">New Market Scan</p>
                        <p className="text-[11px] text-neutral-400">Harvest live Google Shopping data & pricing</p>
                      </div>
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-start gap-3 p-2 rounded hover:bg-white/[0.05] no-underline group transition-colors"
                    >
                      <div className="w-7 h-7 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white mt-0.5 shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-neutral-200">Merchant Concentration</p>
                        <p className="text-[11px] text-neutral-400">Track dominant retail storefronts & share-of-voice</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Reports Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('reports')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    activeDropdown === 'reports' || isActive('/reports') || location.pathname.startsWith('/reports/')
                      ? 'bg-white/[0.08] text-white border border-white/15'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>Reports</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-200 ${activeDropdown === 'reports' ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === 'reports' && (
                  <div className="absolute left-0 mt-2 w-72 p-2 rounded-md bg-[#0e1117] border border-white/15 shadow-2xl z-50 animate-fade-in space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      Synthesized Briefings
                    </div>
                    <Link
                      to="/reports"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-start gap-3 p-2 rounded hover:bg-white/[0.05] no-underline group transition-colors"
                    >
                      <div className="w-7 h-7 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white mt-0.5 shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-neutral-200">Intelligence Archive</p>
                        <p className="text-[11px] text-neutral-400">View executive summaries and pricing studies</p>
                      </div>
                    </Link>

                    <div className="p-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span>Export Formats:</span>
                      <span className="text-neutral-400">Markdown · PDF Print</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Marketplace Region Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('regions')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    activeDropdown === 'regions'
                      ? 'bg-white/[0.08] text-white border border-white/15'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="font-mono text-[11px] text-neutral-300">{selectedRegion.flag} {selectedRegion.label}</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-200 ${activeDropdown === 'regions' ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === 'regions' && (
                  <div className="absolute left-0 mt-2 w-56 p-1.5 rounded-md bg-[#0e1117] border border-white/15 shadow-2xl z-50 animate-fade-in space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      Select Marketplace Target
                    </div>
                    {REGIONS.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => handleSelectRegion(r)}
                        className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                          selectedRegion.code === r.code
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{r.flag}</span>
                          <span>{r.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500">{r.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/new-scan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 border border-white rounded-md transition-all no-underline shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Scan
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="user-menu-button"
                onClick={() => toggleDropdown('user')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs text-neutral-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded bg-white/10 border border-white/15 flex items-center justify-center text-[10px] font-semibold text-white font-mono">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline font-mono text-[11px] text-neutral-300">
                  {user?.displayName || user?.email?.split('@')[0] || 'account'}
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform duration-200 ${activeDropdown === 'user' ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {activeDropdown === 'user' && (
                <div className="absolute right-0 mt-2 w-52 py-1 rounded-md bg-[#0e1117] border border-white/15 shadow-2xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-white/[0.08]">
                    <p className="text-xs font-medium text-white truncate">{user?.displayName || 'User'}</p>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] no-underline"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 1 0-16 0" />
                    </svg>
                    Account Settings
                  </Link>
                  <Link
                    to="/reports"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] no-underline"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    All Reports
                  </Link>

                  <div className="border-t border-white/[0.08] my-1" />

                  <button
                    id="logout-button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer bg-transparent border-none font-inherit transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Expandable Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-white/[0.08] space-y-2">
            <Link
              to="/dashboard"
              className="block px-3 py-1.5 rounded text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] no-underline"
            >
              Dashboard
            </Link>
            <Link
              to="/new-scan"
              className="block px-3 py-1.5 rounded text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] no-underline"
            >
              New Scan
            </Link>
            <Link
              to="/reports"
              className="block px-3 py-1.5 rounded text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] no-underline"
            >
              Intelligence Reports
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-1.5 rounded text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] no-underline"
            >
              Account
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
