import React, { useState } from 'react';
import { CoupledState } from '../types';
import { CoupledVisualizer } from '../components/digital_twin/CoupledVisualizer';
import { Cpu, Flame, Activity, Waves, Gauge, Info, ChevronRight } from 'lucide-react';

interface DigitalTwinViewProps {
  coupledState: CoupledState | null;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ coupledState }) => {
  const [selectedTier, setSelectedTier] = useState<'all' | 'reservoir' | 'wellbore' | 'srp' | 'surface'>('all');

  if (!coupledState) {
    return <div className="p-8 text-center text-slate-400 font-mono">Loading digital twin state...</div>;
  }

  const { reservoir_tier, wellbore_tier, srp_tier, surface_tier } = coupledState;

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>4-TIER COUPLED DIGITAL TWIN ARCHITECTURE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seamless state-exchange across Reservoir Matrix → Wellbore Tubing → SRP Lift Kinematics → Surface Flowlines.
          </p>
        </div>

        {/* Filter Tiers */}
        <div className="flex items-center space-x-1 bg-[#111d35] p-1 rounded-lg border border-[#1f345e] text-xs font-mono">
          {(['all', 'reservoir', 'wellbore', 'srp', 'surface'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 rounded transition-all uppercase ${
                selectedTier === tier
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer */}
      <CoupledVisualizer state={coupledState} />

      {/* Deep-Dive Tier Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1 & 2 */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#1f345e]">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              TIER 1 & 2: RESERVOIR THERMAL & WELLBORE HYDRAULICS
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e] space-y-2">
              <div className="text-amber-400 font-bold flex items-center justify-between">
                <span>Boberg-Lantz Reservoir Heat Decay</span>
                <span className="text-[10px] text-slate-400">τ = 48.0 days</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Models cumulative sensible and latent heat transfer during steam injection, soak conduction, and conductive cooling losses to overburden & underburden rock formations.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>Temp: <strong className="text-white">{reservoir_tier.reservoir_temperature_c}°C</strong></div>
                <div>Viscosity: <strong className="text-cyan-300">{reservoir_tier.oil_viscosity_cp} cP</strong></div>
                <div>Heated Radius: <strong className="text-emerald-400">42.5 meters</strong></div>
                <div>Mobility Boost: <strong className="text-amber-300">{reservoir_tier.mobility_index_relative}x</strong></div>
              </div>
            </div>

            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e] space-y-2">
              <div className="text-indigo-400 font-bold flex items-center justify-between">
                <span>Ramey Wellbore Heat Loss & Pressure Drop</span>
                <span className="text-[10px] text-slate-400">Depth = 1,100 m</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Wellhead Temp: <strong className="text-white">{wellbore_tier.wellhead_temp_c}°C</strong></div>
                <div>Loss Gradient: <strong className="text-rose-400">-{wellbore_tier.temp_loss_gradient_c}°C</strong></div>
                <div>Frictional Loss: <strong className="text-slate-300">{wellbore_tier.flowing_friction_loss_bar} bar</strong></div>
                <div>Hydrostatic: <strong className="text-slate-300">{wellbore_tier.hydrostatic_head_bar} bar</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 3 & 4 */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#1f345e]">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              TIER 3 & 4: SRP LIFT DYNAMICS & SURFACE PRODUCTION
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e] space-y-2">
              <div className="text-cyan-400 font-bold flex items-center justify-between">
                <span>Sucker Rod Dynamic Load & Viscous Drag</span>
                <span className="text-[10px] text-slate-400">API RP 11L / Gibbs Wave</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Couples rod string acceleration harmonics with heavy-oil Couette-Poiseuille fluid drag on both upstroke and downstroke to monitor rod floatation and over-stressing.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>PPRL Load: <strong className="text-white">{srp_tier.pprl_lbs.toLocaleString()} lbs</strong></div>
                <div>MPRL Load: <strong className="text-white">{srp_tier.mprl_lbs.toLocaleString()} lbs</strong></div>
                <div>Motor Power: <strong className="text-cyan-300">{srp_tier.motor_power_kw} kW</strong></div>
                <div>Volumetric Fillage: <strong className="text-emerald-400">{srp_tier.pump_fillage_pct}%</strong></div>
              </div>
            </div>

            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e] space-y-2">
              <div className="text-emerald-400 font-bold flex items-center justify-between">
                <span>Surface Energy & Efficiency Metrics</span>
                <span className="text-[10px] text-slate-400">Real-Time Balances</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Oil Rate: <strong className="text-white">{surface_tier.oil_rate_bpd} bpd</strong></div>
                <div>Water Rate: <strong className="text-slate-300">{surface_tier.water_rate_bpd} bpd</strong></div>
                <div>SOR (Cold Equiv): <strong className="text-amber-400">{surface_tier.steam_to_oil_ratio}</strong></div>
                <div>Specific Energy: <strong className="text-cyan-300">{surface_tier.energy_kwh_per_bbl} kWh/bbl</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
