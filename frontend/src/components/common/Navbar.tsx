import React from 'react';
import { Flame, Activity, ShieldCheck, Database, RefreshCw, Layers } from 'lucide-react';
import { Well } from '../../types';

interface NavbarProps {
  wells: Well[];
  selectedWell: Well | null;
  onSelectWell: (well: Well) => void;
  isLive: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  wells,
  selectedWell,
  onSelectWell,
  isLive,
  onRefresh,
  loading,
}) => {
  return (
    <header className="h-16 bg-[#0c1527]/90 backdrop-blur-md border-b border-[#1f345e] px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-wider text-white font-mono">
              PETRO<span className="text-cyan-400">-TWIN</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded">
              SIH RESEARCH PROTOTYPE
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            AI-Enabled Well-to-Surface Digital Twin | CSS + SRP Optimization
          </p>
        </div>
      </div>

      {/* Center / Well Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-[#111d35] border border-[#1f345e] rounded-lg px-3 py-1.5 space-x-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Active Well:</span>
          <select
            className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer"
            value={selectedWell?.id || ''}
            onChange={(e) => {
              const w = wells.find((item) => item.id === e.target.value);
              if (w) onSelectWell(w);
            }}
          >
            {wells.map((w) => (
              <option key={w.id} value={w.id} className="bg-[#0c1527] text-white">
                {w.name} ({w.api_gravity}° API)
              </option>
            ))}
          </select>
        </div>

        {/* Live Status Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#111d35] border border-[#1f345e]">
          <span className="relative flex h-2.5 w-2.5">
            {isLive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            )}
          </span>
          <span className="text-xs font-mono font-medium text-slate-300">
            {isLive ? 'LIVE TELEMETRY' : 'STATIC DB MODE'}
          </span>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-[#111d35] hover:bg-[#162544] border border-[#1f345e] text-slate-300 hover:text-white transition-all disabled:opacity-50"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-400 bg-[#070d18] px-3 py-1.5 rounded border border-[#1f345e]">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Baghewala Context</span>
        </div>
      </div>
    </header>
  );
};
