import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, Gauge, Zap, AlertTriangle, CheckCircle, ShieldAlert, Sliders } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SRPMonitoringViewProps {
  wellId: string;
}

export const SRPMonitoringView: React.FC<SRPMonitoringViewProps> = ({ wellId }) => {
  const [srpStatus, setSrpStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [status, hist] = await Promise.all([
          api.getSRPStatus(wellId),
          api.getHistoricalTelemetry(wellId, 45),
        ]);
        setSrpStatus(status);
        setHistory(hist.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [wellId]);

  if (!srpStatus) {
    return <div className="p-8 text-center text-slate-400 font-mono">Loading SRP mechanical telemetry...</div>;
  }

  const { active_diagnostics } = srpStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>SUCKER ROD PUMP (SRP) MONITORING & DYNAMICS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Polished rod loading, heavy-oil viscous drag, rod floating risk, and electric motor power telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
              srpStatus.health_status === 'OPTIMAL'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-950 text-rose-400 border-rose-500/40'
            }`}
          >
            PUMP HEALTH: {srpStatus.health_status}
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Pumping Speed & Stroke</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {srpStatus.spm} <span className="text-xs text-slate-400">SPM</span> / {srpStatus.stroke_length_in}"
          </div>
          <span className="text-xs text-cyan-400 font-mono mt-1 block">
            VFD Frequency: {srpStatus.vfd_frequency_hz} Hz
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-blue-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Peak Polished Rod Load</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
            {srpStatus.pprl_lbs.toLocaleString()} <span className="text-xs text-slate-400">lbs</span>
          </div>
          <span className="text-xs text-slate-300 font-mono mt-1 block">
            {srpStatus.rod_load_pct}% of Rod Rating ({srpStatus.rod_rating_lbs.toLocaleString()} lbs)
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Min Polished Rod Load</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${srpStatus.mprl_lbs < 2000 ? 'text-rose-400' : 'text-amber-400'}`}>
            {srpStatus.mprl_lbs.toLocaleString()} <span className="text-xs text-slate-400">lbs</span>
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Rod Floating Threshold: 2,000 lbs
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Pump Volumetric Fillage</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {srpStatus.pump_fillage_pct} %
          </div>
          <span className="text-xs text-slate-300 font-mono mt-1 block">
            Motor Power: {srpStatus.motor_power_kw} kW ({srpStatus.energy_kwh_per_bbl} kWh/bbl)
          </span>
        </div>
      </div>

      {/* Diagnostics Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-mono ${
            active_diagnostics.rod_floating_risk
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
          }`}
        >
          {active_diagnostics.rod_floating_risk ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="font-bold">Rod Floating Risk</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {active_diagnostics.rod_floating_risk ? 'Active: Downstroke drag high' : 'Clear: Sufficient downward rod tension'}
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-mono ${
            active_diagnostics.mechanical_overload_risk
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
          }`}
        >
          {active_diagnostics.mechanical_overload_risk ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="font-bold">Mechanical Overload</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {active_diagnostics.mechanical_overload_risk ? 'Warning: Rod stress > 90%' : 'Clear: Operating within API safe stress'}
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-mono ${
            active_diagnostics.fluid_pound_risk
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
          }`}
        >
          {active_diagnostics.fluid_pound_risk ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="font-bold">Fluid Pound Severity</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {active_diagnostics.fluid_pound_risk ? 'Incomplete pump fillage (<65%)' : 'Nominal barrel fillage'}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Rod Loading History Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f345e]">
        <div className="pb-3 border-b border-[#1f345e] mb-4">
          <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>DYNAMIC POLISHED ROD LOAD (PPRL vs MPRL) & PUMP FILLAGE TREND</span>
          </h3>
          <p className="text-xs text-slate-400">
            Evolution of peak and minimum loads as heavy-oil reservoir cooling increases fluid shear drag.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162544" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Cycle Day', position: 'insideBottom', offset: -2, fill: '#64748b' }} />
              <YAxis yAxisId="left" stroke="#06b6d4" tick={{ fontSize: 11 }} label={{ value: 'Load (lbs)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} label={{ value: 'Fillage (%)', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0c1527', borderColor: '#1f345e', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="pprl_lbs" name="PPRL (Peak Load)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="mprl_lbs" name="MPRL (Min Load)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="pump_fillage_pct" name="Pump Fillage (%)" stroke="#10b981" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
