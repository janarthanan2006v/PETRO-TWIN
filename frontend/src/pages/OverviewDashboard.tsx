import React from 'react';
import { CoupledState, HistoricalRecord, RecommendationItem } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { CoupledVisualizer } from '../components/digital_twin/CoupledVisualizer';
import {
  Droplets,
  Flame,
  Activity,
  Gauge,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
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

interface OverviewDashboardProps {
  coupledState: CoupledState | null;
  history: HistoricalRecord[];
  recommendations: RecommendationItem[];
  onNavigate: (pageId: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  coupledState,
  history,
  recommendations,
  onNavigate,
}) => {
  if (!coupledState) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 font-mono">
        <Activity className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
        Loading Coupled Digital Twin Telemetry...
      </div>
    );
  }

  const { reservoir_tier, wellbore_tier, srp_tier, surface_tier } = coupledState;
  const pendingRec = recommendations.find((r) => r.approval_status === 'PENDING_REVIEW');

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#0c1527] via-[#111d35] to-[#0c1527] border border-[#1f345e]">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <span>Well: {coupledState.well_name}</span>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              CSS Cycle 2 (Production Phase)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time coupled telemetry from Baghewala Heavy-Oil reservoir (14.5° API, 1100m depth).
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('what-if')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg font-mono transition-all shadow-lg shadow-cyan-500/20"
          >
            Launch What-If Simulator →
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Oil Production Rate"
          value={surface_tier.oil_rate_bpd}
          unit="bpd"
          delta="+18.4% vs unheated"
          deltaType="positive"
          icon={Droplets}
          colorScheme="cyan"
          subText={`Total Fluid: ${surface_tier.total_liquid_rate_bpd} bpd`}
        />
        <MetricCard
          title="Reservoir Temperature"
          value={reservoir_tier.reservoir_temperature_c}
          unit="°C"
          delta={`+${round(reservoir_tier.reservoir_temperature_c - reservoir_tier.initial_temperature_c, 1)}°C gain`}
          deltaType="positive"
          icon={Flame}
          colorScheme="amber"
          subText={`In-situ Viscosity: ${reservoir_tier.oil_viscosity_cp} cP`}
        />
        <MetricCard
          title="SRP Peak Load (PPRL)"
          value={srp_tier.pprl_lbs.toLocaleString()}
          unit="lbs"
          delta={`${srp_tier.rod_load_pct}% of Rod Rating`}
          deltaType={srp_tier.rod_load_pct > 85 ? 'negative' : 'neutral'}
          icon={Activity}
          colorScheme={srp_tier.is_rod_floating ? 'crimson' : 'purple'}
          subText={`MPRL: ${srp_tier.mprl_lbs.toLocaleString()} lbs`}
        />
        <MetricCard
          title="Steam-to-Oil Ratio (SOR)"
          value={surface_tier.steam_to_oil_ratio}
          unit="bbl/bbl"
          delta="-0.35 optimal target"
          deltaType="positive"
          icon={Zap}
          colorScheme="emerald"
          subText={`Energy: ${surface_tier.energy_kwh_per_bbl} kWh/bbl`}
        />
      </div>

      {/* Coupled Digital Twin Visualizer */}
      <CoupledVisualizer state={coupledState} />

      {/* Telemetry Charts & Recommendation Teaser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Production & Temperature Trend */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-[#1f345e]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f345e] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>60-DAY MULTI-PARAMETER COUPLED TELEMETRY</span>
              </h3>
              <p className="text-xs text-slate-400">
                Synchronized historical trends of Reservoir Cooling, Inflow Rate, and Pumping Load.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162544" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Cycle Day', position: 'insideBottom', offset: -2, fill: '#64748b' }} />
                <YAxis yAxisId="left" stroke="#06b6d4" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1527', borderColor: '#1f345e', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="oil_rate_bpd" name="Oil Rate (bpd)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="reservoir_temp_c" name="Reservoir Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="wellhead_temp_c" name="Wellhead Temp (°C)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Decision Support / Recommendation Banner */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1f345e] mb-3">
              <span className="text-xs font-bold text-cyan-400 font-mono flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <span>ACTIVE AI RECOMMENDATION</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/30">
                PENDING REVIEW
              </span>
            </div>

            {pendingRec ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {pendingRec.engineering_rationale}
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-[#070d18] rounded-xl border border-[#1f345e] text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Optimal Stroke</span>
                    <span className="text-white font-bold">{pendingRec.rec_stroke_length} in</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Optimal SPM</span>
                    <span className="text-white font-bold">{pendingRec.rec_spm} SPM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Oil Gain</span>
                    <span className="text-emerald-400 font-bold">+{pendingRec.expected_oil_gain_bpd} bpd</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Safety Score</span>
                    <span className="text-cyan-400 font-bold">{pendingRec.safety_score}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                All operational recommendations have been reviewed and resolved.
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigate('recommendations')}
            className="w-full mt-4 py-2.5 rounded-lg bg-[#111d35] hover:bg-[#162544] border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-medium transition-all"
          >
            Review Safety Gate & Audit Trail →
          </button>
        </div>
      </div>
    </div>
  );
};

function round(val: number, dec: number) {
  return Number(val.toFixed(dec));
}
