import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { WhatIfResponse } from '../types';
import { DynoCardCanvas } from '../components/dynamometer/DynoCardCanvas';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Droplets,
  Zap,
  Flame,
  Activity
} from 'lucide-react';
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

interface WhatIfSimulatorViewProps {
  initialParams?: any;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({ initialParams }) => {
  // Scenario Parameters
  const [steamVolume, setSteamVolume] = useState<number>(initialParams?.steam_volume_tonnes || 2500);
  const [steamPressure, setSteamPressure] = useState<number>(65);
  const [soakDays, setSoakDays] = useState<number>(initialParams?.soak_days || 6);
  const [strokeLength, setStrokeLength] = useState<number>(initialParams?.stroke_length_in || 120);
  const [spm, setSpm] = useState<number>(initialParams?.spm || 5.8);
  const [cycleDays, setCycleDays] = useState<number>(90);

  // Baseline Comparison Reference
  const [baseSteam] = useState<number>(2200);
  const [baseStroke] = useState<number>(100);
  const [baseSpm] = useState<number>(6.5);

  const [simResult, setSimResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function executeSimulation() {
    try {
      setLoading(true);
      const res = await api.runWhatIfSimulation({
        steam_volume_tonnes: steamVolume,
        steam_pressure_bar: steamPressure,
        soak_days: soakDays,
        stroke_length_in: strokeLength,
        spm: spm,
        cycle_duration_days: cycleDays,
        baseline_steam_volume: baseSteam,
        baseline_spm: baseSpm,
        baseline_stroke_length: baseStroke,
      });
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    executeSimulation();
  }, [steamVolume, steamPressure, soakDays, strokeLength, spm, cycleDays]);

  function resetToDefaults() {
    setSteamVolume(2200);
    setSteamPressure(65);
    setSoakDays(7);
    setStrokeLength(100);
    setSpm(6.5);
    setCycleDays(90);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>INTERACTIVE WHAT-IF DIGITAL TWIN SIMULATOR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Coupled reservoir thermal response, wellbore heat loss, and SRP rod mechanics simulation with real-time delta KPIs.
          </p>
        </div>

        <button
          onClick={resetToDefaults}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#111d35] hover:bg-[#162544] border border-[#1f345e] text-slate-300 hover:text-white text-xs font-mono transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Baseline Settings</span>
        </button>
      </div>

      {/* Control Sliders Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-4">
        <div className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-wider">
          Operating Decision Variables (CSS + SRP)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-mono">
          {/* Steam Volume */}
          <div className="space-y-1.5 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Steam Volume (t):</span>
              </span>
              <span className="text-cyan-400 font-bold">{steamVolume} tonnes</span>
            </div>
            <input
              type="range"
              min="1000"
              max="3500"
              step="100"
              value={steamVolume}
              onChange={(e) => setSteamVolume(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1,000 t</span>
              <span>Baseline: 2,200 t</span>
              <span>3,500 t</span>
            </div>
          </div>

          {/* Soak Days */}
          <div className="space-y-1.5 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Soak Duration (Days):</span>
              </span>
              <span className="text-amber-400 font-bold">{soakDays} days</span>
            </div>
            <input
              type="range"
              min="2"
              max="14"
              step="1"
              value={soakDays}
              onChange={(e) => setSoakDays(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>2 Days</span>
              <span>Baseline: 7 Days</span>
              <span>14 Days</span>
            </div>
          </div>

          {/* Steam Pressure */}
          <div className="space-y-1.5 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Steam Pressure (bar):</span>
              </span>
              <span className="text-purple-400 font-bold">{steamPressure} bar</span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              step="1"
              value={steamPressure}
              onChange={(e) => setSteamPressure(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>50 bar</span>
              <span>Safety Limit: 80 bar</span>
              <span>85 bar</span>
            </div>
          </div>

          {/* Stroke Length */}
          <div className="space-y-1.5 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>SRP Stroke Length (in):</span>
              </span>
              <span className="text-cyan-400 font-bold">{strokeLength} inches</span>
            </div>
            <input
              type="range"
              min="64"
              max="144"
              step="6"
              value={strokeLength}
              onChange={(e) => setStrokeLength(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>64 in</span>
              <span>Baseline: 100 in</span>
              <span>144 in</span>
            </div>
          </div>

          {/* SPM */}
          <div className="space-y-1.5 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pumping Speed (SPM):</span>
              </span>
              <span className="text-cyan-400 font-bold">{spm} SPM</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="11.0"
              step="0.2"
              value={spm}
              onChange={(e) => setSpm(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>2.0 SPM</span>
              <span>Baseline: 6.5 SPM</span>
              <span>11.0 SPM</span>
            </div>
          </div>

          {/* Cycle Duration */}
          <div className="space-y-1.5 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cycle Horizon (Days):</span>
              </span>
              <span className="text-emerald-400 font-bold">{cycleDays} days</span>
            </div>
            <input
              type="range"
              min="30"
              max="180"
              step="15"
              value={cycleDays}
              onChange={(e) => setCycleDays(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>30 Days</span>
              <span>Standard: 90 Days</span>
              <span>180 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Delta Cards */}
      {simResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Scenario Cumulative Oil</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
              {simResult.scenario_summary.cumulative_oil_bbl.toLocaleString()} <span className="text-xs text-slate-400">bbl</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono mt-1 block">
              {simResult.delta_comparison.cumulative_oil_gain_bbl > 0 ? '+' : ''}
              {simResult.delta_comparison.cumulative_oil_gain_bbl.toLocaleString()} bbl ({simResult.delta_comparison.cumulative_oil_gain_pct}%) vs Base
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Steam-to-Oil Ratio (SOR)</span>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {simResult.scenario_summary.steam_to_oil_ratio}
            </div>
            <span
              className={`text-xs font-mono mt-1 block ${
                simResult.delta_comparison.sor_delta < 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {simResult.delta_comparison.sor_delta > 0 ? '+' : ''}
              {simResult.delta_comparison.sor_delta} delta
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-emerald-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Energy Efficiency</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {simResult.scenario_summary.average_energy_kwh_per_bbl} <span className="text-xs text-slate-400">kWh/bbl</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono mt-1 block">
              {simResult.delta_comparison.energy_saving_pct}% saving vs baseline
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-purple-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Safety Gate Audit</span>
            <div className="text-2xl font-bold text-white font-mono mt-1 flex items-center space-x-2">
              <span
                className={`text-lg font-bold px-2 py-0.5 rounded ${
                  simResult.safety_audit.is_safe
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                }`}
              >
                {simResult.safety_audit.risk_level} RISK
              </span>
              <span className="text-xs text-slate-400">({simResult.safety_audit.safety_score}%)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block truncate">
              {simResult.safety_audit.violations.length > 0
                ? simResult.safety_audit.violations[0]
                : 'All engineering constraints satisfied'}
            </span>
          </div>
        </div>
      )}

      {/* Trajectory & Scenario Dynamometer Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Graph */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-[#1f345e]">
          <div className="pb-3 border-b border-[#1f345e] mb-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>SIMULATED MULTI-VARIABLE CYCLE TRAJECTORY</span>
            </h3>
            <p className="text-xs text-slate-400">
              Daily time-stepped simulation of reservoir cooling, oil inflow, and dynamic polished rod loads.
            </p>
          </div>

          <div className="h-72 w-full">
            {simResult && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simResult.daily_trajectory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162544" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Cycle Day', position: 'insideBottom', offset: -2, fill: '#64748b' }} />
                  <YAxis yAxisId="left" stroke="#06b6d4" tick={{ fontSize: 11 }} label={{ value: 'Oil Rate (bpd)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0c1527', borderColor: '#1f345e', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="oil_rate_bpd" name="Scenario Oil Rate (bpd)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="reservoir_temp_c" name="Reservoir Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="viscosity_cp" name="Viscosity (cP)" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dynamometer Card Generated for this Scenario */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] flex flex-col items-center justify-between">
          <div className="w-full pb-3 border-b border-[#1f345e] mb-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>SCENARIO DYNAMOMETER CARD</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kinematic card generated at day 30 for this configuration.
            </p>
          </div>

          {simResult?.dynamometer_card ? (
            <DynoCardCanvas
              cardData={simResult.dynamometer_card}
              rodRatingLbs={28000}
              width={340}
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
              Simulating Dynamometer loop...
            </div>
          )}

          <div className="w-full pt-2 border-t border-[#1f345e] text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Rod Load: <strong>{simResult?.scenario_summary.max_rod_load_pct}%</strong></span>
            <span>Floating: <strong className={simResult?.scenario_summary.is_rod_floating_detected ? 'text-rose-400' : 'text-emerald-400'}>
              {simResult?.scenario_summary.is_rod_floating_detected ? 'YES' : 'NO'}
            </strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
