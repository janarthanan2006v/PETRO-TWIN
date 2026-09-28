import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Flame, Droplet, Thermometer, Zap, Layers, BarChart2 } from 'lucide-react';
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

interface CSSAnalysisViewProps {
  wellId: string;
}

export const CSSAnalysisView: React.FC<CSSAnalysisViewProps> = ({ wellId }) => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cData, eData] = await Promise.all([
          api.getCSSCycles(wellId),
          api.getThermalEfficiency(wellId),
        ]);
        setCycles(cData);
        setEfficiency(eData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [wellId]);

  // Synthetic Walther ASTM D341 Viscosity-Temperature dataset for plotting
  const viscosityCurveData = [
    { temp_c: 40, viscosity_cp: 5400, mobility: 0.1 },
    { temp_c: 55, viscosity_cp: 3200, mobility: 0.2 },
    { temp_c: 70, viscosity_cp: 1450, mobility: 0.5 },
    { temp_c: 90, viscosity_cp: 620, mobility: 1.2 },
    { temp_c: 110, viscosity_cp: 280, mobility: 2.8 },
    { temp_c: 130, viscosity_cp: 135, mobility: 5.5 },
    { temp_c: 150, viscosity_cp: 72, mobility: 11.2 },
    { temp_c: 180, viscosity_cp: 34, mobility: 24.5 },
    { temp_c: 210, viscosity_cp: 18, mobility: 46.0 },
  ];

  // Boberg-Lantz Cooling Decay Simulation curve
  const coolingCurveData = Array.from({ length: 90 }, (_, i) => {
    const day = i + 1;
    const peak = 198.0;
    const base = 55.0;
    const temp = base + (peak - base) * Math.exp(-day / 48.0);
    const visc = Math.max(15, 3200 * Math.exp(-0.035 * (temp - 55)));
    return {
      day,
      reservoir_temp_c: round(temp, 1),
      viscosity_cp: round(visc, 1),
      mobility_index: round(3200 / visc, 2),
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>CYCLIC STEAM STIMULATION (CSS) THERMAL ANALYSIS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Thermal enthalpy recovery, Boberg-Lantz decay simulation, and ASTM D341 heavy-oil viscosity reduction.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Current Heated Temp</span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {efficiency?.current_temperature_c || 148.5} °C
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Baseline Cold: {efficiency?.initial_temperature_c || 55.0} °C
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Viscosity Reduction</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
            {efficiency?.viscosity_reduction_factor || 33.7}x
          </div>
          <span className="text-xs text-emerald-400 font-mono mt-1 block">
            3,200 cP → ~95 cP
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Thermal Retention</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {efficiency?.thermal_retention_pct || 74.2} %
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Heated Radius: ~{efficiency?.estimated_heated_radius_m || 42.5} m
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-purple-500/20">
          <span className="text-xs text-slate-400 uppercase font-mono">Total Steam Injected</span>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
            4,300 t
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Across 2 CSS Cycles
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Temperature Decay & Viscosity Rebound */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e]">
          <div className="pb-3 border-b border-[#1f345e] mb-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>BOBERG-LANTZ THERMAL DECAY & VISCOSITY REBOUND</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cooling trajectory over 90-day production cycle and resulting viscosity escalation.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={coolingCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162544" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Cycle Day', position: 'insideBottom', offset: -2, fill: '#64748b' }} />
                <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 11 }} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fontSize: 11 }} label={{ value: 'Viscosity (cP)', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0c1527', borderColor: '#1f345e', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="reservoir_temp_c" name="Reservoir Temp (°C)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="viscosity_cp" name="Oil Viscosity (cP)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Heavy-Oil Walther Viscosity Equation */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e]">
          <div className="pb-3 border-b border-[#1f345e] mb-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Droplet className="w-4 h-4 text-cyan-400" />
              <span>ASTM D341 / WALTHER VISCOSITY vs TEMPERATURE</span>
            </h3>
            <p className="text-xs text-slate-400">
              Heavy-oil fluid mobility response: log10(log10(v + 0.7)) = A - B*log10(T).
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viscosityCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162544" />
                <XAxis dataKey="temp_c" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -2, fill: '#64748b' }} />
                <YAxis stroke="#06b6d4" tick={{ fontSize: 11 }} label={{ value: 'Viscosity (cP)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0c1527', borderColor: '#1f345e', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="viscosity_cp" name="Viscosity (cP)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Cycles Table */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f345e]">
        <div className="pb-3 border-b border-[#1f345e] mb-3">
          <h3 className="text-sm font-bold text-white font-mono">
            CSS HISTORICAL INJECTION & SOAK CYCLES
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left text-slate-300">
            <thead className="bg-[#070d18] text-slate-400 uppercase text-[10px] border-b border-[#1f345e]">
              <tr>
                <th className="py-2.5 px-3">Cycle #</th>
                <th className="py-2.5 px-3">Steam Vol (t)</th>
                <th className="py-2.5 px-3">Injection Press (bar)</th>
                <th className="py-2.5 px-3">Steam Temp (°C)</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3">Soak (Days)</th>
                <th className="py-2.5 px-3">Peak Temp (°C)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f345e]/50">
              {cycles.map((c) => (
                <tr key={c.id} className="hover:bg-[#111d35]/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">Cycle {c.cycle_number}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{c.steam_volume_tonnes}</td>
                  <td className="py-2.5 px-3">{c.steam_pressure_bar}</td>
                  <td className="py-2.5 px-3 text-amber-400">{c.steam_temp_c}</td>
                  <td className="py-2.5 px-3">{c.steam_quality}</td>
                  <td className="py-2.5 px-3">{c.soak_days}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-300">{c.peak_bottomhole_temp_c}°C</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function round(val: number, dec: number) {
  return Number(val.toFixed(dec));
}
