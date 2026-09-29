import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
          <span>SETTINGS</span>
          <span>/</span>
          <span className="text-white">ACCOUNT</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Account & Environment
        </h1>
        <p className="text-xs text-neutral-400">
          Identity management and active commerce data connections.
        </p>
      </div>

      <div className="card-panel p-6 space-y-6">
        {/* User Identity Banner */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08]">
          <div className="w-12 h-12 rounded-md bg-white/[0.08] border border-white/20 flex items-center justify-center text-base font-semibold text-white font-mono">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {user?.displayName || 'Authorized User'}
            </p>
            <p className="text-xs font-mono text-neutral-400">{user?.email}</p>
          </div>
        </div>

        {/* Credentials & Details Table */}
        <div className="space-y-3">
          <InfoRow label="DISPLAY NAME" value={user?.displayName || 'Not specified'} />
          <InfoRow label="EMAIL ADDRESS" value={user?.email || '—'} mono />
          <InfoRow label="AUTHENTICATION PROVIDER" value="Firebase Auth (Email / Identity Toolkit)" mono />
          <InfoRow label="SESSION ID / UID" value={user?.uid ? `${user.uid.slice(0, 16)}…` : '—'} mono />
          <InfoRow
            label="CREATED TIMESTAMP"
            value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : '—'}
            mono
          />
        </div>

        {/* System Telemetry */}
        <div className="pt-4 border-t border-white/[0.08]">
          <span className="text-[11px] font-mono uppercase text-neutral-400 block mb-2">Connected Infrastructure</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span className="text-neutral-400">Search Engine:</span>
              <span className="text-emerald-400">SerpApi Live</span>
            </div>
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span className="text-neutral-400">Database:</span>
              <span className="text-emerald-400">MongoDB Ready</span>
            </div>
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-mono">Session terminates on sign out</span>
          <button
            id="profile-logout-button"
            onClick={handleLogout}
            className="btn-secondary text-xs text-rose-400 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer"
          >
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/[0.04] text-xs gap-1">
      <span className="text-neutral-500 font-mono text-[11px]">{label}</span>
      <span className={`text-neutral-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
