import React from 'react';
import { CoupledState } from '../../types';
import { Flame, ArrowDown, Activity, Gauge, Zap, Waves, AlertTriangle } from 'lucide-react';

interface CoupledVisualizerProps {
  state: CoupledState;
}

export const CoupledVisualizer: React.FC<CoupledVisualizerProps> = ({ state }) => {
  const { reservoir_tier, wellbore_tier, srp_tier, surface_tier } = state;

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-[#1f345e]">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#1f345e] mb-6">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>COUPLED WELL-TO-SURFACE DIGITAL TWIN MODEL</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Interdependent Physics: Reservoir Thermal Heat → Wellbore Hydraulics → SRP Dynamic Loads → Surface Production
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            Coupled Twin Sync: 100%
          </span>
        </div>
      </div>

      {/* 4-Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Tier 1: Surface Production & Drive Unit */}
        <div className="bg-[#0c1527] border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg relative group hover:border-cyan-400 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f345e]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-cyan-950 text-cyan-400">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                Tier 4: Surface
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Pumping Unit</span>
          </div>

          <div className="py-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Oil Rate:</span>
              <span className="text-white font-bold text-sm">{surface_tier.oil_rate_bpd} bpd</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Water Cut:</span>
              <span className="text-slate-200">{surface_tier.water_cut_pct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Steam-to-Oil (SOR):</span>
              <span className="text-amber-400 font-bold">{surface_tier.steam_to_oil_ratio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Specific Energy:</span>
              <span className="text-cyan-300">{surface_tier.energy_kwh_per_bbl} kWh/bbl</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1f345e] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Wellhead Temp</span>
            <span className="text-amber-400 font-bold">{wellbore_tier.wellhead_temp_c}°C</span>
          </div>
        </div>

        {/* Tier 2: Sucker Rod Pump Mechanics */}
        <div className="bg-[#0c1527] border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg relative group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f345e]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-blue-950 text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                Tier 3: SRP Lift
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Kinematics</span>
          </div>

          <div className="py-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Stroke / SPM:</span>
              <span className="text-white font-bold">{srp_tier.stroke_length_in}" @ {srp_tier.spm} SPM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Peak Load (PPRL):</span>
              <span className="text-slate-200 font-bold">{srp_tier.pprl_lbs.toLocaleString()} lbs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Min Load (MPRL):</span>
              <span className={srp_tier.is_rod_floating ? "text-rose-400 font-bold" : "text-slate-200"}>
                {srp_tier.mprl_lbs.toLocaleString()} lbs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pump Fillage:</span>
              <span className="text-emerald-400 font-bold">{srp_tier.pump_fillage_pct}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1f345e] text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Rod Rating Stress</span>
            <span className={srp_tier.rod_load_pct > 85 ? "text-rose-400 font-bold" : "text-slate-300"}>
              {srp_tier.rod_load_pct}%
            </span>
          </div>
        </div>

        {/* Tier 3: Wellbore Column & Hydraulics */}
        <div className="bg-[#0c1527] border border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg relative group hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f345e]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-indigo-950 text-indigo-400">
                <Waves className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                Tier 2: Wellbore
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{wellbore_tier.depth_m}m Tubing</span>
          </div>

          <div className="py-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Bottomhole Temp:</span>
              <span className="text-amber-400 font-bold">{wellbore_tier.bottomhole_temp_c}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tubing Temp Loss:</span>
              <span className="text-slate-200">-{wellbore_tier.temp_loss_gradient_c}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Frictional Loss:</span>
              <span className="text-slate-200">{wellbore_tier.flowing_friction_loss_bar} bar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hydrostatic Head:</span>
              <span className="text-slate-200">{wellbore_tier.hydrostatic_head_bar} bar</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1f345e] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Heat Transfer</span>
            <span className="text-cyan-400 font-mono">Ramey Thermal Model</span>
          </div>
        </div>

        {/* Tier 4: Reservoir Thermal Matrix */}
        <div className="bg-[#0c1527] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg relative group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f345e]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-amber-950 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                Tier 1: Reservoir
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">CSS Heated Zone</span>
          </div>

          <div className="py-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Reservoir Temp:</span>
              <span className="text-amber-400 font-bold text-sm">{reservoir_tier.reservoir_temperature_c}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Initial Cold Temp:</span>
              <span className="text-slate-400">{reservoir_tier.initial_temperature_c}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Crude Viscosity:</span>
              <span className="text-cyan-300 font-bold">{reservoir_tier.oil_viscosity_cp} cP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobility Index:</span>
              <span className="text-emerald-400 font-bold">{reservoir_tier.mobility_index_relative}x</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1f345e] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Boberg-Lantz Decay</span>
            <span className="text-amber-400 font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* Rod Floating / Fluid Pound Hazard Indicator */}
      {srp_tier.is_rod_floating && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center space-x-3 text-rose-300 text-xs font-mono">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            <strong>WARNING: ROD FLOATING DETECTED</strong> — High heavy-oil viscous drag on downstroke exceeds buoyant rod weight. Reduce SPM or increase stroke length immediately.
          </span>
        </div>
      )}
    </div>
  );
};
