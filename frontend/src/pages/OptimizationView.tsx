import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { OptimizationResponse, ParetoSolution } from '../types';
import { Target, Play, Sparkles, ShieldCheck, CheckCircle, TrendingUp, Layers, Sliders } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

interface OptimizationViewProps {
  onApplyToSimulator?: (params: any) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({ onApplyToSimulator }) => {
  const [optData, setOptData] = useState<OptimizationResponse | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<ParetoSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [popSize, setPopSize] = useState<number>(25);

  async function runOptimization() {
    try {
      setLoading(true);
      const res = await api.runOptimization(popSize, 5);
      setOptData(res);
      setSelectedSolution(res.recommended_optimal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runOptimization();
  }, []);

  const paretoScatterData = (optData?.pareto_solutions || []).map((sol, idx) => ({
    id: idx + 1,
    oil: round(sol.objectives.cumulative_oil_bbl, 1),
    sor: round(sol.objectives.steam_to_oil_ratio, 2),
    energy: round(sol.objectives.energy_kwh_per_bbl, 2),
    risk: round(sol.objectives.risk_score, 1),
    utility: sol.utility_score || 85,
    params: sol.params,
    raw: sol,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Optimizer Launcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span>CONSTRAINED MULTI-OBJECTIVE OPTIMIZATION (NSGA-II)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pareto-optimal trade-offs: Max Cumulative Oil vs Min SOR vs Min kWh/bbl vs Min Mechanical Risk.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#111d35] px-3 py-1.5 rounded-lg border border-[#1f345e] text-xs font-mono">
            <span className="text-slate-400">Pop Size:</span>
            <select
              value={popSize}
              onChange={(e) => setPopSize(Number(e.target.value))}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value={15} className="bg-[#0c1527]">15 Samples (Fast)</option>
              <option value={25} className="bg-[#0c1527]">25 Samples (Balanced)</option>
              <option value={40} className="bg-[#0c1527]">40 Samples (Deep)</option>
            </select>
          </div>

          <button
            onClick={runOptimization}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Optimizing Frontier...' : 'Execute NSGA-II Search'}</span>
          </button>
        </div>
      </div>

      {/* Improvement Metrics Cards */}
      {optData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Cumulative Oil Gain</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
              +{optData.improvement_metrics.oil_production_gain_pct}%
            </div>
            <span className="text-[11px] text-slate-300 font-mono mt-1 block">
              Over unoptimized baseline
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-emerald-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">SOR Reduction</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {optData.improvement_metrics.sor_reduction_pct}%
            </div>
            <span className="text-[11px] text-slate-300 font-mono mt-1 block">
              Less steam per barrel produced
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Specific Energy Delta</span>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {optData.improvement_metrics.energy_saving_pct}%
            </div>
            <span className="text-[11px] text-slate-300 font-mono mt-1 block">
              Optimized motor stroke efficiency
            </span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-purple-500/20">
            <span className="text-xs text-slate-400 uppercase font-mono">Mechanical Risk Score</span>
            <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
              {optData.recommended_optimal.objectives.risk_score} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
              Safety Score: {optData.recommended_optimal.safety.safety_score}%
            </span>
          </div>
        </div>
      )}

      {/* Pareto Scatter Plot & Best Solution Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto Frontier Scatter Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-[#1f345e]">
          <div className="pb-3 border-b border-[#1f345e] mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>PARETO-OPTIMAL FRONTIER (OIL vs STEAM-TO-OIL RATIO)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Non-dominated solution set evaluated by NSGA-II across multi-physics domain.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              {optData?.pareto_solutions.length || 0} Non-Dominated Points
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162544" />
                <XAxis
                  type="number"
                  dataKey="oil"
                  name="Cumulative Oil"
                  unit=" bbl"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Cumulative Oil (bbl)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="sor"
                  name="Steam-to-Oil Ratio"
                  unit=""
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Steam-to-Oil Ratio (SOR)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0c1527', borderColor: '#1f345e', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Scatter
                  name="Pareto Solutions"
                  data={paretoScatterData}
                  fill="#06b6d4"
                  onClick={(node) => setSelectedSolution(node.raw)}
                >
                  {paretoScatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.raw === selectedSolution ? '#10b981' : '#06b6d4'}
                      r={entry.raw === selectedSolution ? 8 : 5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Solution Inspector */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-[#1f345e] mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                SELECTED OPERATIONAL CANDIDATE
              </h3>
            </div>

            {selectedSolution ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Utility Score:</span>
                    <span className="text-emerald-400 font-bold text-sm">{selectedSolution.utility_score || 94.2}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Safety Status: <strong className="text-white">{selectedSolution.safety.risk_level} RISK</strong> (Score: {selectedSolution.safety.safety_score}%)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Steam Volume:</span>
                    <span className="text-white font-bold">{selectedSolution.params.steam_volume_tonnes} t</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Soak Duration:</span>
                    <span className="text-white font-bold">{selectedSolution.params.soak_days} days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Stroke Length:</span>
                    <span className="text-white font-bold">{selectedSolution.params.stroke_length_in} in</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Pumping Speed:</span>
                    <span className="text-white font-bold">{selectedSolution.params.spm} SPM</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Est. Cumulative Oil:</span>
                    <strong className="text-cyan-400">{selectedSolution.objectives.cumulative_oil_bbl.toLocaleString()} bbl</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Steam-to-Oil Ratio:</span>
                    <strong className="text-amber-400">{selectedSolution.objectives.steam_to_oil_ratio}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Specific Energy:</span>
                    <strong className="text-slate-200">{selectedSolution.objectives.energy_kwh_per_bbl} kWh/bbl</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono py-8 text-center">
                Select a candidate from the Pareto plot...
              </div>
            )}
          </div>

          {selectedSolution && (
            <button
              onClick={() => onApplyToSimulator && onApplyToSimulator(selectedSolution.params)}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              Load into What-If Simulator →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function round(val: number, dec: number) {
  return Number(val.toFixed(dec));
}
